import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LandingSection } from '@/components/landing/LandingSection';
import { SweephRibbonBackground } from '@/components/brand/SweephRibbonBackground';
import { HomeHeroCollage } from '@/components/landing/HomeHeroCollage';
import { ArrowRight, BarChart3, CreditCard, Globe, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const CREATOR_FACES = [
  'https://api.dicebear.com/9.x/adventurer/png?seed=Ava&size=64&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/adventurer/png?seed=Kai&size=64&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/adventurer/png?seed=Noor&size=64&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/adventurer/png?seed=Leo&size=64&backgroundColor=d1d4f9',
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Easy to get started',
    body: 'Create your profile in minutes. No technical skills needed.',
  },
  {
    icon: CreditCard,
    title: 'Secure payments',
    body: 'Fast, safe and reliable payouts.',
  },
  {
    icon: BarChart3,
    title: 'Built for creators',
    body: 'All the tools you need to grow and earn.',
  },
  {
    icon: Globe,
    title: 'Global reach',
    body: 'Grow your audience worldwide.',
  },
];

export function HeroSection() {
  const { user, role } = useAuth();
  const dashboardPath =
    role === 'creator' ? '/creator' : role === 'admin' ? '/admin' : '/dashboard';
  const primaryHref = user ? dashboardPath : '/signup';
  const primaryLabel = user ? 'Open dashboard' : 'Get Started';

  return (
    <LandingSection
      variant="hero"
      className="bg-transparent pb-0 md:min-h-[min(92vh,52rem)] md:pb-0 md:pt-24"
    >
      <SweephRibbonBackground variant="home" />
      <div className="container relative z-10">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6 xl:gap-10">
          <div className="max-w-[560px]">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground animate-fade-in">
              Create&nbsp;&nbsp;•&nbsp;&nbsp;Grow&nbsp;&nbsp;•&nbsp;&nbsp;Earn
            </p>

            <h1 className="mb-5 text-[2.75rem] font-extrabold leading-[1.05] tracking-[-0.05em] text-foreground animate-fade-in-up sm:text-5xl lg:text-[3.65rem]">
              One place.
              <br />
              <span className="text-[#429FF0]">Endless</span>
              <br />
              <span className="text-[#429FF0]">possibilities.</span>
            </h1>

            <p
              className="mb-8 max-w-[440px] text-lg leading-relaxed text-muted-foreground opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.08s' }}
            >
              Discover creators, join communities, and unlock exclusive content — all in one place.
            </p>

            <div
              className="opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.16s' }}
            >
              <Link to={primaryHref}>
                <Button
                  variant="hero"
                  size="lg"
                  className="h-14 rounded-full px-8 text-base font-semibold"
                >
                  {primaryLabel} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div
              className="mt-10 flex items-center gap-3 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.24s' }}
            >
              <div className="flex -space-x-2">
                {CREATOR_FACES.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-10 w-10 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <p className="max-w-[220px] text-sm font-medium leading-snug text-muted-foreground">
                <span className="font-bold text-foreground">50,000+ creators</span>
                <br />
                are already building on Sweeph.
              </p>
            </div>
          </div>

          <div className="relative hidden min-h-[420px] sm:block lg:min-h-[540px]">
            <HomeHeroCollage />
          </div>
        </div>

        <div className="relative z-10 mt-14 grid gap-8 border-t border-border/70 py-10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-6 lg:py-12">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E1F2FF] text-[#429FF0]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-[#08182F]">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
