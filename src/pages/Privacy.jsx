import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Privacy() {
  const navigate = useNavigate()
  const { hash } = useLocation()
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView() }, [hash])

  return (
    <div className="bg-white min-h-full pb-12">
      <div className="px-4 pt-safe pb-4 border-b border-slate-100 sticky top-0 bg-white z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back" className="p-2.5 -ml-2.5 rounded-full hover:bg-gray-100 active:bg-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Privacy policy</h1>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto space-y-6 text-sm text-slate-600 leading-relaxed">
        <p className="text-xs text-slate-400">Last updated: October 2026</p>

        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">About ChefThisWay</h2>
          <p>
            ChefThisWay ("we", "our", or "us") is a platform that connects people who cook
            homemade food with people who want to buy it. This Privacy Policy explains how we
            collect, use, and protect your information when you use our website at{' '}
            <a href="https://chefthisway.com" className="text-brand-500 underline">chefthisway.com</a> or our iPhone app.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account information:</strong> your name and email address when you sign up with email, Google, or Sign in with Apple (Apple may give us a private relay email instead of your real one).</li>
            <li><strong>Profile information:</strong> your bio and profile photo if you choose to add them.</li>
            <li><strong>Listing information:</strong> food photos, descriptions, prices, and location you share when creating a listing.</li>
            <li><strong>Location:</strong> only when you choose it. To show food near you, the area you pick stays on your device. When you post a listing, the pickup location you enter (or your device location, if you tap "Use my location") is saved with the listing and used to show buyers how far away it is. Only enter a location you are happy to share for pickup. We never track your location in the background.</li>
            <li><strong>Messages:</strong> conversations between buyers and sellers on the platform.</li>
            <li><strong>Reviews, reports and blocks:</strong> reviews you leave, reports you send, and users you block.</li>
            <li><strong>Technical logs:</strong> our hosting providers keep standard server logs (such as IP address and request time) for security. We do not use analytics tools.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To create and manage your account.</li>
            <li>To display your food listings to other users.</li>
            <li>To enable messaging between buyers and sellers.</li>
            <li>To improve and maintain the platform.</li>
            <li>To show advertisements on the website through Google AdSense (not in the iPhone app).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">Google AdSense & Cookies</h2>
          <p>
            The iPhone app shows no ads and does no ad tracking. On the website, we use Google AdSense to display advertisements. Google may use cookies and similar
            technologies to show you ads based on your visits to this and other websites.
            You can opt out of personalized advertising by visiting{' '}
            <a href="https://www.google.com/settings/ads" className="text-brand-500 underline" target="_blank" rel="noopener noreferrer">
              Google Ad Settings
            </a>.
          </p>
          <p className="mt-2">
            For more information on how Google uses data, visit{' '}
            <a href="https://policies.google.com/technologies/partner-sites" className="text-brand-500 underline" target="_blank" rel="noopener noreferrer">
              How Google uses data when you use our partners' sites or apps
            </a>.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">Third-Party Services</h2>
          <p>We use the following third-party services to operate ChefThisWay:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>Supabase</strong> — database, authentication, and file storage.</li>
            <li><strong>Netlify</strong> — website hosting.</li>
            <li><strong>Google AdSense</strong> — advertising on the website only.</li>
            <li><strong>Google Sign-In</strong> and <strong>Sign in with Apple</strong> — signing in, if you choose them.</li>
            <li><strong>OpenStreetMap (Nominatim)</strong> — turns a location you choose into an address.</li>
          </ul>
          <p className="mt-2">Each of these services has its own privacy policy governing how they handle your data.</p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">Data Sharing</h2>
          <p>
            We do not sell your personal information. We only share your data with third-party
            services as necessary to operate the platform, or when required by law.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You can update or delete your profile information at any time.</li>
            <li>You can delete your listings at any time.</li>
            <li>You can delete your account and its data yourself: Profile → Settings → Delete account. You can also ask us by email.</li>
            <li>You can block any user from their profile. You won't see their listings and they can't message you.</li>
          </ul>
        </section>

        <section id="rules">
          <h2 className="font-bold text-slate-800 text-base mb-2">Community Rules</h2>
          <p>By using ChefThisWay you agree to these rules. We have zero tolerance for objectionable content or abusive users.</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>No unsafe, spoiled or falsely described food.</li>
            <li>No scams, fake listings or spam.</li>
            <li>No harassment, hate, threats, or sexual or violent content.</li>
          </ul>
          <p className="mt-2">
            Use "Report this listing" on a listing, or "Report user" on a profile, to flag a problem. We review reports within
            24 hours, remove content that breaks these rules, and ban the users who posted it.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">Children's Privacy</h2>
          <p>
            ChefThisWay is not directed at children under 13. We do not knowingly collect
            personal information from children under 13.
          </p>
        </section>

        <section>
          <h2 id="contact" className="font-bold text-slate-800 text-base mb-2">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:li.alvin2@gmail.com" className="text-brand-500 underline">
              li.alvin2@gmail.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  )
}
