# ChefThisWay — Project Context for Claude Code

## What this app is
A mobile-first web app where people can discover and buy homemade food near them. Sellers post food listings with photos, prices, and location. Buyers browse, filter, message sellers, and leave reviews.

Live at: https://chefthisway.com (also https://chefthisway.netlify.app)

---

## Tech stack
| Layer | Tool |
|---|---|
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS (custom brand color: orange `brand-500`) |
| Routing | React Router v6 |
| Data fetching | TanStack Query (react-query) |
| Backend / DB | Supabase (Postgres + Auth + Storage + Realtime) |
| Hosting | Netlify (free plan) |
| Ads | Google AdSense (pub-7875388851226483) |

---

## Deploying
Always run in this order:
```bash
npm run build
npx netlify-cli deploy --dir=dist --prod
```
The project is linked to Netlify site ID `65abd287-cb5e-4650-80ef-d39243e7f262` (site name: chefthisway).
`public/_redirects` handles SPA routing — do not delete it.

---

## Key files
```
src/
  pages/
    Home.jsx          — main feed with search, filters, category tabs, card grid
    Profile.jsx       — user profile, listings tab, liked tab
    Inbox.jsx         — conversation list
    Chat.jsx          — individual message thread
    PostDetail.jsx    — single listing page
    CreatePost.jsx    — create new listing
    EditPost.jsx      — edit existing listing
    EditProfile.jsx   — edit profile
    Login.jsx         — sign in / sign up
  components/
    FoodCard.jsx      — card used in grids (compact=true for 2-col grid)
    AdSlot.jsx        — Google AdSense banner component (reusable)
    ReviewForm.jsx    — review submission
    DefaultAvatar.jsx — fallback avatar
  lib/
    supabase.js       — Supabase clients (supabase for auth, supabaseData for data)
    AuthContext.jsx   — useAuth() hook (user, profile, loading)
    utils.js          — CATEGORIES, getDistance, formatPrice, isHighRiskPost, etc.
  Layout.jsx          — bottom nav bar wrapper
  App.jsx             — routes
  main.jsx            — React entry point
public/
  _redirects          — Netlify SPA routing rule (/* /index.html 200)
  ads.txt             — AdSense authorization file
  logo.png            — app logo
index.html            — includes AdSense script tag
```

---

## AdSense setup
- Publisher ID: `ca-pub-7875388851226483`
- AdSense script is in `index.html`
- `public/ads.txt` declares the publisher
- Reusable ad component: `src/components/AdSlot.jsx`
- **Ad slot ID is currently `'YOUR_AD_SLOT_ID'`** — replace this once AdSense approves the account and you create a Display ad unit at https://adsense.google.com → Ads → By ad unit → Display ads

Ad slots are placed in:
- Home feed: every 4 cards in the main grid
- Home "no food found" empty state
- Inbox: top of page
- Profile: bottom of page
- Liked listings: below the liked posts grid

---

## What still needs to be done

### 1. iOS / PWA (PRIORITY — do this next)
Turn the existing React app into a Progressive Web App so iPhone users can add it to their home screen from Safari and get a full-screen app experience. No App Store required.

Steps:
1. Create `public/manifest.json` with app name, icons, theme color (`#f97316`), display mode `standalone`
2. Add `<link rel="manifest" href="/manifest.json">` to `index.html`
3. Add `<meta name="apple-mobile-web-app-capable" content="yes">` and related Apple meta tags to `index.html`
4. Create `public/sw.js` — a basic service worker that caches the shell for offline use
5. Register the service worker in `src/main.jsx`
6. Add apple touch icons (use logo.png, ideally at 180×180)
7. Build and deploy

### 2. Privacy Policy page
AdSense requires a Privacy Policy. Create a simple `/privacy` route with a basic policy page. This may have been the original reason AdSense flagged the account.

### 3. Connect GitHub for auto-deploys
Currently every deploy is manual (`npx netlify-cli deploy`). Connecting the GitHub repo to Netlify will auto-deploy on every push to main.

### 4. Supabase reviews RLS fix (unconfirmed)
This SQL may still need to be run in the Supabase SQL editor:
```sql
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'reviews' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY %I ON reviews', r.policyname); END LOOP;
END $$;
CREATE POLICY "Reviews are publicly readable" ON reviews FOR SELECT USING (true);
```

---

## Owner info
- Netlify account: No Time Audio
- Supabase project: connected (credentials in .env or environment)
- AdSense account: li.alvin2@gmail.com
- Domain registrar: Namecheap (chefthisway.com)
  - A record: @ → 75.2.60.5
  - CNAME: www → chefthisway.netlify.app

---

## Setting up on a new machine (e.g. Mac)

### 1. Install Node.js
Download and install from https://nodejs.org (LTS version).
Verify: `node -v` and `npm -v` should both print version numbers.

### 2. Clone the repo and install dependencies
```bash
git clone https://github.com/lialvin2-maker/chefthisway.git
cd chefthisway
npm install
```

### 3. Create the environment file
Create a file called `.env.local` in the project root with this exact content:
```
VITE_SUPABASE_URL=https://uoqmdcyaoettswicvddh.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_4VFL2pdL5avwMiRr7m60_w_oIwdmm1z
```
This file is not in GitHub (intentionally). Without it the app will not connect to the database.

### 4. Log in to Netlify CLI
```bash
npx netlify-cli login
```
This opens a browser — log in with the "No Time Audio" account (li.alvin2@gmail.com).

### 5. Link to the correct Netlify site
```bash
npx netlify-cli link --id 65abd287-cb5e-4650-80ef-d39243e7f262
```

### 6. Verify everything works
```bash
npm run dev
```
Open http://localhost:5173 — the app should load and show real data from Supabase.

### 7. Deploy (when ready)
```bash
npm run build
npx netlify-cli deploy --dir=dist --prod
```
