import { useEffect, useState } from 'react';

function readDocumentDark(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

/** Tracks `html.dark` so chrome (e.g. sidebars) can follow ThemeToggle. */
export function useDocumentDark(): boolean {
  const [dark, setDark] = useState(readDocumentDark);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(readDocumentDark());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return dark;
}
