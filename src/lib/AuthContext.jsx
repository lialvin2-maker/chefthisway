import { createContext, useContext, useEffect, useState } from 'react' // useState kept for user/profile state
import { supabase, supabaseData } from './supabase'

const AuthContext = createContext(null)

// ─── Synchronous bootstrap ───────────────────────────────────────────────────
// Read the stored Supabase session from localStorage without any SDK round-trip.
// This lets us render the correct UI instantly even if the SDK initialisation
// hangs (e.g. Supabase trying to refresh/validate the Google provider_token).
const PROJECT_ID = 'uoqmdcyaoettswicvddh'
const SESSION_KEY = `sb-${PROJECT_ID}-auth-token`

// Strip provider_token / provider_refresh_token from localStorage.
// These Google-issued tokens cause the Supabase JS client to make a blocking
// outbound call to Google on every page load, which can hang indefinitely.
// ChefThisWay never calls Google APIs directly, so these tokens are unused.
function stripProviderTokens() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return
    const stored = JSON.parse(raw)
    if (stored.provider_token || stored.provider_refresh_token) {
      delete stored.provider_token
      delete stored.provider_refresh_token
      localStorage.setItem(SESSION_KEY, JSON.stringify(stored))
    }
  } catch { /* ignore */ }
}

function readStoredSession() {
  try {
    stripProviderTokens()                            // clean before reading
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const token = JSON.parse(raw)
    const nowSecs = Date.now() / 1000
    // Decode the JWT payload to check expiry
    const payload = JSON.parse(atob(token.access_token.split('.')[1]))
    if (payload.exp < nowSecs) return null           // expired
    return token
  } catch {
    return null
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const storedSession = readStoredSession()

  const [user, setUser]       = useState(storedSession?.user ?? null)
  const [profile, setProfile] = useState(null)
  // Never block the UI — synchronous bootstrap means we start ready
  const loading = false

  useEffect(() => {
    // If we bootstrapped a user from localStorage, fetch their profile immediately
    if (storedSession?.user) {
      fetchProfile(storedSession.user.id)
    }

    // onAuthStateChange fires INITIAL_SESSION immediately on subscribe,
    // giving us the SDK-validated session without a separate getSession() call.
    // This avoids the navigator.locks hang that getSession() can cause in v2.105+.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) await fetchProfile(session.user.id)
        else setProfile(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProfile(userId) {
    try {
      const { data } = await supabaseData
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data ?? null)
    } catch (err) {
      console.error('[AuthContext] fetchProfile error:', err)
    }
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
    return { data, error }
  }

  async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signUpWithEmail(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
