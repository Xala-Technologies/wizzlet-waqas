import { WizzletLogo } from '@/components/WizzletLogo';

export function Footer() {
  return (
    <footer className="border-t border-border py-10 bg-card">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          <WizzletLogo size="sm" />
          <div className="flex items-center gap-6 text-[13px] text-muted-foreground">
            <a href="#" className="inline-block py-1.5 hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="inline-block py-1.5 hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="inline-block py-1.5 hover:text-foreground transition-colors">Support</a>
          </div>
          <p className="text-[12px] text-muted-foreground">© 2026 Wizzlet</p>
        </div>
      </div>
    </footer>
  );
}
