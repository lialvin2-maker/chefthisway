import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, X } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { isNativeApp } from '../lib/nativeApp'

export default function Login() {
  const navigate = useNavigate()
  const { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail } = useAuth()
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

  async function handleApple() {
    setLoading(true); setError('')
    try { await signInWithApple(); navigate('/') }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  // Set to true once you configure Google OAuth in Supabase → Auth → Providers → Google.
  // Off in the iOS app: Google refuses sign-in inside an app web view, so the app offers Apple instead.
  const GOOGLE_ENABLED = !isNativeApp

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
      {/* Close (top right, like an iOS sheet) */}
      <div className="flex justify-end px-4 pt-safe">
        <button
          onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))}
          aria-label="Close"
          className="p-3 -mr-1 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition"
        >
          <X className="w-5 h-5 text-slate-700" />
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

        {/* Apple (iOS app) / Google (web) */}
        {isNativeApp ? (
          <button
            onClick={handleApple}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-xl py-3 font-semibold hover:bg-slate-800 active:scale-[0.98] transition mb-4 disabled:opacity-50"
          >
            <svg viewBox="0 0 384 512" className="w-4 h-4 fill-current" aria-hidden="true">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
            Sign in with Apple
          </button>
        ) : GOOGLE_ENABLED ? (
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
            <input className="input" placeholder="Full name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required />
          )}
          <input className="input" type="email" autoComplete="email" inputMode="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
          <div className="relative">
            <input
              className="input pr-12"
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-slate-400 hover:text-slate-600">
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
