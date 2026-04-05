import Link from 'next/link'
import Navbar from '@/components/Navbar'

const features = [
  {
    icon: '✦',
    title: 'AI Content Generation',
    description:
      'Generate platform-optimized posts in seconds using GPT-4. Tailored to your brand voice, audience, and goals.',
  },
  {
    icon: '⏱',
    title: 'Smart Scheduling',
    description:
      'Schedule posts across all platforms at the optimal time. Set it and forget it with intelligent automation.',
  },
  {
    icon: '🌐',
    title: 'Multi-Platform Support',
    description:
      'Instagram, Facebook, X (Twitter), LinkedIn, TikTok, and YouTube — all managed from one dashboard.',
  },
  {
    icon: '👥',
    title: 'Team Collaboration',
    description:
      'Invite editors, managers, and viewers. Control who can create, approve, and publish content.',
  },
  {
    icon: '📊',
    title: 'Brand Intelligence',
    description:
      'Crawl your website to extract brand tone, keywords, and audience. Every post stays on-brand automatically.',
  },
  {
    icon: '✅',
    title: 'Approval Workflows',
    description:
      'AI-generated posts go through approval before publishing. Full control, zero surprises.',
  },
]

const plans = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for solopreneurs and small brands getting started.',
    features: [
      '30 AI posts per month',
      '1 company workspace',
      '2 team seats',
      'All 6 social platforms',
      'AI content generation',
      'Smart scheduling',
      'Approval workflows',
      'Brand intelligence',
    ],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Growth',
    price: 79,
    description: 'For growing businesses managing multiple brands.',
    features: [
      '150 AI posts per month',
      '3 company workspaces',
      '5 team seats',
      'All 6 social platforms',
      'AI content generation',
      'Smart scheduling',
      'Advanced approval workflows',
      'Brand intelligence',
      'Priority support',
    ],
    cta: 'Get Started',
    highlight: true,
  },
  {
    name: 'Pro',
    price: 149,
    description: 'Unlimited power for agencies and enterprise teams.',
    features: [
      'Unlimited AI posts',
      'Unlimited companies',
      '10 team seats',
      'All 6 social platforms',
      'AI content generation',
      'Smart scheduling',
      'Advanced approval workflows',
      'Brand intelligence',
      'Priority support',
      'API access',
    ],
    cta: 'Get Started',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 pt-24 pb-32">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-32 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            <span className="text-indigo-300 text-sm font-medium">Powered by GPT-4o</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            AI-Powered Social Media,{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              On Autopilot
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-slate-300 mb-10 leading-relaxed">
            Generate brand-perfect content, schedule across all platforms, and let your team
            collaborate — all from one intelligent dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              Start Your Free Trial
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 border border-white/10"
            >
              See How It Works
            </Link>
          </div>

          <p className="mt-6 text-slate-400 text-sm">No credit card required • Cancel anytime</p>

          {/* Hero image/mockup */}
          <div className="mt-20 relative">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 max-w-4xl mx-auto shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 bg-slate-700/50 rounded-md h-6 mx-4" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {['Instagram', 'LinkedIn', 'X (Twitter)'].map((platform, i) => (
                  <div key={platform} className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        i === 0 ? 'bg-pink-500/20 text-pink-400' :
                        i === 1 ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {platform[0]}
                      </div>
                      <span className="text-slate-300 text-sm font-medium">{platform}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                        i === 0 ? 'bg-green-500/20 text-green-400' :
                        i === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {i === 0 ? 'Published' : i === 1 ? 'Pending' : 'Scheduled'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-700/50 rounded w-full" />
                      <div className="h-2 bg-slate-700/50 rounded w-4/5" />
                      <div className="h-2 bg-slate-700/50 rounded w-3/5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything you need to dominate social media
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              PostPilot combines AI intelligence with powerful automation to make content creation effortless.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: '10x', label: 'Faster Content Creation' },
              { value: '6', label: 'Social Platforms Supported' },
              { value: '100%', label: 'Brand Voice Consistency' },
              { value: '24/7', label: 'Automated Posting' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-extrabold text-white mb-1">{stat.value}</div>
                <div className="text-indigo-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-slate-500">
              Every plan includes all features. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.highlight
                    ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 scale-105'
                    : 'bg-white border border-slate-200 shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-4 ${plan.highlight ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-extrabold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                      ${plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlight ? 'text-indigo-200' : 'text-slate-500'}`}>/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-indigo-200' : 'text-indigo-600'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`text-sm ${plan.highlight ? 'text-indigo-100' : 'text-slate-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup"
                  className={`block w-full text-center py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    plan.highlight
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-950 to-indigo-950">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to put your social media on autopilot?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of businesses growing with AI-powered content.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-10 py-4 rounded-xl text-lg transition-all duration-200 shadow-lg shadow-indigo-500/25"
          >
            Start Free Today
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="text-white font-bold text-lg">PostPilot</span>
              </div>
              <p className="text-sm leading-relaxed">
                AI-powered social media automation for modern brands.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-sm text-center">
            © {new Date().getFullYear()} PostPilot. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
