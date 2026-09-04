import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full opacity-[0.06] blur-[160px] bg-primary" />

      <div className="container relative z-10">
        <div className="mx-auto max-w-[540px] text-center">
          <h2 className="text-3xl sm:text-4xl md:text-[3rem] font-extrabold tracking-[-0.04em] leading-[1.1] text-foreground mb-5">
            IF YOU'RE READY TO
            <br />
            <span className="text-gradient">BUILD PROPERLY</span>
          </h2>

          <p className="text-[15px] text-muted-foreground mb-10 leading-relaxed">
            This isn't for everyone. And that's the point.
          </p>

          <Link to="/signup">
            <Button variant="hero" size="lg" className="h-13 px-10 text-[15px]">
              Apply for Access <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>

          <p className="mt-6 text-[12px] text-muted-foreground/50 uppercase tracking-[0.15em]">
            Applications reviewed manually
          </p>
        </div>
      </div>
    </section>
  );
}
