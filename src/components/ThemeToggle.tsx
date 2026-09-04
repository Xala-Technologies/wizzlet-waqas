import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return true; // default dark
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all duration-300 hover:text-foreground hover:bg-muted"
      aria-label="Toggle theme"
    >
      <Sun className={`h-4 w-4 absolute transition-all duration-300 ${dark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
      <Moon className={`h-4 w-4 absolute transition-all duration-300 ${dark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
    </button>
  );
}
