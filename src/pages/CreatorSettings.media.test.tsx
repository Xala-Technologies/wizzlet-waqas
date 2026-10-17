import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getFunctionName } from 'convex/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CreatorSettings from './CreatorSettings';
const f=vi.hoisted(()=>({creator:{_id:'creator1',username:'testcreator',displayName:'Test Creator',bio:'Saved bio',avatarUrl:'https://image.example/old'},update:vi.fn(),upload:vi.fn(),error:vi.fn()}));
vi.mock('convex/react',()=>({useConvex:()=>({}),useMutation:()=>f.update,useAction:()=>vi.fn(),useQuery:(ref:Parameters<typeof getFunctionName>[0])=>{
  const name=getFunctionName(ref); if(name==='creators/queries:myCreator') return f.creator;
  if(name==='users/queries:me')return {_id:'user1',email:'fixture@example.invalid'};
  return undefined;
}}));
vi.mock('@/lib/upload',()=>({uploadToConvexStorage:f.upload}));
vi.mock('sonner',()=>({toast:{error:f.error,success:vi.fn(),message:vi.fn()}}));
vi.mock('@/components/dashboard/DashboardLayout',()=>({DashboardLayout:({children}:{children:React.ReactNode})=>children}));
vi.mock('@/components/account/EmailChangeOtpDialog',()=>({EmailChangeOtpDialog:()=>null}));
vi.mock('@/components/account/TotpManageCard',()=>({TotpManageCard:()=>null}));
beforeEach(()=>{vi.resetAllMocks();localStorage.clear();f.update.mockResolvedValue('creator1');});
afterEach(cleanup);
function show(tab='general'){return render(<MemoryRouter initialEntries={[`/creator/settings?demo=0&tab=${tab}`]}><CreatorSettings/></MemoryRouter>);}
it.each(['general','branding'])('%s removal sends an explicit clear and does not restore the cached logo',async tab=>{
  show(tab); fireEvent.click(screen.getByRole('button',{name:tab==='general'?'Remove photo':'Remove logo'}));
  fireEvent.click(screen.getByRole('button',{name:'Save Changes'}));
  await waitFor(()=>expect(f.update).toHaveBeenCalled());
  expect(f.update.mock.calls[0][0].avatarUrl).toBeNull();
  await waitFor(()=>expect(JSON.parse(localStorage.getItem('prizelet.creator.branding.creator1')!).logoUrl).toBe(''));
});
it('a failed save retains removal and permits retry',async()=>{
  f.update.mockRejectedValueOnce(new Error('Offline'));show();
  fireEvent.click(screen.getByRole('button',{name:'Remove photo'}));fireEvent.click(screen.getByRole('button',{name:'Save Changes'}));
  await waitFor(()=>expect(f.error).toHaveBeenCalledWith('Offline'));
  expect(screen.getByRole('button',{name:'Remove photo'})).toBeDisabled();
  fireEvent.click(screen.getByRole('button',{name:'Save Changes'}));await waitFor(()=>expect(f.update).toHaveBeenCalledTimes(2));
  expect(f.update.mock.calls[1][0].avatarUrl).toBeNull();
});
it('blocks save and removal during upload, then retains the old image on failure',async()=>{
  let fail!:(error:Error)=>void;f.upload.mockImplementation(()=>new Promise((_,reject)=>{fail=reject}));
  const view=show();fireEvent.change(view.container.querySelector('input[type="file"]')!,{target:{files:[new File(['fixture'],'image.png',{type:'image/png'})]}});
  expect(screen.getByRole('button',{name:'Save Changes'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Remove photo'})).toBeDisabled();
  await act(async()=>fail(new Error('Offline')));
  expect(screen.getByRole('button',{name:'Remove photo'})).toBeEnabled();
  expect(view.container.querySelector('img')?.getAttribute('src')).toBe('https://image.example/old');
});

vi.mock('@/components/account/SessionManagementCard', () => ({ SessionManagementCard: () => null }));
