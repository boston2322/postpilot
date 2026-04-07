export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-500">Last updated: April 7, 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Introduction</h2>
            <p>PostPilot (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the PostPilot platform, an AI-powered social media scheduling and automation service. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service at <a href="https://postpilot-v2-three.vercel.app" className="text-indigo-600 underline">postpilot-v2-three.vercel.app</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account information:</strong> Name, email address, and password when you register.</li>
              <li><strong>Company information:</strong> Business name, website URL, and brand data you provide.</li>
              <li><strong>Social media tokens:</strong> OAuth access tokens for platforms you connect (Facebook, Instagram, etc.), stored encrypted.</li>
              <li><strong>Usage data:</strong> Posts created, scheduled, and published through our platform.</li>
              <li><strong>Billing information:</strong> Subscription plan details processed securely via Stripe. We do not store card numbers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide, operate, and maintain our service</li>
              <li>To publish social media posts on your behalf to connected platforms</li>
              <li>To process subscription payments</li>
              <li>To generate AI-powered content based on your brand profile</li>
              <li>To send service-related communications</li>
              <li>To improve and personalise your experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Social Media Platform Data</h2>
            <p>When you connect a social media account, we receive OAuth tokens that allow us to publish content on your behalf. We only request the minimum permissions necessary. We do not sell or share your social media data with third parties. You can revoke access at any time from your account settings or directly from the platform.</p>
            <p className="mt-2">For Facebook and Instagram, our use of data obtained via the Meta API complies with <a href="https://developers.facebook.com/policy/" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">Meta&apos;s Platform Terms</a> and <a href="https://developers.facebook.com/policy/developer_policies/" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">Developer Policies</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Stripe</strong> — for payment processing</li>
              <li><strong>Supabase</strong> — for secure database hosting</li>
              <li><strong>OpenAI</strong> — for AI content generation (no personal data shared)</li>
              <li><strong>Social platforms</strong> — only the content you authorise us to post</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Data Security</h2>
            <p>We implement industry-standard security measures including encryption of sensitive tokens, HTTPS-only transmission, and secure database access controls. However, no method of transmission over the Internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us. You can also delete your account and all associated data from your account settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Cookies</h2>
            <p>We use only essential cookies required for authentication and session management. We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Children&apos;s Privacy</h2>
            <p>Our service is not directed to anyone under the age of 13. We do not knowingly collect personal information from children.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by email or via a notice on our platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
            <p className="mt-2 font-medium">PostPilot<br />Email: bostonchamberlain@icloud.com</p>
          </section>

        </div>
      </div>
    </div>
  )
}
