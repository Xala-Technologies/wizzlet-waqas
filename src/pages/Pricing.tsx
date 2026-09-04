import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { Footer } from '@/components/landing/Footer';

const Pricing = () => (
  <div className="min-h-screen bg-background">
    <Seo title={'Pricing — Wizzlet for Creators'} description={'Transparent Wizzlet pricing: a 5% intro platform fee for your first 30 days, then 10%. No setup fees, no monthly minimum.'} />
      <Navbar />
    <main id="main-content" className="container pt-32 pb-20">
      <h1 className="text-3xl font-bold text-foreground mb-4">Pricing</h1>
      <p className="text-muted-foreground">Simple, transparent pricing for creators and subscribers.</p>
    </main>
    <Footer />
  </div>
);

export default Pricing;
