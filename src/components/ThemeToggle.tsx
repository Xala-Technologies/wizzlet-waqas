import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string } = {}) {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = safeGetItem('theme');
    if (stored) return stored === 'dark';
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    safeSetItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark(!dark)}
      className={cn(
        'relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground',
        className,
      )}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      <Sun
        className={cn(
          'absolute h-4 w-4 transition-all duration-200',
          dark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
        )}
        aria-hidden
      />
      <Moon
        className={cn(
          'absolute h-4 w-4 transition-all duration-200',
          dark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0',
        )}
        aria-hidden
      />
    </button>
  );
}
