import { useCallback, useRef } from 'react';

/** Return focus for controlled dialogs opened by buttons outside a DialogTrigger. */
export function useDialogFocusReturn() {
  const opener = useRef<HTMLElement | null>(null);
  const rememberOpener = useCallback((element: HTMLElement) => { opener.current = element; }, []);
  const restoreFocus = useCallback((event: Event) => {
    if (opener.current?.isConnected) {
      event.preventDefault();
      opener.current.focus();
    }
  }, []);
  return { rememberOpener, restoreFocus };
}
