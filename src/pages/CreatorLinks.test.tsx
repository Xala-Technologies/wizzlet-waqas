import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CreatorLinks from './CreatorLinks';

const fixture = vi.hoisted(() => ({ save: vi.fn(), error: vi.fn(), success: vi.fn() }));
vi.mock('convex/react', () => ({ useQuery: () => [], useMutation: () => fixture.save }));
vi.mock('@/hooks/useCreatorProfile', () => ({ useCreatorProfile: () => ({ creator: { id: 'creator' }, loading: false }) }));
vi.mock('@/components/dashboard/DashboardLayout', () => ({ DashboardLayout: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('sonner', () => ({ toast: { error: fixture.error, success: fixture.success, message: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
function open() {
  fireEvent.click(screen.getAllByRole('button', { name: 'Create Link' })[0]);
  return within(screen.getByRole('dialog'));
}
function show() { render(<MemoryRouter initialEntries={['/?demo=0']}><CreatorLinks /></MemoryRouter>); }

it.each(['Cancel', 'Escape'])('%s discards the link draft', async (close) => {
  show(); const dialog = open();
  fireEvent.change(dialog.getByLabelText('Link name'), { target: { value: 'Discarded link' } });
  fireEvent.change(dialog.getByLabelText('Destination URL'), { target: { value: 'https://example.com/test' } });
  if (close === 'Cancel') fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
  else fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  const reopened = open();
  expect(reopened.getByLabelText('Link name')).toHaveValue('');
  expect(reopened.getByLabelText('Destination URL')).toHaveValue('');
  expect(fixture.save).not.toHaveBeenCalled();
});

it('empty fields do not create a link', () => {
  show(); const dialog = open();
  fireEvent.click(dialog.getByRole('button', { name: 'Create link' }));
  expect(fixture.save).not.toHaveBeenCalled();
  expect(dialog.getByRole('button', { name: 'Create link' })).toBeDisabled();
});

it.each(['not-a-url', 'javascript:void(0)', 'data:text/plain,hello'])('keeps invalid destination %s editable without saving', (url) => {
  show(); const dialog = open();
  fireEvent.change(dialog.getByLabelText('Link name'), { target: { value: 'Test link' } });
  fireEvent.change(dialog.getByLabelText('Destination URL'), { target: { value: url } });
  fireEvent.click(dialog.getByRole('button', { name: 'Create link' }));
  expect(fixture.save).not.toHaveBeenCalled();
  expect(dialog.getByRole('alert')).toHaveTextContent('Enter a complete http:// or https:// URL');
  expect(dialog.getByLabelText('Destination URL')).toHaveValue(url);
});

it('a pending save cannot lose its draft or create duplicates, and a failed save can retry', async () => {
  let reject!: (e: Error) => void;
  fixture.save.mockImplementationOnce(() => new Promise((_, rejectPromise) => { reject = rejectPromise; }));
  show(); const dialog = open();
  fireEvent.change(dialog.getByLabelText('Link name'), { target: { value: 'Test link' } });
  fireEvent.change(dialog.getByLabelText('Destination URL'), { target: { value: 'https://example.com/test' } });
  fireEvent.click(dialog.getByRole('button', { name: 'Create link' }));
  fireEvent.click(dialog.getByRole('button', { name: 'Create link' }));
  expect(fixture.save).toHaveBeenCalledTimes(1);
  expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await act(async () => reject(new Error('Network unavailable')));
  expect(fixture.error).toHaveBeenCalledWith('Network unavailable');
  expect(dialog.getByLabelText('Link name')).toHaveValue('Test link');
  fixture.save.mockResolvedValue(undefined);
  fireEvent.click(dialog.getByRole('button', { name: 'Create link' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(fixture.save).toHaveBeenCalledTimes(2);
  const reopened = open();
  expect(reopened.getByLabelText('Link name')).toHaveValue('');
  expect(reopened.getByLabelText('Destination URL')).toHaveValue('');
});
