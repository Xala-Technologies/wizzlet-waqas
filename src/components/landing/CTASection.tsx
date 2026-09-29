import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { LandingSection } from '@/components/landing/LandingSection';
import { LandingSectionHeader } from '@/components/landing/LandingSectionHeader';
import { useAuth } from '@/contexts/AuthContext';

export function CTASection() {
  const { user, role } = useAuth();
  const dashboardPath =
    role === 'creator' ? '/creator' : role === 'admin' ? '/admin' : '/dashboard';

  return (
    <LandingSection
      variant="band"
      className="overflow-hidden bg-[#F4FAFF] dark:bg-background"
    >
      <div className="container relative z-10">
        <div className="mx-auto max-w-[540px]">
          <LandingSectionHeader
            align="center"
            eyebrow="Get started"
            title={
              <>
                If you’re ready to <span className="text-[#429FF0]">build properly.</span>
              </>
            }
            description="This isn’t for everyone. And that’s the point."
            className="mb-8"
          />

          <div className="text-center">
            {user ? (
              <Link to={dashboardPath}>
                <Button
                  variant="hero"
                  size="lg"
                  className="h-14 rounded-full px-10 text-base font-semibold"
                >
                  Open dashboard <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/signup">
                <Button
                  variant="hero"
                  size="lg"
                  className="h-14 rounded-full px-10 text-base font-semibold"
                >
                  Apply for Access <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )}

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
              {user ? 'Signed in' : 'Applications reviewed manually'}
            </p>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
