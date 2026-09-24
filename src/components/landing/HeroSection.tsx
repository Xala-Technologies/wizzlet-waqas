import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LandingSection } from '@/components/landing/LandingSection';
import { ArrowRight, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function HeroSection() {
  const { user, role } = useAuth();
  const dashboardPath =
    role === 'creator' ? '/creator' : role === 'admin' ? '/admin' : '/dashboard';

  return (
    <LandingSection variant="hero" className="bg-background">
      <div className="container relative z-10">
        <div className="mx-auto max-w-[820px] text-center">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-border bg-muted px-5 py-2.5 text-caption font-semibold uppercase tracking-[0.18em] text-muted-foreground animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Private access&nbsp;&nbsp;•&nbsp;&nbsp;Limited onboarding
          </div>

          <h1 className="mb-5 text-display font-extrabold tracking-[-0.045em] animate-fade-in-up">
            <span className="text-foreground">NOT BUILT</span>
            <br />
            <span className="text-foreground">FOR </span>
            <span className="text-gradient">EVERYONE</span>
          </h1>

          <p className="mx-auto mb-10 max-w-[540px] text-body text-muted-foreground opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            A platform designed for creators who actually want to scale, not just post.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {user ? (
              <Link to={dashboardPath}>
                <Button variant="hero" size="lg" className="w-full sm:w-auto h-13 px-10 text-ui">
                  Open dashboard <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/signup">
                <Button variant="hero" size="lg" className="w-full sm:w-auto h-13 px-10 text-ui">
                  Get Access <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )}
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
