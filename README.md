# ChefThisWay 🍽️

A homemade-food marketplace app — rebuilt from Base44 as a standalone React app with Supabase backend.

## Quick Start (5 steps)

### Step 1 — Add your logo
Copy your `ChefThisWay` logo image to:
```
public/logo.png
```
(Replace the placeholder SVG that's there now.)

### Step 2 — Set up Supabase (free)
1. Go to [supabase.com](https://supabase.com) → **Start your project** → sign up free
2. Create a new project (choose a region close to Canada, e.g. US East)
3. Once the project is ready, go to **SQL Editor → New Query**
4. Paste the entire contents of `supabase_schema.sql` and click **Run**
5. Go to **Storage** → create two buckets:
   - `food-photos` — set to **Public**
   - `avatars` — set to **Public**
6. Go to **Settings → API** and copy:
   - **Project URL**
   - **anon public** key

### Step 3 — Add your API keys
Open `.env.local` and fill in:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4 — Enable Google Sign-In (optional)
1. In Supabase: **Authentication → Providers → Google → Enable**
2. Follow the prompts to get a Google OAuth Client ID from [console.cloud.google.com](https://console.cloud.google.com)
3. Add your site URL to the **Redirect URLs** list

### Step 5 — Install & run
```bash
cd C:\Users\lialv\ChefThisWay
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) 🎉

---

## Deploy to Vercel (free hosting)
```bash
npm install -g vercel
vercel
```
- Add your `.env.local` variables in Vercel → Project Settings → Environment Variables
- Your app will be live at `https://chefthisway.vercel.app` (or your custom domain)

---

## Update your iOS app
Once deployed, open `Sources/ContentView.swift` and change:
```swift
private let appURL = URL(string: "https://your-vercel-url.vercel.app")!
```

---

## Google AdSense
The home page (`/`) is **fully public** — no login required. This satisfies Google's requirement of showing real content before a login wall.

After going live:
1. Apply at [adsense.google.com](https://adsense.google.com)
2. Once approved, add your publisher tag to `index.html` (the comment is already there)

---

## Pages
| Route | Page | Auth Required |
|---|---|---|
| `/` | Home feed | ❌ Public |
| `/categories` | Category browser | ❌ Public |
| `/post/:id` | Food post detail | ❌ Public |
| `/profile/:id` | User profile | ❌ Public |
| `/landing` | Marketing landing | ❌ Public |
| `/login` | Sign in / Sign up | ❌ Public |
| `/create` | Post a listing | ✅ Required |
| `/edit-profile` | Edit your profile | ✅ Required |
| `/inbox` | Messages list | ✅ Required |
| `/chat/:id` | Chat thread | ✅ Required |
