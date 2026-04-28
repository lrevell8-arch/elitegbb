import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-[var(--surface)] py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-[var(--foreground)] mb-6">
            Built for the Next Generation of Elite Players
          </h1>
          <p className="text-xl text-[var(--foreground)]/80 max-w-2xl mx-auto">
            ConnectGBB bridges the gap between talented girls basketball players and the college coaches who can help them reach their potential.
          </p>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-16 bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-8 text-center">Our Story</h2>
          <div className="space-y-6 text-[var(--foreground)]/80">
            <p className="text-lg">
              For too long, girls basketball players have lacked the visibility and connections needed to showcase their talent to college coaches. Traditional recruiting channels favor boys basketball, leaving girls underrepresented and underserved.
            </p>
            <p className="text-lg">
              ConnectGBB was founded by former college coaches and recruiting experts who saw this gap firsthand. We built a platform that gives girls basketball players the tools, training, and connections they deserve.
            </p>
            <p className="text-lg">
              Today, ConnectGBB serves thousands of players, parents, and coaches across the country, creating meaningful connections that lead to college opportunities and lifelong success in basketball.
            </p>
          </div>
        </div>
      </section>

      {/* Why Girls Basketball */}
      <section className="py-16 bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-12 text-center">
            The Opportunity in Girls Basketball
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[var(--brand-primary)] mb-2">15M+</div>
              <p className="text-[var(--foreground)]/80">Girls playing high school basketball annually</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[var(--brand-primary)] mb-2">2,000+</div>
              <p className="text-[var(--foreground)]/80">NCAA Division I women's basketball programs</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[var(--brand-primary)] mb-2">$50K+</div>
              <p className="text-[var(--foreground)]/80">Average athletic scholarship value</p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Pillars */}
      <section className="py-16 bg-[var(--background)]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-12 text-center">
            Everything Players Need to Succeed
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎥</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Training Hub</h3>
              <p className="text-[var(--foreground)]/80">Professional training videos and drills from college coaches</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👁️</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Recruiting Visibility</h3>
              <p className="text-[var(--foreground)]/80">Showcase your talent to verified college coaches</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Trusted Community</h3>
              <p className="text-[var(--foreground)]/80">Safe connections between players, parents, and coaches</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Memberships</h3>
              <p className="text-[var(--foreground)]/80">Flexible plans for every level of commitment</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust and Safety */}
      <section className="py-16 bg-[var(--surface)]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-8">Your Safety is Our Priority</h2>
          <div className="space-y-6 text-[var(--foreground)]/80">
            <p className="text-lg">
              We understand the concerns parents have about online platforms. That's why ConnectGBB includes comprehensive safety features designed specifically for youth sports recruiting.
            </p>
            <p className="text-lg">
              All coach profiles are verified through rigorous background checks. Parent approval is required for all messaging. Our moderation team monitors all interactions 24/7. And players maintain full control over their profiles and connections.
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-[var(--background)]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-12 text-center">Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-[var(--surface-muted)] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Head of Product</h3>
              <p className="text-[var(--foreground)]/80">Former Division I coach with 15+ years in youth sports technology</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-[var(--surface-muted)] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Head of Recruiting</h3>
              <p className="text-[var(--foreground)]/80">Led recruiting for top programs, now helping players get discovered</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-[var(--surface-muted)] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Head of Safety</h3>
              <p className="text-[var(--foreground)]/80">Child safety expert ensuring every interaction is protected</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-[var(--brand-primary)]">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-white/90 mb-8 text-lg">
            Join thousands of players already connecting with their future coaches.
          </p>
          <Link
            href="/onboarding"
            className="inline-block bg-white text-[var(--brand-primary)] px-8 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
          >
            Join ConnectGBB
          </Link>
        </div>
      </section>
    </div>
  );
}
