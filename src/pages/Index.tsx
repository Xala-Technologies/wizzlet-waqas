import { useEffect } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { HeroSection } from '@/components/landing/HeroSection';
import { trackPageView } from '@/lib/analytics';

const Index = () => {
  useEffect(() => { trackPageView('home'); }, []);

  return (
    <div className="min-h-screen bg-background">
      <Seo title={'Sweeph — Private Creator Infrastructure'} description={'Sweeph is the invite-only system where creators sell subscriptions, gate premium content, and grow a private network of members.'} />
      <Navbar />
      <main id="main-content" className="bg-background">
        <HeroSection />
      </main>
    </div>
  );
};

export default Index;
