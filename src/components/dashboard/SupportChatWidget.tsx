import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { MessageCircle, Paperclip, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupportChat } from '@/contexts/SupportChatContext';
import { cn } from '@/lib/utils';

type Audience = 'creator' | 'member';

type ChatBubble = {
  id: string;
  body: string;
  fromSupport: boolean;
  createdAt: number;
  read: boolean;
};

function welcomeLine(displayName?: string | null): string {
  const first = displayName?.trim().split(/\s+/)[0];
  if (first) return `Hi ${first}! How can we help you today?`;
  return 'Hi! How can we help you today?';
}

/**
 * Floating support chat FAB + panel for creator and member dashboards (PO mock).
 */
export function SupportChatWidget({ audience }: { audience: Audience }) {
  const { open, setOpen } = useSupportChat();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const markedRef = useRef<string>('');

  const myCreator = useQuery(
    api.creators.queries.myCreator,
    audience === 'creator' ? {} : 'skip',
  );
  const creatorRows = useQuery(
    api.support.mutations.listForMyCreator,
    audience === 'creator' ? {} : 'skip',
  );
  const memberRows = useQuery(
    api.support.mutations.listForMember,
    audience === 'member' ? {} : 'skip',
  );

  const sendCreator = useMutation(api.support.mutations.send);
  const markReadCreator = useMutation(api.support.mutations.markReadCreator);
  const sendMember = useMutation(api.support.mutations.sendMember);
  const markReadMember = useMutation(api.support.mutations.markReadMember);

  const bubbles: ChatBubble[] = useMemo(() => {
    if (audience === 'creator') {
      const rows = (creatorRows ?? [])
        .filter((m) => (m.channel ?? 'support') === 'support')
        .sort((a, b) => a.createdAt - b.createdAt);
      return rows.map((m) => ({
        id: m._id,
        body: m.body,
        fromSupport: m.senderRole === 'admin',
        createdAt: m.createdAt,
        read: m.read,
      }));
    }
    const rows = [...(memberRows ?? [])].sort((a, b) => a.createdAt - b.createdAt);
    return rows.map((m) => ({
      id: m._id,
      body: m.body,
      fromSupport: m.senderRole === 'admin',
      createdAt: m.createdAt,
      read: m.read,
    }));
  }, [audience, creatorRows, memberRows]);

  const unread = bubbles.filter((b) => b.fromSupport && !b.read).length;

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [open, bubbles.length]);

  useEffect(() => {
    if (!open) return;
    const unreadIds = bubbles.filter((b) => b.fromSupport && !b.read).map((b) => b.id);
    if (unreadIds.length === 0) return;
    const key = unreadIds.join(',');
    if (markedRef.current === key) return;
    markedRef.current = key;
    if (audience === 'creator') {
      void markReadCreator({ messageIds: unreadIds as Id<'supportMessages'>[] }).catch(() => {
        markedRef.current = '';
      });
    } else {
      void markReadMember({ messageIds: unreadIds as Id<'memberSupportMessages'>[] }).catch(() => {
        markedRef.current = '';
      });
    }
  }, [open, bubbles, audience, markReadCreator, markReadMember]);

  const onSend = async (e?: FormEvent) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    if (audience === 'creator') {
      if (!myCreator?._id) {
        toast.error('Finish creator onboarding to message support.');
        return;
      }
      setSending(true);
      try {
        await sendCreator({
          creatorId: myCreator._id,
          body,
          senderRole: 'creator',
          channel: 'support',
        });
        setDraft('');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not send message');
      } finally {
        setSending(false);
      }
      return;
    }

    setSending(true);
    try {
      await sendMember({ body, senderRole: 'member' });
      setDraft('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ms: number) =>
    new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <div
          className={cn(
            'pointer-events-auto flex w-[min(100vw-1.5rem,380px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_50px_rgba(8,24,47,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)]',
            'h-[min(70vh,520px)]',
          )}
          role="dialog"
          aria-label="Prizelet Support chat"
        >
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary">
              <img
                src="/brand/sweeph-symbol-light.png"
                alt=""
                className="h-6 w-6 object-contain"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">Prizelet Support</p>
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                Online
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close support chat"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[var(--bg-page)] px-4 py-4">
            {/* Welcome bubble when empty */}
            {bubbles.length === 0 ? (
              <div className="flex items-end gap-2">
                <span className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary">
                  <img src="/brand/sweeph-symbol-light.png" alt="" className="h-4 w-4 object-contain" />
                </span>
                <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
                  {welcomeLine(myCreator?.displayName)}
                </div>
              </div>
            ) : null}

            {bubbles.map((b) => (
              <div
                key={b.id}
                className={cn('flex items-end gap-2', b.fromSupport ? 'justify-start' : 'justify-end')}
              >
                {b.fromSupport ? (
                  <span className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary">
                    <img
                      src="/brand/sweeph-symbol-light.png"
                      alt=""
                      className="h-4 w-4 object-contain"
                    />
                  </span>
                ) : null}
                <div className="max-w-[85%]">
                  <div
                    className={cn(
                      'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      b.fromSupport
                        ? 'rounded-bl-md bg-muted text-foreground'
                        : 'rounded-br-md bg-primary text-primary-foreground',
                    )}
                  >
                    {b.body}
                  </div>
                  <p
                    className={cn(
                      'mt-1 text-[10px] font-medium text-muted-foreground',
                      b.fromSupport ? 'text-left' : 'text-right',
                    )}
                  >
                    {formatTime(b.createdAt)}
                    {!b.fromSupport && b.read ? ' · Read' : null}
                  </p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={onSend}
            className="flex items-center gap-2 border-t border-border bg-card px-3 py-3"
          >
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Attach file"
              onClick={() => toast.message('File attachments coming soon')}
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              className="h-11 flex-1 rounded-full border-border bg-muted/40 px-4 text-sm shadow-none"
              disabled={sending}
              aria-label="Support message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={sending || !draft.trim()}
              className="h-11 w-11 shrink-0 rounded-full"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'pointer-events-auto relative inline-flex h-14 w-14 items-center justify-center rounded-full',
          'bg-primary text-primary-foreground shadow-[0_12px_32px_rgba(88,70,245,0.35)]',
          'transition-transform hover:scale-105 hover:bg-primary/90',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)]',
        )}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>
    </div>
  );
}
