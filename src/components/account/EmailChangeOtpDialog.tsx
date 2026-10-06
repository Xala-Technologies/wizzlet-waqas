import { useEffect, useMemo, useState } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'email' | 'code';

export function EmailChangeOtpDialog({
  open,
  onOpenChange,
  demo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demo?: boolean;
}) {
  const { user, signOut } = useAuth();
  const startEmailChange = useAction(api.accountRequests.startEmailChange);
  const resendEmailChangeOtp = useAction(api.accountRequests.resendEmailChangeOtp);
  const verifyEmailChangeOtp = useMutation(api.accountRequests.verifyEmailChangeOtp);
  const myAccountRequests = useQuery(api.accountRequests.listMine, user && !demo ? {} : 'skip');

  const [step, setStep] = useState<Step>('email');
  const [requestedEmail, setRequestedEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const openRequest = useMemo(
    () => myAccountRequests?.find((r) => r.category === 'email_change' && r.status === 'open'),
    [myAccountRequests],
  );

  useEffect(() => {
    if (!open) return;
    if (openRequest?.requestedEmail) {
      setRequestedEmail(openRequest.requestedEmail);
      setStep('code');
    }
  }, [open, openRequest?.requestedEmail]);

  const reset = () => {
    setStep('email');
    setRequestedEmail('');
    setCode('');
    setDevCode(null);
    setBusy(false);
  };

  const close = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleError = (e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('REQUEST_ALREADY_OPEN')) toast.error('You already have an open request');
    else if (msg.includes('EMAIL_UNCHANGED')) toast.error('That is already your email');
    else if (msg.includes('INVALID_EMAIL')) toast.error('Enter a valid email');
    else if (msg.includes('EMAIL_TAKEN')) toast.error('That email is already in use');
    else if (msg.includes('OTP_RESEND_COOLDOWN')) toast.error('Wait a minute before requesting another code');
    else if (msg.includes('OTP_EXPIRED')) toast.error('Code expired — request a new one');
    else if (msg.includes('OTP_LOCKED')) toast.error('Too many attempts — request a new code');
    else if (msg.includes('OTP_INVALID') || msg.includes('INVALID_OTP')) toast.error('That code is incorrect');
    else if (msg.includes('MAILER_NOT_CONFIGURED')) {
      toast.error('Email sending is not configured yet — support can still fulfill from Users');
    } else toast.error(msg);
  };

  const sendCode = async () => {
    if (busy || !requestedEmail.trim()) return;
    if (demo) {
      toast.message('Sample preview — email change needs a live account.');
      return;
    }
    setBusy(true);
    try {
      const result = await startEmailChange({ requestedEmail: requestedEmail.trim() });
      setDevCode(result.devCode ?? null);
      setStep('code');
      toast.success(
        result.delivery === 'dev'
          ? 'Dev code issued (no mailer on this deployment).'
          : `Code sent to ${requestedEmail.trim().toLowerCase()}`,
      );
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (busy) return;
    if (demo) {
      toast.message('Sample preview — email change needs a live account.');
      return;
    }
    setBusy(true);
    try {
      const result = await resendEmailChangeOtp({});
      setDevCode(result.devCode ?? null);
      toast.success(result.delivery === 'dev' ? 'New dev code issued.' : 'A new code was sent.');
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (busy || code.length !== 6) return;
    if (demo) {
      toast.message('Sample preview — email change needs a live account.');
      return;
    }
    setBusy(true);
    try {
      await verifyEmailChangeOtp({ code });
      toast.success('Email updated — sign in with the new address');
      close(false);
      await signOut();
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === 'email' ? 'Change sign-in email' : 'Enter verification code'}</DialogTitle>
          <DialogDescription>
            {step === 'email'
              ? 'We send a 6-digit code to the new address. Your sign-in email does not change until the code is verified.'
              : `Enter the 6-digit code sent to ${openRequest?.requestedEmail ?? requestedEmail.trim().toLowerCase()}.`}
          </DialogDescription>
        </DialogHeader>
        {step === 'email' ? (
          <div className="space-y-3 py-2">
            <Input
              type="email"
              className="h-11 rounded-xl"
              placeholder="New email address"
              value={requestedEmail}
              onChange={(e) => setRequestedEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <InputOTP maxLength={6} value={code} onChange={setCode} disabled={busy}>
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            {devCode ? (
              <p className="text-xs text-amber-700">
                Dev delivery (not emailed): <span className="font-mono font-semibold">{devCode}</span>
              </p>
            ) : null}
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline"
              onClick={() => void resend()}
              disabled={busy}
            >
              Resend code
            </button>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          {step === 'email' ? (
            <Button type="button" disabled={busy || !requestedEmail.trim()} onClick={() => void sendCode()}>
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Send code
            </Button>
          ) : (
            <Button type="button" disabled={busy || code.length !== 6} onClick={() => void verify()}>
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Verify and update
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
