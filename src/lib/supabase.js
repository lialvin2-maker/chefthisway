import { createClient } from '@supabase/supabase-js'

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase keys not found. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
  )
}

const URL  = supabaseUrl  || 'https://placeholder.supabase.co'
const ANON = supabaseAnonKey || 'placeholder'

// ── Auth client ──────────────────────────────────────────────────────────────
// Used for all authentication operations and for writes that need RLS.
// detectSessionInUrl:true so AuthCallback can pick up the OAuth code.
export const supabase = createClient(URL, ANON, {
  auth: {
    detectSessionInUrl: true,
    persistSession:     true,
    autoRefreshToken:   true,
  },
})

// ── Data client ──────────────────────────────────────────────────────────────
// Used for READ queries (food_posts, profiles, reviews…) and lightweight writes.
// detectSessionInUrl:false + autoRefreshToken:false means this client
// initialises instantly with no internal auth lock.
//
// IMPORTANT: we give it a no-op storage so its internal GoTrueClient never
// touches the same localStorage key as the main auth client.  Without this,
// newer Supabase SDK versions warn "Multiple GoTrueClient instances detected"
// and the two clients can corrupt each other's stored session, causing
// seemingly-random RLS failures.
const _noopStorage = {
  getItem:    ()  => null,
  setItem:    ()  => {},
  removeItem: ()  => {},
}

export const supabaseData = createClient(URL, ANON, {
  auth: {
    detectSessionInUrl: false,
    persistSession:     false,
    autoRefreshToken:   false,
    storage:            _noopStorage,          // ← isolated storage, never touches main key
    storageKey:         '_ctw_data_client',    // ← different key → no "multiple instances" warning
  },
  global: {
    headers: {
      // Pull the current token synchronously from localStorage on every request.
      // The main supabase client keeps this key fresh (autoRefreshToken: true).
      get Authorization() {
        try {
          const raw = localStorage.getItem(`sb-${URL.split('//')[1].split('.')[0]}-auth-token`)
          const token = raw ? JSON.parse(raw) : null
          return token?.access_token ? `Bearer ${token.access_token}` : `Bearer ${ANON}`
        } catch {
          return `Bearer ${ANON}`
        }
      },
    },
  },
})
