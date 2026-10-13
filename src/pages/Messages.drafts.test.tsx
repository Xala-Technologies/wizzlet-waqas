import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getFunctionName } from 'convex/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { draftKey, messageDraftSchema, readDraft, removeDraft } from '@/lib/formDrafts';
import CreatorMessages from './CreatorMessages';
import CustomerMessages from './CustomerMessages';

const f = vi.hoisted(() => ({ send: vi.fn(), other: vi.fn(), role: 'member', active: true }));
const rows = ['a', 'b'].map((id, i) => ({
  _id: `msg-${id}`, creatorId: `creator-${id}`, subscriberId: `subscriber-${id}`,
  body: `Previous ${id}`, senderRole: 'subscriber', read: true, createdAt: 1000 + i,
}));
vi.mock('convex/react', () => ({
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
    const name = getFunctionName(ref);
    if (name === 'subscriptions/mutations:mySubscriptionsDetailed') return ['a', 'b'].map(id => ({
      creator: { _id: `creator-${id}`, displayName: `Person ${id}`, username: `person_${id}` },
      status: f.active ? 'active' : 'cancelled',
    }));
    if (name === 'subscriptions/mutations:listSubscribersDetailed') return ['a', 'b'].map(id => ({
      userId: `subscriber-${id}`, user: { fullName: `Person ${id}` }, status: f.active ? 'active' : 'cancelled', createdAt: 1000,
    }));
    return [];
  },
  usePaginatedQuery: () => ({ results: rows, status: 'Exhausted', loadMore: vi.fn() }),
  useMutation: (ref: Parameters<typeof getFunctionName>[0]) => getFunctionName(ref) === 'messaging/mutations:send' ? f.send : f.other,
}));
vi.mock('@/hooks/useCreatorProfile', () => ({ useCreatorProfile: () => ({ creator: { id: 'owner-creator', messaging_enabled: true }, loading: false }) }));
vi.mock('@/hooks/useAppUser', () => ({ useAppUser: () => ({ appUserId: 'owner-member', loading: false }) }));
vi.mock('@/components/dashboard/DashboardLayout', () => ({ DashboardLayout: ({children}: {children: React.ReactNode}) => children }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() } }));
function key(role: string, id: string) {
  return draftKey(`owner-${role}`, `${role}-message:${role === 'creator' ? 'subscriber' : 'creator'}-${id}`);
}
function show(role: string) {
  return render(<MemoryRouter initialEntries={[role === 'creator' ? '/creator/messages?demo=0&subscriberId=subscriber-a' : '/dashboard/messages?demo=0&creatorId=creator-a']}>
    {role === 'creator' ? <CreatorMessages /> : <CustomerMessages />}
  </MemoryRouter>);
}
beforeEach(() => {
  f.send.mockReset(); f.other.mockResolvedValue(undefined); f.active = true;
  Element.prototype.scrollIntoView = vi.fn();
  for (const role of ['creator', 'member']) for (const id of ['a', 'b']) removeDraft(key(role, id));
});
afterEach(cleanup);
for (const role of ['creator', 'member']) describe(`${role} replies`, () => {
  it('keeps a failed send recoverable, then clears only after a successful retry', async () => {
    f.send.mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(undefined);
    let view = show(role);
    fireEvent.change(await screen.findByRole('textbox', {name: 'Message'}), {target: {value: 'Unsent body'}});
    fireEvent.click(screen.getByRole('button', {name: 'Send'}));
    await waitFor(() => expect(f.send).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByRole('button', {name: 'Send'})).toBeEnabled());
    expect(readDraft(key(role, 'a'), messageDraftSchema)?.data.body).toBe('Unsent body');
    view.unmount(); view = show(role);
    expect(await screen.findByRole('textbox', {name: 'Message'})).toHaveValue('Unsent body');
    fireEvent.click(screen.getByRole('button', {name: 'Send'}));
    await waitFor(() => expect(readDraft(key(role, 'a'), messageDraftSchema)).toBeNull());
    expect(f.send).toHaveBeenLastCalledWith(expect.objectContaining({body:'Unsent body', senderRole: role === 'creator' ? 'creator' : 'subscriber'}));
    view.unmount();
  });
  it('a pending send cannot erase another conversation or leave the sent body recoverable', async () => {
    let finish!: () => void;
    f.send.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    show(role);
    fireEvent.change(await screen.findByRole('textbox', {name:'Message'}), {target:{value:'Send A'}});
    fireEvent.click(screen.getByRole('button',{name:'Send'}));
    fireEvent.click(screen.getByRole('button',{name:/Person b/}));
    expect(screen.getByRole('textbox',{name:'Message'})).toHaveValue('');
    await act(async () => finish());
    fireEvent.change(screen.getByRole('textbox',{name:'Message'}),{target:{value:'Keep B'}});
    expect(readDraft(key(role,'a'),messageDraftSchema)).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:/Person a/}));
    expect(screen.getByRole('textbox',{name:'Message'})).toHaveValue('');
    fireEvent.click(screen.getByRole('button',{name:/Person b/}));
    expect(screen.getByRole('textbox',{name:'Message'})).toHaveValue('Keep B');
    expect(f.send).toHaveBeenCalledOnce();
  });
  it('discard removes only the active conversation without sending', async () => {
    show(role);
    fireEvent.change(await screen.findByRole('textbox',{name:'Message'}),{target:{value:'Keep A'}});
    fireEvent.click(screen.getByRole('button',{name:/Person b/}));
    fireEvent.change(screen.getByRole('textbox',{name:'Message'}),{target:{value:'Discard B'}});
    fireEvent.click(screen.getByRole('button',{name:'Discard draft'}));
    fireEvent.click(screen.getByRole('button',{name:'Discard changes'}));
    expect(readDraft(key(role,'b'),messageDraftSchema)).toBeNull();
    expect(readDraft(key(role,'a'),messageDraftSchema)?.data.body).toBe('Keep A');
    expect(f.send).not.toHaveBeenCalled();
  });
});
it('member edits typed during a send survive its success', async () => {
  let finish!: () => void;
  f.send.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
  show('member');
  fireEvent.change(await screen.findByRole('textbox',{name:'Message'}),{target:{value:'Submitted'}});
  fireEvent.click(screen.getByRole('button',{name:'Send'}));
  fireEvent.change(screen.getByRole('textbox',{name:'Message'}),{target:{value:'Next reply'}});
  await act(async () => finish());
  expect(screen.getByRole('textbox',{name:'Message'})).toHaveValue('Next reply');
  expect(readDraft(key('member','a'),messageDraftSchema)?.data.body).toBe('Next reply');
});
