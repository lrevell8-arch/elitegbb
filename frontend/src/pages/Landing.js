import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, ChevronRight, Zap, Target, BarChart3, Users, Shield, Eye, Award, TrendingUp } from 'lucide-react';

const stats = [
  { value: '5,247', label: 'Athletes', suffix: '+' },
  { value: '523', label: 'College Programs', suffix: '' },
  { value: '98', label: 'Success Rate', suffix: '%' },
  { value: '48', label: 'States', suffix: '' }
];

const features = [
  {
    icon: Target,
    title: 'Elite Exposure',
    description: 'Get discovered by 500+ college programs actively recruiting through our verified platform.'
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Comprehensive stat tracking and performance metrics that showcase your complete game.'
  },
  {
    icon: Eye,
    title: 'Scout Evaluations',
    description: 'Professional assessments from experienced scouts with detailed skill breakdowns.'
  },
  {
    icon: Shield,
    title: 'Verified Profiles',
    description: 'All profiles vetted for authenticity. Coaches trust what they see.'
  },
  {
    icon: Zap,
    title: 'Direct Connect',
    description: 'Message coaches directly. No middlemen, no delays, just opportunities.'
  },
  {
    icon: TrendingUp,
    title: 'Recruitment Intel',
    description: 'Track profile views, coach interest, and recruitment momentum in real-time.'
  }
];

const programs = ['Stanford', 'UConn', 'Notre Dame', 'South Carolina', 'LSU', 'Oregon', 'Texas', 'UCLA', 'Duke', 'Tennessee'];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#030712]">
      <div className="fixed inset-0 grid-overlay pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-[#0134bd]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-[#fb6c1d]/5 rounded-full blur-[100px] pointer-events-none" />

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass-panel py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative w-11 h-11">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0134bd] to-[#fb6c1d] rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300" />
                <div className="absolute inset-0 bg-[#030712] rounded-xl flex items-center justify-center">
                  <span className="text-xl font-black text-elite-gradient">E</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white tracking-tight">EliteGBB</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Elite Recruiting</span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-10">
              <a href="#platform" className="text-sm text-gray-400 hover:text-white transition-colors">Platform</a>
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#evaluations" className="text-sm text-gray-400 hover:text-white transition-colors">Evaluations</a>
              <a href="#success" className="text-sm text-gray-400 hover:text-white transition-colors">Success</a>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/coach/login" className="hidden sm:block px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Coach Portal
              </Link>
              <Link to="/intake" className="btn-elite text-sm px-6 py-2.5 text-white">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px]">
          <div className="absolute inset-0 border border-white/[0.02] rounded-full animate-pulse-slow" />
          <div className="absolute inset-10 border border-white/[0.02] rounded-full animate-pulse-slow" style={{ animationDelay: '0.5s' }} />
          <div className="absolute inset-20 border border-white/[0.02] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] mb-8">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-400">LIVE</span>
                </div>
                <span className="text-xs text-gray-400">2,847 coaches online now</span>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-center leading-[0.95] tracking-tight mb-8">
              <span className="text-white">Where Elite</span>
              <br />
              <span className="text-elite-gradient">Talent</span>
              <span className="text-white"> Meets</span>
              <br />
              <span className="text-white">Elite </span>
              <span className="text-warm-gradient">Opportunity</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 text-center max-w-2xl mx-auto mb-12 leading-relaxed">
              The premier recruiting platform for women's basketball.
              Connect with top college programs and turn your game into your future.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link to="/intake" className="group btn-elite flex items-center gap-3 text-white">
                <span>Create Your Profile</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="btn-ghost flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Play size={16} className="ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="stat-elite text-center group hover:border-[#0134bd]/20 transition-colors">
                  <p className="text-3xl sm:text-4xl font-black text-white mb-1">
                    {stat.value}
                    <span className="text-[#0134bd]">{stat.suffix}</span>
                  </p>
                  <p className="text-xs uppercase tracking-wider text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030712] to-transparent" />
      </section>

      <section className="py-16 border-y border-white/[0.04] bg-black/20">
        <div className="container mx-auto px-6">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-gray-600 mb-10">
            Trusted by Elite Programs Nationwide
          </p>
          <div className="relative overflow-hidden">
            <div className="flex gap-16 animate-[scroll_30s_linear_infinite]">
              {[...programs, ...programs].map((program, index) => (
                <span key={index} className="text-2xl font-bold text-gray-700 whitespace-nowrap hover:text-gray-500 transition-colors cursor-default">
                  {program}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0134bd]/10 border border-[#0134bd]/20 mb-6">
                <Zap size={14} className="text-[#0134bd]" />
                <span className="text-xs font-semibold text-[#0134bd] uppercase tracking-wider">The Platform</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
                Built for the
                <span className="text-elite-gradient"> Modern Athlete</span>
              </h2>

              <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                EliteGBB isn't just a database. It's a complete recruiting ecosystem designed
                to give you every advantage in your journey to college basketball.
              </p>

              <div className="space-y-6">
                {[
                  { label: 'Profile Completion', value: 94 },
                  { label: 'Coach Response Rate', value: 87 },
                  { label: 'Scholarship Success', value: 76 }
                ].map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300 font-medium">{item.label}</span>
                      <span className="text-[#0134bd] font-bold">{item.value}%</span>
                    </div>
                    <div className="progress-elite">
                      <div className="progress-elite-fill" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#0134bd]/20 to-[#fb6c1d]/20 rounded-3xl blur-2xl opacity-50" />
              <div className="relative card-elite p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0134bd] to-[#fb6c1d] flex items-center justify-center">
                      <span className="text-lg font-bold text-white">MJ</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Maya Johnson</p>
                      <p className="text-xs text-gray-500">Class of 2025 | Point Guard</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-xs font-semibold text-emerald-400">VERIFIED</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: 'PPG', value: '18.4' },
                    { label: 'APG', value: '6.2' },
                    { label: 'GPA', value: '3.8' }
                  ].map((stat, index) => (
                    <div key={index} className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Eye size={14} className="text-blue-400" />
                      </div>
                      <span className="text-sm text-gray-300">Profile Views</span>
                    </div>
                    <span className="text-sm font-semibold text-white">847</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Award size={14} className="text-amber-400" />
                      </div>
                      <span className="text-sm text-gray-300">Saved by Coaches</span>
                    </div>
                    <span className="text-sm font-semibold text-white">23</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-[#0134bd]">
                  <span className="w-2 h-2 rounded-full bg-[#0134bd] animate-pulse" />
                  <span>12 coaches viewing now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-32 relative">
        <div className="absolute inset-0 dot-overlay" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fb6c1d]/10 border border-[#fb6c1d]/20 mb-6">
              <Target size={14} className="text-[#fb6c1d]" />
              <span className="text-xs font-semibold text-[#fb6c1d] uppercase tracking-wider">Features</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
              Everything You Need to
              <span className="text-elite-gradient"> Get Recruited</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Professional tools and direct access to the coaches who matter most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card-elite p-8 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0134bd]/20 to-[#0134bd]/5 border border-[#0134bd]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <feature.icon size={24} className="text-[#0134bd]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="evaluations" className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-[#0134bd]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-[#0134bd]/10 to-[#fb6c1d]/10 rounded-3xl blur-xl" />
                <div className="relative card-elite p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-lg font-bold text-white">Skill Assessment</h4>
                    <div className="px-3 py-1 rounded-full bg-[#0134bd]/10 border border-[#0134bd]/20">
                      <span className="text-xs font-semibold text-[#0134bd]">PRO EVAL</span>
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-[#0134bd]/20 to-[#06B6D4]/10 border border-[#0134bd]/20 mb-4">
                      <span className="text-5xl font-black text-elite-gradient">A-</span>
                    </div>
                    <p className="text-sm text-gray-400">Overall Grade</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { skill: 'Shooting', rating: 8.5 },
                      { skill: 'Ball Handling', rating: 7.8 },
                      { skill: 'Court Vision', rating: 9.2 },
                      { skill: 'Defense', rating: 8.0 },
                      { skill: 'Athleticism', rating: 8.7 }
                    ].map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">{item.skill}</span>
                          <span className="text-white font-semibold">{item.rating}</span>
                        </div>
                        <div className="progress-elite">
                          <div className="progress-elite-fill" style={{ width: `${item.rating * 10}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-sm text-gray-400 italic">
                      "Elite court vision with exceptional passing ability. Projects as a D1 starter
                      with continued development..."
                    </p>
                    <p className="text-xs text-gray-500 mt-2">- Scout Report Excerpt</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <Award size={14} className="text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pro Evaluations</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
                Know Your
                <span className="text-elite-gradient"> True Value</span>
              </h2>

              <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                Get professionally evaluated by experienced scouts. Receive detailed skill assessments,
                college projections, and actionable feedback to elevate your game.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  'Comprehensive 9-category skill breakdown',
                  'College level projection analysis',
                  'Personalized development roadmap',
                  'Video breakdown analysis (Elite tier)'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#0134bd]/10 flex items-center justify-center flex-shrink-0">
                      <ChevronRight size={14} className="text-[#0134bd]" />
                    </div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-black text-white">$49</span>
                <span className="text-gray-500">starting price</span>
              </div>

              <Link to="/intake" className="inline-flex items-center gap-2 btn-elite text-white">
                <span>Get Evaluated</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="success" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0134bd]/10 border border-[#0134bd]/20 mb-6">
              <Users size={14} className="text-[#0134bd]" />
              <span className="text-xs font-semibold text-[#0134bd] uppercase tracking-wider">Success Stories</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
              They Started Here.
              <span className="text-elite-gradient"> Now They're There.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "Within 60 days of creating my profile, I had 5 D1 offers. EliteGBB changed everything.",
                name: "Aaliyah Thompson",
                detail: "Class of 2024 | Now at Oregon",
                stat: "5 D1 Offers"
              },
              {
                quote: "The evaluation gave me clarity on exactly what I needed to improve. Six months later, I committed to my dream school.",
                name: "Jordan Mills",
                detail: "Class of 2024 | Now at Duke",
                stat: "Dream School"
              },
              {
                quote: "As a small-town player, I had no exposure. This platform put me in front of coaches I never would have reached.",
                name: "Destiny Clark",
                detail: "Class of 2025 | Committed to Stanford",
                stat: "42 States Away"
              }
            ].map((testimonial, index) => (
              <div key={index} className="card-elite p-8">
                <div className="flex items-center gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="w-5 h-5 rounded bg-[#fb6c1d]/20 flex items-center justify-center">
                      <span className="text-[#fb6c1d] text-xs">★</span>
                    </div>
                  ))}
                </div>
                <p className="text-gray-300 leading-relaxed mb-8">"{testimonial.quote}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.detail}</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-[#0134bd]/10 border border-[#0134bd]/20">
                    <span className="text-xs font-bold text-[#0134bd]">{testimonial.stat}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0134bd] via-[#06B6D4] to-[#0134bd]" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-30" />

            <div className="relative px-8 py-20 sm:px-16 sm:py-24 text-center">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                Your Future Starts
                <br />
                With One Click
              </h2>
              <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10">
                Join thousands of athletes who have transformed their recruiting journey.
                Create your profile in under 5 minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/intake"
                  className="group flex items-center gap-3 px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-xl"
                >
                  <span>Create Your Profile</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/coach/login"
                  className="flex items-center gap-3 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  Coach Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-16 border-t border-white/[0.04]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <Link to="/" className="flex items-center gap-3 mb-6">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0134bd] to-[#fb6c1d] rounded-lg rotate-6" />
                  <div className="absolute inset-0 bg-[#030712] rounded-lg flex items-center justify-center">
                    <span className="text-lg font-black text-elite-gradient">E</span>
                  </div>
                </div>
                <span className="text-lg font-bold text-white">EliteGBB</span>
              </Link>
              <p className="text-sm text-gray-500 leading-relaxed">
                The premier platform connecting elite women's basketball talent with college opportunities.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Athletes</h4>
              <ul className="space-y-3">
                <li><Link to="/intake" className="text-sm text-gray-500 hover:text-[#0134bd] transition-colors">Create Profile</Link></li>
                <li><a href="#features" className="text-sm text-gray-500 hover:text-[#0134bd] transition-colors">Features</a></li>
                <li><a href="#evaluations" className="text-sm text-gray-500 hover:text-[#0134bd] transition-colors">Evaluations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Coaches</h4>
              <ul className="space-y-3">
                <li><Link to="/coach/login" className="text-sm text-gray-500 hover:text-[#0134bd] transition-colors">Coach Portal</Link></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-[#0134bd] transition-colors">Browse Athletes</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-[#0134bd] transition-colors">Subscriptions</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-500 hover:text-[#0134bd] transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-[#0134bd] transition-colors">Contact</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-[#0134bd] transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              {new Date().getFullYear()} EliteGBB. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-600 hover:text-[#0134bd] transition-colors">Twitter</a>
              <a href="#" className="text-sm text-gray-600 hover:text-[#0134bd] transition-colors">Instagram</a>
              <a href="#" className="text-sm text-gray-600 hover:text-[#0134bd] transition-colors">YouTube</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
