import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, ArrowLeft, Package, Heart, Trash2, Pencil } from 'lucide-react'
import { supabase, supabaseData } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import FoodCard from '../components/FoodCard'
import AdSlot from '../components/AdSlot'
import DefaultAvatar from '../components/DefaultAvatar'

async function fetchProfile(id) {
  const { data } = await supabaseData.from('profiles').select('*').eq('id', id).single()
  return data
}
async function fetchUserPosts(id) {
  const { data } = await supabaseData
    .from('food_posts')
    .select('*')
    .eq('seller_id', id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
  return data ?? []
}
async function fetchLikedPosts(userId) {
  // Get the post IDs this user has liked
  const { data: likes } = await supabaseData
    .from('likes')
    .select('post_id')
    .eq('user_id', userId)
  if (!likes || likes.length === 0) return []

  const ids = likes.map(l => l.post_id)
  const { data: posts } = await supabaseData
    .from('food_posts')
    .select('*')
    .in('id', ids)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
  return posts ?? []
}

const TABS = ['Listings', 'Liked']

export default function Profile() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isMe = user?.id === id
  const [tab, setTab] = useState('Listings')
  const [deletingId, setDeletingId] = useState(null)

  const deleteMutation = useMutation({
    mutationFn: async (postId) => {
      const { error } = await supabaseData
        .from('food_posts')
        .update({ status: 'deleted' })
        .eq('id', postId)
        .eq('seller_id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      setDeletingId(null)
      qc.invalidateQueries(['user-posts', id])
    },
  })

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => fetchProfile(id),
  })
  const { data: posts = [] } = useQuery({
    queryKey: ['user-posts', id],
    queryFn: () => fetchUserPosts(id),
  })
  const { data: likedPosts = [], isLoading: likedLoading } = useQuery({
    queryKey: ['liked-posts', id],
    queryFn: () => fetchLikedPosts(id),
    enabled: isMe,  // only fetch liked posts for own profile
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const activePosts = posts.filter(p => p.status === 'active')
  const soldPosts   = posts.filter(p => p.status === 'sold')

  return (
    <div className="bg-gray-50 min-h-full pb-8">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {isMe && (
            <Link to="/edit-profile" className="p-2 rounded-xl hover:bg-gray-100">
              <Settings className="w-5 h-5 text-slate-600" />
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} className="w-20 h-20 rounded-full object-cover border-4 border-brand-100" alt={profile.full_name} />
            : <DefaultAvatar name={profile?.full_name} className="w-20 h-20 text-3xl" />
          }
          <div>
            <h1 className="text-xl font-bold text-slate-800">{profile?.full_name ?? 'User'}</h1>
            {profile?.bio && <p className="text-sm text-slate-500 mt-0.5">{profile.bio}</p>}
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Package className="w-3 h-3" /> {activePosts.length} active
              </span>
              {isMe && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Heart className="w-3 h-3 text-rose-400" /> {likedPosts.length} liked
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 divide-x divide-slate-100 bg-white mt-2 border-y border-slate-100">
        {[
          { label: 'Listings', value: activePosts.length },
          { label: 'Reviews',  value: posts.reduce((a, p) => a + (p.reviews_count ?? 0), 0) },
        ].map(s => (
          <div key={s.label} className="py-4 text-center">
            <p className="text-xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs — only show Liked tab on own profile */}
      {isMe && (
        <div className="flex bg-white border-b border-slate-100 px-4">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                tab === t
                  ? 'text-brand-500 border-b-2 border-brand-500'
                  : 'text-slate-500'
              }`}
            >
              {t === 'Liked' && <Heart className="w-3.5 h-3.5" />}
              {t}
            </button>
          ))}
        </div>
      )}

      {/* ── Listings tab ── */}
      {tab === 'Listings' && (
        <div className="px-4 py-4">
          <h2 className="font-bold text-slate-700 mb-3">
            {isMe ? 'My Listings' : `${profile?.full_name?.split(' ')[0] ?? 'Their'}'s Listings`}
          </h2>
          {activePosts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">🍽️</p>
              <p className="text-slate-500 text-sm">No active listings</p>
              {isMe && <Link to="/create" className="btn-primary inline-block mt-3 text-sm">Create your first listing</Link>}
            </div>
          ) : (
            <div className="food-grid">
              {activePosts.map(p => (
                <div key={p.id} className="relative">
                  <FoodCard post={p} compact />
                  {isMe && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={e => { e.preventDefault(); navigate(`/edit-post/${p.id}`) }}
                        className="bg-white/90 backdrop-blur rounded-full p-1.5 shadow text-slate-400 hover:text-brand-500 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => { e.preventDefault(); setDeletingId(p.id) }}
                        className="bg-white/90 backdrop-blur rounded-full p-1.5 shadow text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {soldPosts.length > 0 && (
            <div className="mt-6">
              <h2 className="font-bold text-slate-700 mb-3">Sold</h2>
              <div className="food-grid">
                {soldPosts.map(p => (
                  <div key={p.id} className="relative">
                    <FoodCard post={p} compact />
                    {isMe && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={e => { e.preventDefault(); navigate(`/edit-post/${p.id}`) }}
                          className="bg-white/90 backdrop-blur rounded-full p-1.5 shadow text-slate-400 hover:text-brand-500 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => { e.preventDefault(); setDeletingId(p.id) }}
                          className="bg-white/90 backdrop-blur rounded-full p-1.5 shadow text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ad — bottom of profile page */}
      <div className="px-4 mt-4">
        <AdSlot />
      </div>

      {/* ── Delete confirmation modal ── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeletingId(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-slate-800 text-base mb-1">Delete listing?</h3>
            <p className="text-sm text-slate-500 mb-5">This will remove the listing from ChefThisWay. This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingId)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Liked tab (own profile only) ── */}
      {tab === 'Liked' && isMe && (
        <div className="px-4 py-4">
          <h2 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Liked listings
          </h2>
          {likedLoading ? (
            <div className="food-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="w-full aspect-square bg-slate-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : likedPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🤍</p>
              <p className="text-slate-600 font-medium">No liked listings yet</p>
              <p className="text-slate-400 text-sm mt-1">Tap the ❤️ on any listing to save it here</p>
            </div>
          ) : (
            <>
              <div className="food-grid">
                {likedPosts.map(p => <FoodCard key={p.id} post={p} compact />)}
              </div>
              <div className="mt-4">
                <AdSlot />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
