import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { Footer } from '@/components/landing/Footer';
import { TodaysEventsSection } from '@/components/landing/TodaysEventsSection';

/** Public slate of published `sportEvents` for the local calendar day. */
const TodaysEvents = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <Seo
      title="Today’s events — Sweeph"
      description="See what’s happening today across the biggest sports on Sweeph."
      canonicalPath="/todays-events"
    />
    <Navbar />
    <main id="main-content" className="flex-1 pt-20 md:pt-24">
      <TodaysEventsSection />
    </main>
    <Footer />
  </div>
);

export default TodaysEvents;
