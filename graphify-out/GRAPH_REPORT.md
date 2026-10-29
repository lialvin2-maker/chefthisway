# Graph Report - ChefThisWay  (2026-10-29)

## Corpus Check
- 36 files · ~26,358 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 310 nodes · 666 edges · 16 communities (13 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `344883c7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Profile.jsx
- package.json
- PostDetail
- ChefThisWay — Project Context for Claude Code
- ChefThisWay — Project Context for Claude Code
- Chat
- Home.jsx
- AuthProvider
- CreatePost
- EditPost
- ChefThisWay 🍽️
- App.jsx
- keepalive.mjs
- Coordinator

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 31 edges
2. `Home()` - 29 edges
3. `PostDetail()` - 20 edges
4. `CreatePost()` - 19 edges
5. `EditPost()` - 19 edges
6. `react` - 18 edges
7. `react-router-dom` - 18 edges
8. `App()` - 18 edges
9. `lucide-react` - 17 edges
10. `supabase` - 16 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `Categories()`  [EXTRACTED]
  src/App.jsx → src/pages/Categories.jsx
- `App()` --calls--> `Chat()`  [EXTRACTED]
  src/App.jsx → src/pages/Chat.jsx
- `App()` --calls--> `CreatePost()`  [EXTRACTED]
  src/App.jsx → src/pages/CreatePost.jsx
- `App()` --calls--> `EditPost()`  [EXTRACTED]
  src/App.jsx → src/pages/EditPost.jsx
- `App()` --calls--> `EditProfile()`  [EXTRACTED]
  src/App.jsx → src/pages/EditProfile.jsx

## Import Cycles
- None detected.

## Communities (16 total, 3 thin omitted)

### Community 0 - "Profile.jsx"
Cohesion: 0.27
Nodes (9): AdSlot(), REASONS, ReportDialog(), useToggleBlock(), fetchLikedPosts(), fetchProfile(), fetchUserPosts(), Profile() (+1 more)

### Community 1 - "package.json"
Cohesion: 0.05
Nodes (35): dependencies, clsx, lucide-react, react, react-dom, react-router-dom, @supabase/supabase-js, tailwind-merge (+27 more)

### Community 2 - "PostDetail"
Cohesion: 0.24
Nodes (6): fetchPost(), fetchReviews(), PostDetail(), handleTouchEnd(), lightboxNext(), lightboxPrev()

### Community 3 - "ChefThisWay — Project Context for Claude Code"
Cohesion: 0.10
Nodes (20): 1. Install Node.js, 1. iOS / PWA (PRIORITY — do this next), 2. Clone the repo and install dependencies, 2. Privacy Policy page, 3. Connect GitHub for auto-deploys, 3. Create the environment file, 4. Log in to Netlify CLI, 4. Supabase reviews RLS fix (unconfirmed) (+12 more)

### Community 4 - "ChefThisWay — Project Context for Claude Code"
Cohesion: 0.10
Nodes (20): 1. Install Node.js, 1. iOS / PWA (PRIORITY — do this next), 2. Clone the repo and install dependencies, 2. Privacy Policy page, 3. Connect GitHub for auto-deploys, 3. Create the environment file, 4. Log in to Netlify CLI, 4. Supabase reviews RLS fix (unconfirmed) (+12 more)

### Community 5 - "Chat"
Cohesion: 0.18
Nodes (9): ReviewForm(), handleSubmit(), uploadPhotos(), effectiveCooloffHours(), reviewEligibility(), Chat(), fetchConversation(), fetchMessages() (+1 more)

### Community 6 - "Home.jsx"
Cohesion: 0.10
Nodes (34): DefaultAvatar(), GRADIENTS, FoodCard(), useBlockedIds(), CATEGORIES, CATEGORY_CHILDREN, categoryKeysFor(), descriptionWithoutMarker() (+26 more)

### Community 7 - "AuthProvider"
Cohesion: 0.11
Nodes (20): AuthProvider(), fetchProfile(), refreshProfile(), signInWithApple(), signInWithEmail(), signInWithGoogle(), signOut(), signUpWithEmail() (+12 more)

### Community 8 - "CreatePost"
Cohesion: 0.17
Nodes (11): CreatePost(), CategoryTile(), handleLocationChange(), handleSubmit(), selectLocation(), toggleCategory(), uploadPhotos(), uploadVideo() (+3 more)

### Community 9 - "EditPost"
Cohesion: 0.17
Nodes (11): EditPost(), CategoryTile(), handleLocationChange(), handleSubmit(), selectLocation(), toggleCategory(), uploadPhotos(), uploadVideo() (+3 more)

### Community 10 - "ChefThisWay 🍽️"
Cohesion: 0.17
Nodes (11): ChefThisWay 🍽️, Deploy to Vercel (free hosting), Google AdSense, Pages, Quick Start (5 steps), Step 1 — Add your logo, Step 2 — Set up Supabase (free), Step 3 — Add your API keys (+3 more)

### Community 11 - "App.jsx"
Cohesion: 0.16
Nodes (24): lucide-react, react, react-dom, react-router-dom, @tanstack/react-query, App(), ProtectedRoute(), Layout() (+16 more)

### Community 15 - "Coordinator"
Cohesion: 0.08
Nodes (5): AuthenticationServices, ChefWebView, Coordinator, SwiftUI, WebKit

## Knowledge Gaps
- **8 isolated node(s):** `SwiftUI`, `WebKit`, `AuthenticationServices`, `@types/react`, `@types/react-dom` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 134 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `App.jsx` to `Profile.jsx`, `PostDetail`, `Chat`, `Home.jsx`, `AuthProvider`, `CreatePost`, `EditPost`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `SwiftUI`, `WebKit`, `AuthenticationServices` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Why does `CreatePost()` connect `CreatePost` to `App.jsx`, `Home.jsx`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `ChefThisWay — Project Context for Claude Code` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Why does `EditPost()` connect `EditPost` to `App.jsx`, `Home.jsx`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `ChefThisWay — Project Context for Claude Code` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._