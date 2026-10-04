import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type SupportChatContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openChat: () => void;
};

const SupportChatContext = createContext<SupportChatContextValue | null>(null);

export function SupportChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openChat = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ open, setOpen, openChat }), [open, openChat]);
  return <SupportChatContext.Provider value={value}>{children}</SupportChatContext.Provider>;
}

export function useSupportChat(): SupportChatContextValue {
  const ctx = useContext(SupportChatContext);
  if (!ctx) {
    throw new Error('useSupportChat must be used inside SupportChatProvider');
  }
  return ctx;
}
