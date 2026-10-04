import { useEffect } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { HeroSection } from '@/components/landing/HeroSection';
import { LandingFooterCta } from '@/components/landing/LandingFooterCta';
import { Footer } from '@/components/landing/Footer';
import { trackPageView } from '@/lib/analytics';

const Index = () => {
  useEffect(() => { trackPageView('home'); }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Seo title={'Sweeph — Private Creator Infrastructure'} description={'Sweeph is the invite-only system where creators sell subscriptions, gate premium content, and grow a private network of members.'} />
      <Navbar />
      <main id="main-content" className="flex-1 bg-background">
        <HeroSection />
        <LandingFooterCta />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
