import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Layout from './Layout'

// Pages
import Home        from './pages/Home'
import Landing     from './pages/Landing'
import Categories  from './pages/Categories'
import PostDetail  from './pages/PostDetail'
import CreatePost  from './pages/CreatePost'
import EditPost    from './pages/EditPost'
import Profile     from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Inbox       from './pages/Inbox'
import Chat        from './pages/Chat'
import Login        from './pages/Login'
import AuthCallback from './pages/AuthCallback'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { loading } = useAuth()

  // The auth callback page must render immediately (before loading resolves)
  // so that Supabase can exchange the OAuth code and establish the session.
  // If we show the loading spinner here instead, the code expires unused.
  const isAuthCallback = window.location.pathname === '/auth/callback'

  if (loading && !isAuthCallback) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <img src="/logo.png" alt="ChefThisWay" className="w-20 h-20 animate-pulse" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes — no login required (important for Google Ads) */}
      <Route path="/"            element={<Layout><Home /></Layout>} />
      <Route path="/landing"     element={<Landing />} />
      <Route path="/categories"  element={<Layout><Categories /></Layout>} />
      <Route path="/post/:id"    element={<Layout><PostDetail /></Layout>} />
      <Route path="/profile/:id" element={<Layout><Profile /></Layout>} />
      <Route path="/login"         element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes — login required */}
      <Route path="/create"         element={<ProtectedRoute><Layout><CreatePost /></Layout></ProtectedRoute>} />
      <Route path="/edit-post/:id" element={<ProtectedRoute><Layout><EditPost /></Layout></ProtectedRoute>} />
      <Route path="/edit-profile" element={<ProtectedRoute><Layout><EditProfile /></Layout></ProtectedRoute>} />
      <Route path="/inbox"        element={<ProtectedRoute><Layout><Inbox /></Layout></ProtectedRoute>} />
      <Route path="/chat/:id"     element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
