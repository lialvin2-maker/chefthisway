// Supabase free projects pause after 7 days without database activity
// (that is what took the site down in 2026). This runs one tiny read query
// every day so the project stays awake.

// The anon key is public: it already ships inside the site's JavaScript.
const SUPABASE_URL = 'https://uoqmdcyaoettswicvddh.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_4VFL2pdL5avwMiRr7m60_w_oIwdmm1z'

export default async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/food_posts?select=id&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  })
  console.log(`Supabase keep-alive: HTTP ${res.status}`)
  if (!res.ok) throw new Error(`Supabase keep-alive failed: HTTP ${res.status}`)
}

export const config = { schedule: '@daily' }
