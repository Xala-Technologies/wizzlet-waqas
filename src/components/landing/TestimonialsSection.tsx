const testimonials = [
  { quote: 'Clean setup and easy to use. I was live in under an hour.', initials: 'JM' },
  { quote: 'Everything finally in one place. No more juggling five different tools.', initials: 'KR' },
  { quote: 'Way more structured than anything I\'ve used before.', initials: 'TS' },
  { quote: 'Simple, fast, and stays out of my way. Exactly what I needed.', initials: 'AL' },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="container relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] leading-[1.1] text-foreground">
            REAL{' '}
            <span className="text-gradient">EXPERIENCES</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {testimonials.map((t) => (
            <div
              key={t.initials}
              className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/20"
            >
              <p className="text-[14px] text-foreground/85 leading-relaxed mb-5">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/[0.08] border border-primary/15 flex items-center justify-center text-[11px] font-semibold text-primary">
                  {t.initials}
                </div>
                <span className="text-[12px] text-muted-foreground">Verified creator</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
