import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { Footer } from '@/components/landing/Footer';

const Community = () => (
  <div className="min-h-screen bg-background">
    <Seo title={'Wizzlet Community'} description={'Connect with creators and members inside the Wizzlet private network.'} />
      <Navbar />
    <main id="main-content" className="container pt-32 pb-20">
      <h1 className="text-3xl font-bold text-foreground mb-4">Community</h1>
      <p className="text-muted-foreground">Join our community of creators and sports enthusiasts.</p>
    </main>
    <Footer />
  </div>
);

export default Community;
