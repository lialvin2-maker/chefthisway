import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Signing you in…')
  const navigatedRef = useRef(false)

  useEffect(() => {
    // Handle provider-level errors (e.g. user denied permission)
    const params = new URLSearchParams(window.location.search)
    const error_param = params.get('error')
    const error_description = params.get('error_description')

    if (error_param) {
      console.error('[AuthCallback] Provider error:', error_param, error_description)
      setStatus('Sign-in failed: ' + (error_description ?? error_param))
      setTimeout(() => navigate('/login?error=' + encodeURIComponent(error_param), { replace: true }), 2000)
      return
    }

    function goHome() {
      if (!navigatedRef.current) {
        navigatedRef.current = true
        // Strip Google provider_token so the Supabase client doesn't hang
        // on future page loads trying to validate it.
        try {
          const key = 'sb-uoqmdcyaoettswicvddh-auth-token'
          const raw = localStorage.getItem(key)
          if (raw) {
            const stored = JSON.parse(raw)
            delete stored.provider_token
            delete stored.provider_refresh_token
            localStorage.setItem(key, JSON.stringify(stored))
          }
        } catch { /* ignore */ }
        console.log('[AuthCallback] ✅ Session found — navigating home')
        navigate('/', { replace: true })
      }
    }

    // Primary: listen for auth state change fired by detectSessionInUrl
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthCallback] auth event:', event, '| session:', !!session)
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        goHome()
      }
    })

    // Secondary: immediate getSession check in case it was already set
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthCallback] getSession:', !!session)
      if (session) goHome()
    })

    // Fallback: give up after 15 s and show error
    const timeout = setTimeout(() => {
      if (!navigatedRef.current) {
        console.warn('[AuthCallback] Timed out waiting for session')
        navigate('/login?error=no_session', { replace: true })
      }
    }, 15000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white gap-4">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">{status}</p>
    </div>
  )
}
