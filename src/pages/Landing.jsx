import { Link } from 'react-router-dom'
import { ChefHat, Search, MessageCircle, Star } from 'lucide-react'

const FEATURES = [
  { icon: Search,        title: 'Discover Local Food',   desc: 'Browse homemade food from talented cooks near you.' },
  { icon: MessageCircle, title: 'Chat Directly',          desc: 'Message sellers, ask questions, and arrange pickup.' },
  { icon: Star,          title: 'Honest Reviews',         desc: 'Community ratings so you always know what to expect.' },
  { icon: ChefHat,       title: 'Share Your Cooking',     desc: 'Post your homemade food and start earning today.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-500 to-orange-400 text-white px-6 pt-16 pb-20 text-center">
        <img src="/logo.png" alt="ChefThisWay" className="w-28 h-28 mx-auto mb-5 drop-shadow-lg" />
        <h1 className="text-3xl font-extrabold leading-tight">
          Homemade food,<br />from neighbours you trust
        </h1>
        <p className="mt-3 text-orange-100 text-base max-w-xs mx-auto">
          Buy and sell fresh homemade food right in your neighbourhood.
        </p>
        <div className="mt-8 flex flex-col gap-3 max-w-xs mx-auto">
          <Link to="/" className="bg-white text-brand-600 font-bold py-3 rounded-xl shadow-lg hover:bg-orange-50 transition-colors">
            Browse Food Near Me
          </Link>
          <Link to="/login" className="border-2 border-white text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition-colors">
            Sign Up Free
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-12">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">How it works</h2>
        <div className="space-y-6">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-6 h-6 text-brand-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{f.title}</h3>
                <p className="text-slate-500 text-sm mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-16 text-center">
        <div className="bg-brand-50 rounded-3xl p-8">
          <p className="text-2xl font-bold text-slate-800 mb-2">Ready to dig in?</p>
          <p className="text-slate-500 text-sm mb-6">Join hundreds of food lovers in your area.</p>
          <Link to="/" className="btn-primary inline-block px-8">
            Explore the App
          </Link>
        </div>
      </div>
    </div>
  )
}
