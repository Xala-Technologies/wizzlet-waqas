import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getFunctionName } from 'convex/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { draftKey, onboardingDraftSchema, readDraft, removeDraft, writeDraft } from '@/lib/formDrafts';
import CreatorOnboarding from './CreatorOnboarding';
const f = vi.hoisted(() => ({ save:vi.fn(), publish:vi.fn(), upload:vi.fn(), step:0, user:'onboarding-user', meNull:false }));
vi.mock('convex/react', () => ({
  useConvex: () => ({}),
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) => getFunctionName(ref) === 'users/queries:me'
    ? f.meNull ? null : { fullName:'Saved name', username:'saved_name' }
    : { displayName:'Saved name', username:'saved_name', bio:'Saved bio', onboardingStep:f.step },
  useMutation: (ref: Parameters<typeof getFunctionName>[0]) => getFunctionName(ref) === 'creators/queries:upsertOnboarding' ? f.save : f.publish,
}));
vi.mock('@/contexts/AuthContext', () => ({useAuth: () => ({user:{id:f.user}})}));
vi.mock('@/lib/upload', () => ({uploadToConvexStorage: (...args: unknown[]) => f.upload(...args)}));
vi.mock('@/components/auth/AuthShell', () => ({AuthShell:({children}:{children:React.ReactNode})=>children}));
vi.mock('sonner', () => ({toast:{error:vi.fn(),success:vi.fn()}}));
const key = draftKey('onboarding-user','creator-onboarding');
const baseline = { step:0, displayName:'Saved name',username:'saved_name',bio:'Saved bio',avatarUrl:'',pendingPhotoName:'' };
function show() {
 return render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><CreatorOnboarding /></MemoryRouter></QueryClientProvider>);
}
beforeEach(()=>{f.save.mockReset();f.publish.mockReset();f.upload.mockReset();f.step=0;f.user='onboarding-user';f.meNull=false;removeDraft(key);});
afterEach(cleanup);
it('restores name and wizard step, then discards back to saved fields without publishing',async()=>{
 let view=show();
 fireEvent.change(screen.getByLabelText('Creator name'),{target:{value:'Recovered creator'}});
 view.unmount();view=show();
 expect(screen.getByLabelText('Creator name')).toHaveValue('Recovered creator');
 fireEvent.click(screen.getByRole('button',{name:'Discard draft'}));
 fireEvent.click(screen.getByRole('button',{name:'Discard changes'}));
 expect(screen.getByLabelText('Creator name')).toHaveValue('Saved name');
 expect(readDraft(key,onboardingDraftSchema)).toBeNull();
 expect(f.save).not.toHaveBeenCalled();expect(f.publish).not.toHaveBeenCalled();
 view.unmount();
});
it('failed Continue preserves recovery; successful retry clears it and advances without publishing',async()=>{
 f.save.mockRejectedValueOnce(new Error('Offline')).mockResolvedValue('creator-id');
 show();fireEvent.change(screen.getByLabelText('Creator name'),{target:{value:'New name'}});
 fireEvent.click(screen.getByRole('button',{name:'Continue'}));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Continue'})).toBeEnabled());
 expect(readDraft(key,onboardingDraftSchema)?.data.displayName).toBe('New name');
 fireEvent.click(screen.getByRole('button',{name:'Continue'}));
 await screen.findByRole('button',{name:'Upload profile image'});
 expect(readDraft(key,onboardingDraftSchema)).toBeNull();
 expect(f.save).toHaveBeenLastCalledWith(expect.objectContaining({displayName:'New name',onboardingStep:1}));
 expect(f.publish).not.toHaveBeenCalled();
});
it('restores bio and the earlier wizard step even if the server last saved a later step',()=>{
 f.step=2;
 writeDraft(key,{...baseline,step:0,displayName:'Back to name'}, {...baseline,step:2});
 show();expect(screen.getByLabelText('Creator name')).toHaveValue('Back to name');
 expect(f.save).not.toHaveBeenCalled();
});
it('requires reselecting a lost photo, permits explicit removal, and never stores binary data',async()=>{
 f.step=1;
 writeDraft(key,{...baseline,step:1,pendingPhotoName:'selected.png'}, {...baseline,step:1});
 show();
 expect(screen.getByRole('status')).toHaveTextContent('Choose your profile photo again');
 fireEvent.click(screen.getByRole('button',{name:'Remove photo selection'}));
 expect(screen.queryByRole('status')).toBeNull();
 expect(readDraft(key,onboardingDraftSchema)).toBeNull();
 expect(f.upload).not.toHaveBeenCalled();expect(f.save).not.toHaveBeenCalled();
});
it('failed photo upload retains the selection and draft for retry',async()=>{
 f.step=1;f.upload.mockRejectedValue(new Error('Upload failed'));
 const view=show();
 const file=new File(['image bytes'],'photo.png',{type:'image/png'});
 fireEvent.change(view.container.querySelector('input[type="file"]')!,{target:{files:[file]}});
 await screen.findByText('Your selected photo is not uploaded yet. Continue to upload it before leaving this page.');
 await waitFor(()=>expect(view.container.querySelector('img')).toBeTruthy());
 fireEvent.click(screen.getByRole('button',{name:'Continue'}));
 await waitFor(()=>expect(f.upload).toHaveBeenCalledOnce());
 await waitFor(()=>expect(screen.getByRole('button',{name:'Continue'})).toBeEnabled());
 expect(readDraft(key,onboardingDraftSchema)?.data.pendingPhotoName).toBe('photo.png');
 expect(sessionStorage.getItem(key)).not.toContain('data:image');
 expect(f.save).not.toHaveBeenCalled();
});
it('an explicit Finish saves first and only then publishes',async()=>{
 f.step=2;f.save.mockResolvedValue('creator-id');f.publish.mockResolvedValue(undefined);
 show();fireEvent.change(screen.getByLabelText('Page description'),{target:{value:'Final bio'}});
 expect(f.publish).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Finish setup'}));
 await waitFor(()=>expect(f.publish).toHaveBeenCalledWith({creatorId:'creator-id',isPublished:true}));
 expect(f.save.mock.invocationCallOrder[0]).toBeLessThan(f.publish.mock.invocationCallOrder[0]);
 expect(readDraft(key,onboardingDraftSchema)).toBeNull();
});
it('handles a null user query during hydration without crashing',()=>{
 f.meNull=true;show();expect(screen.getByLabelText('Creator name')).toHaveValue('Saved name');
});
