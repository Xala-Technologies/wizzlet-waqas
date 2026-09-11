import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LandingSection } from '@/components/landing/LandingSection';
import { ArrowRight, Play } from 'lucide-react';

export function HeroSection() {
  return (
    <LandingSection variant="hero" className="bg-background">
      <div className="container relative z-10">
        <div className="mx-auto max-w-[700px] text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-muted px-5 py-2 text-caption uppercase tracking-[0.2em] text-muted-foreground mb-8 animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Private access&nbsp;&nbsp;•&nbsp;&nbsp;Limited onboarding
          </div>

          <h1 className="text-display font-extrabold tracking-[-0.05em] mb-3 animate-fade-in-up">
            <span className="text-foreground">NOT BUILT</span>
            <br />
            <span className="text-foreground">FOR </span>
            <span className="text-gradient">EVERYONE</span>
          </h1>

          <p className="text-body text-muted-foreground max-w-[480px] mx-auto mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            A platform designed for creators who actually want to scale, not just post.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/signup">
              <Button variant="hero" size="lg" className="w-full sm:w-auto h-13 px-10 text-ui">
                Get Access <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="hero-outline" size="lg" className="w-full sm:w-auto h-13 px-8 text-ui">
                <Play className="mr-1.5 h-3.5 w-3.5" /> See How It Works
              </Button>
            </a>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
