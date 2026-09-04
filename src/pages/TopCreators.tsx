import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { Footer } from '@/components/landing/Footer';

const TopCreators = () => (
  <div className="min-h-screen bg-background">
    <Seo title={'Top Performing Creators — Wizzlet Leaderboard'} description={'The Wizzlet leaderboard ranks creators by verified win rate and units won across 50+ tracked picks.'} />
      <Navbar />
    <main id="main-content" className="container pt-32 pb-20">
      <h1 className="text-3xl font-bold text-foreground mb-4">Top Creators</h1>
      <p className="text-muted-foreground">The highest-rated creators on the platform.</p>
    </main>
    <Footer />
  </div>
);

export default TopCreators;
