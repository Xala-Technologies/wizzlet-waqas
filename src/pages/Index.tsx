import { useEffect } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { HeroSection } from '@/components/landing/HeroSection';
import { TodaysEventsSection } from '@/components/landing/TodaysEventsSection';
import { WhySwitchSection } from '@/components/landing/WhySwitchSection';
import { ToolsSection } from '@/components/landing/ToolsSection';
import { PlatformPreviewSection } from '@/components/landing/PlatformPreviewSection';
import { CommandCenterSection } from '@/components/landing/CommandCenterSection';
import { CreatorDiscovery } from '@/components/landing/CreatorDiscovery';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { trackPageView } from '@/lib/analytics';

const Index = () => {
  useEffect(() => { trackPageView('home'); }, []);

  return (
    <div className="min-h-screen bg-noise">
      <Seo title={'Wizzlet — Private Betting Infrastructure for Creators'} description={'Wizzlet is the invite-only system where proven sports creators sell picks, run subscriptions, and grow a private network of members.'} />
      <Navbar />
      <main id="main-content">
      <HeroSection />
      <TodaysEventsSection />
      <WhySwitchSection />
      <ToolsSection />
      <PlatformPreviewSection />
      <CommandCenterSection />
      <CreatorDiscovery />
      <TestimonialsSection />
      <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
