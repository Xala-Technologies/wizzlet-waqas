import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { LandingSection } from '@/components/landing/LandingSection';
import { useAuth } from '@/contexts/AuthContext';

export function CTASection() {
  const { user, role } = useAuth();
  const dashboardPath =
    role === 'creator' ? '/creator' : role === 'admin' ? '/admin' : '/dashboard';

  return (
    <LandingSection variant="band" className="overflow-hidden">
      <div className="container relative z-10">
        <div className="mx-auto max-w-[540px] text-center">
          <h2 className="text-3xl sm:text-4xl md:text-[3rem] font-extrabold tracking-[-0.04em] leading-[1.1] text-foreground mb-5">
            IF YOU'RE READY TO
            <br />
            <span className="text-gradient">BUILD PROPERLY</span>
          </h2>

          <p className="text-ui text-muted-foreground mb-10 leading-relaxed">
            This isn't for everyone. And that's the point.
          </p>

          {user ? (
            <Link to={dashboardPath}>
              <Button variant="hero" size="lg" className="h-13 px-10 text-ui">
                Open dashboard <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link to="/signup">
              <Button variant="hero" size="lg" className="h-13 px-10 text-ui">
                Apply for Access <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          )}

          <p className="mt-6 text-support text-muted-foreground/50 uppercase tracking-[0.15em]">
            {user ? 'Signed in' : 'Applications reviewed manually'}
          </p>
        </div>
      </div>
    </LandingSection>
  );
}
