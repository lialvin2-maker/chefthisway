import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [mode, setMode]       = useState('signin')   // 'signin' | 'signup'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]       = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleGoogle() {
    setLoading(true); setError('')
    try { await signInWithGoogle() }
    catch (e) { setError(e.message); setLoading(false) }
  }

  // Set to true once you configure Google OAuth in Supabase → Auth → Providers → Google
  const GOOGLE_ENABLED = true

  async function handleEmail(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
        navigate('/')
      } else {
        await signUpWithEmail(email, password, name)
        navigate('/')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Back */}
      <div className="px-4 pt-12">
        <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-gray-100 -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* Logo & heading */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="ChefThisWay" className="w-24 h-24 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {mode === 'signin' ? 'Sign in to post or contact sellers' : 'Join the ChefThisWay community'}
          </p>
        </div>

        {/* Google */}
        {GOOGLE_ENABLED ? (
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 rounded-xl py-3 font-semibold text-slate-700 hover:border-slate-300 hover:bg-gray-50 transition-colors mb-4 disabled:opacity-50"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-3 border-2 border-slate-100 rounded-xl py-3 font-semibold text-slate-300 mb-4 cursor-not-allowed select-none">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 opacity-30" />
            Continue with Google
            <span className="text-xs font-normal bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">coming soon</span>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmail} className="space-y-3">
          {mode === 'signup' && (
            <input className="input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
          )}
          <input className="input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
          <div className="relative">
            <input
              className="input pr-10"
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError('') }}
            className="text-brand-500 font-semibold"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <p className="text-center text-xs text-slate-400 mt-4">
          By continuing you agree to our{' '}
          <Link to="/privacy#rules" className="underline hover:text-brand-500">Community Rules</Link> and{' '}
          <Link to="/privacy" className="underline hover:text-brand-500">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
