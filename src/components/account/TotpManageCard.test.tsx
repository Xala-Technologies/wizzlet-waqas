import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { getFunctionName } from 'convex/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { TotpManageCard } from './TotpManageCard';
const f = vi.hoisted(() => ({ enabled: false, start: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'member' } }) }));
vi.mock('convex/react', () => ({
  useQuery: () => ({ totpEnabled: f.enabled, backupCodesRemaining: 8 }),
  useMutation: (ref: Parameters<typeof getFunctionName>[0]) => getFunctionName(ref) === 'mfa:startEnroll' ? f.start : vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
beforeEach(() => {
  f.enabled = false; f.start.mockResolvedValue({ secret: 'TESTONLY', otpauthUrl: 'otpauth://totp/test' });
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('labels the authenticator input during enrollment', async () => {
  render(<TotpManageCard />);
  fireEvent.click(screen.getByRole('switch', { name: 'Two-factor authentication' }));
  expect(await screen.findByRole('textbox', { name: 'Authenticator code' })).toBeInTheDocument();
});
it.each(['disable', 'regenerate'])('labels the authenticator input when users %s MFA credentials', mode => {
  f.enabled = true; render(<TotpManageCard />);
  fireEvent.click(mode === 'disable' ? screen.getByRole('switch', { name: 'Two-factor authentication' }) : screen.getByRole('button', { name: 'Regenerate backup codes' }));
  expect(screen.getByRole('textbox', { name: 'Authenticator code' })).toBeInTheDocument();
});
