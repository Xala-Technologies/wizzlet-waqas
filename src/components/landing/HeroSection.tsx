import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center pt-16 overflow-hidden bg-background">
      {/* Theme-aware glow accents */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full opacity-[0.10] blur-[140px] bg-primary" />
      <div className="pointer-events-none absolute -bottom-20 -left-40 h-[400px] w-[400px] rounded-full opacity-[0.06] blur-[120px] bg-primary" />
      <div className="pointer-events-none absolute top-20 -right-32 h-[300px] w-[300px] rounded-full opacity-[0.05] blur-[100px] bg-accent" />

      {/* Grain texture overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat' }} />

      {/* Spotlight */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%]" style={{ background: 'radial-gradient(ellipse 50% 60% at 50% 0%, hsl(var(--primary) / 0.06), transparent)' }} />

      <div className="container relative z-10">
        <div className="mx-auto max-w-[700px] text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/[0.06] px-5 py-2 text-[11px] uppercase tracking-[0.2em] text-primary mb-10 animate-fade-in backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Private access&nbsp;&nbsp;•&nbsp;&nbsp;Limited onboarding
          </div>

          <h1 className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] font-extrabold tracking-[-0.05em] leading-[1] mb-6 animate-fade-in-up">
            <span className="text-foreground">NOT BUILT</span>
            <br />
            <span className="text-foreground">FOR </span>
            <span className="relative inline-block">
              <span className="text-gradient">EVERYONE</span>
              <span className="pointer-events-none absolute -inset-3 rounded-xl opacity-20 blur-2xl bg-primary" />
            </span>
          </h1>

          <p className="text-[15px] sm:text-[17px] text-muted-foreground max-w-[480px] mx-auto mb-12 leading-relaxed opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            A platform designed for creators who actually want to scale, not just post.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/signup">
              <Button variant="hero" size="lg" className="w-full sm:w-auto h-13 px-10 text-[15px]">
                Get Access <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="hero-outline" size="lg" className="w-full sm:w-auto h-13 px-8 text-[15px]">
                <Play className="mr-1.5 h-3.5 w-3.5" /> See How It Works
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
