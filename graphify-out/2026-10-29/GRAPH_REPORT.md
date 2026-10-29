# Graph Report - ChefThisWay  (2026-10-29)

## Corpus Check
- 34 files · ~24,941 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 265 nodes · 580 edges · 15 communities (12 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9ebbe0c3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.jsx
- package.json
- Home.jsx
- ChefThisWay — Project Context for Claude Code
- ChefThisWay — Project Context for Claude Code
- Chat.jsx
- Home
- AuthProvider
- CreatePost
- EditPost
- ChefThisWay 🍽️
- useAuth
- keepalive.mjs

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 31 edges
2. `Home()` - 21 edges
3. `react` - 19 edges
4. `PostDetail()` - 19 edges
5. `react-router-dom` - 18 edges
6. `App()` - 18 edges
7. `CreatePost()` - 18 edges
8. `EditPost()` - 18 edges
9. `lucide-react` - 17 edges
10. `supabase` - 16 edges

## Surprising Connections (you probably didn't know these)
- `ProtectedRoute()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.jsx → src/lib/AuthContext.jsx
- `App()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.jsx → src/lib/AuthContext.jsx
- `App()` --calls--> `Categories()`  [EXTRACTED]
  src/App.jsx → src/pages/Categories.jsx
- `App()` --calls--> `Chat()`  [EXTRACTED]
  src/App.jsx → src/pages/Chat.jsx
- `App()` --calls--> `CreatePost()`  [EXTRACTED]
  src/App.jsx → src/pages/CreatePost.jsx

## Import Cycles
- None detected.

## Communities (15 total, 3 thin omitted)

### Community 0 - "App.jsx"
Cohesion: 0.16
Nodes (16): lucide-react, react, react-dom, react-router-dom, App(), ProtectedRoute(), Layout(), NAV (+8 more)

### Community 1 - "package.json"
Cohesion: 0.05
Nodes (35): dependencies, clsx, lucide-react, react, react-dom, react-router-dom, @supabase/supabase-js, tailwind-merge (+27 more)

### Community 2 - "Home.jsx"
Cohesion: 0.14
Nodes (22): @tanstack/react-query, DefaultAvatar(), GRADIENTS, FoodCard(), CATEGORIES, descriptionWithoutMarker(), displayPrice(), formatPrice() (+14 more)

### Community 3 - "ChefThisWay — Project Context for Claude Code"
Cohesion: 0.10
Nodes (20): 1. Install Node.js, 1. iOS / PWA (PRIORITY — do this next), 2. Clone the repo and install dependencies, 2. Privacy Policy page, 3. Connect GitHub for auto-deploys, 3. Create the environment file, 4. Log in to Netlify CLI, 4. Supabase reviews RLS fix (unconfirmed) (+12 more)

### Community 4 - "ChefThisWay — Project Context for Claude Code"
Cohesion: 0.10
Nodes (20): 1. Install Node.js, 1. iOS / PWA (PRIORITY — do this next), 2. Clone the repo and install dependencies, 2. Privacy Policy page, 3. Connect GitHub for auto-deploys, 3. Create the environment file, 4. Log in to Netlify CLI, 4. Supabase reviews RLS fix (unconfirmed) (+12 more)

### Community 5 - "Chat.jsx"
Cohesion: 0.18
Nodes (12): ReviewForm(), handleSubmit(), uploadPhotos(), effectiveCooloffHours(), formatDate(), formatTimeAgo(), REVIEW_COOLOFF_HOURS, reviewEligibility() (+4 more)

### Community 6 - "Home"
Cohesion: 0.21
Nodes (7): fetchPosts(), formatNominatimLabel(), Home(), saveLocation(), selectLocationResult(), useGpsLocation(), searchLocations()

### Community 7 - "AuthProvider"
Cohesion: 0.17
Nodes (13): AuthProvider(), fetchProfile(), refreshProfile(), signInWithEmail(), signInWithGoogle(), signOut(), signUpWithEmail(), EditProfile() (+5 more)

### Community 8 - "CreatePost"
Cohesion: 0.17
Nodes (11): CreatePost(), CategoryTile(), handleLocationChange(), handleSubmit(), selectLocation(), toggleCategory(), uploadPhotos(), uploadVideo() (+3 more)

### Community 9 - "EditPost"
Cohesion: 0.17
Nodes (11): EditPost(), CategoryTile(), handleLocationChange(), handleSubmit(), selectLocation(), toggleCategory(), uploadPhotos(), uploadVideo() (+3 more)

### Community 10 - "ChefThisWay 🍽️"
Cohesion: 0.17
Nodes (11): ChefThisWay 🍽️, Deploy to Vercel (free hosting), Google AdSense, Pages, Quick Start (5 steps), Step 1 — Add your logo, Step 2 — Set up Supabase (free), Step 3 — Add your API keys (+3 more)

### Community 11 - "useAuth"
Cohesion: 0.16
Nodes (19): AdSlot(), REASONS, ReportDialog(), AuthContext, readStoredSession(), stripProviderTokens(), useAuth(), useBlockedIds() (+11 more)

## Knowledge Gaps
- **5 isolated node(s):** `@types/react`, `@types/react-dom`, `autoprefixer`, `postcss`, `tailwindcss`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 122 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `App.jsx`, `Home.jsx`, `Chat.jsx`, `Home`, `AuthProvider`, `CreatePost`, `EditPost`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **What connects `@types/react`, `@types/react-dom`, `autoprefixer` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Why does `CreatePost()` connect `CreatePost` to `App.jsx`, `useAuth`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `Home.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13825757575757575 - nodes in this community are weakly interconnected._
- **Why does `EditPost()` connect `EditPost` to `App.jsx`, `useAuth`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `ChefThisWay — Project Context for Claude Code` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._