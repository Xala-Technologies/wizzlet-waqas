import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { Footer } from '@/components/landing/Footer';

const Discover = () => (
  <div className="min-h-screen bg-background">
    <Seo title={'Discover Creators — Wizzlet'} description={'Find sports creators by sport, record, and pricing. Compare verified performance before you subscribe.'} />
      <Navbar />
    <main id="main-content" className="container pt-32 pb-20">
      <h1 className="text-3xl font-bold text-foreground mb-4">Discover Creators</h1>
      <p className="text-muted-foreground">Browse and find creators that match your interests.</p>
    </main>
    <Footer />
  </div>
);

export default Discover;
