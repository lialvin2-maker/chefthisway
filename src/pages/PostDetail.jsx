import { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Heart, Bookmark, MessageCircle, Star, Share2, MapPin, ChevronLeft, ChevronRight, X, Flag } from 'lucide-react'
import { supabase, supabaseData } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { formatPrice, formatDate, CATEGORIES, isHighRiskPost, descriptionWithoutMarker } from '../lib/utils'
import DefaultAvatar from '../components/DefaultAvatar'
import ReportDialog from '../components/ReportDialog'

async function fetchPost(id) {
  const { data, error } = await supabaseData.from('food_posts').select('*').eq('id', id).single()
  if (error) throw error
  return data
}
async function fetchReviews(postId) {
  const { data, error } = await supabase.from('reviews').select('*').eq('post_id', postId).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [photoIdx, setPhotoIdx]       = useState(0)
  // Generic lightbox — works for both post photos and review photos
  const [lightbox, setLightbox]       = useState({ photos: [], idx: 0 })
  const lightboxOpen = lightbox.photos.length > 0
  const [liked, setLiked]             = useState(false)
  const [saved, setSaved]             = useState(false)
  const [reportOpen, setReportOpen]   = useState(false)
  const touchStartX = useRef(null)

  function openLightbox(photos, idx = 0) { setLightbox({ photos, idx }) }
  function closeLightbox()               { setLightbox({ photos: [], idx: 0 }) }
  function lightboxPrev()                { setLightbox(l => ({ ...l, idx: Math.max(l.idx - 1, 0) })) }
  function lightboxNext()                { setLightbox(l => ({ ...l, idx: Math.min(l.idx + 1, l.photos.length - 1) })) }

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > 50)  lightboxPrev()
    if (dx < -50) lightboxNext()
    touchStartX.current = null
  }

  const { data: post, isLoading } = useQuery({ queryKey: ['post', id], queryFn: () => fetchPost(id) })
  const { data: reviews = [] }    = useQuery({ queryKey: ['reviews', id], queryFn: () => fetchReviews(id), enabled: !!post, staleTime: 30000, refetchOnWindowFocus: false, retry: 1 })

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) { navigate('/login'); return }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      // likes_count is kept in sync by the likes_count_sync trigger in the database
      if (liked) {
        await supabase.from('likes').delete().eq('user_id', session.user.id).eq('post_id', id)
      } else {
        await supabase.from('likes').insert({ user_id: session.user.id, post_id: id })
      }
      setLiked(!liked)
    },
    onSuccess: () => qc.invalidateQueries(['post', id]),
  })

  async function startChat() {
    if (!user) { navigate('/login'); return }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/login'); return }

    // Check for existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', session.user.id)
      .eq('post_id', id)
      .single()

    if (existing) { navigate(`/chat/${existing.id}`); return }

    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({ buyer_id: session.user.id, seller_id: post.seller_id, post_id: id, last_message: '', unread_buyer: 0, unread_seller: 0 })
      .select()
      .single()
    if (error || !conv) {
      alert(error?.message === 'blocked' ? "You can't message this seller." : "Couldn't open the chat. Please try again.")
      return
    }
    navigate(`/chat/${conv.id}`)
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!post) return <div className="p-8 text-center text-slate-500">Post not found.</div>

  const photos = post.photos ?? []

  const hasMedia = photos.length > 0 || (post.videos?.length ?? 0) > 0
  const isOwnPost = post.seller_id === user?.id

  // Reusable seller card + Contact button + ad slot — same markup on mobile and desktop,
  // just rendered in two different positions (bottom on mobile, sticky right on desktop).
  const sellerPanel = (
    <div className="space-y-3">
      {/* Seller card */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
        <Link to={`/profile/${post.seller_id}`}>
          {post.seller_photo
            ? <img src={post.seller_photo} className="w-12 h-12 rounded-full object-cover" alt={post.seller_name} />
            : <DefaultAvatar name={post.seller_name} className="w-12 h-12 text-lg" />
          }
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${post.seller_id}`} className="font-semibold text-slate-800 hover:text-brand-500 block truncate">
            {post.seller_name ?? 'Unknown Seller'}
          </Link>
          <p className="text-xs text-slate-500">
            Posted {formatDate(post.created_at)}
            {post.updated_at && new Date(post.updated_at) - new Date(post.created_at) > 60000 && (
              <span className="ml-1.5 text-slate-400 italic">· edited</span>
            )}
          </p>
        </div>
      </div>

      {!isOwnPost && (
        <button
          onClick={() => user ? setReportOpen(true) : navigate('/login')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors px-1"
        >
          <Flag className="w-3.5 h-3.5" /> Report this listing
        </button>
      )}

      {/* Contact Seller button (right column on desktop; mobile uses the fixed bottom bar) */}
      {!isOwnPost && (
        <button onClick={startChat} className="hidden md:flex btn-primary w-full items-center justify-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Contact Seller
        </button>
      )}

      {/* Ad slot — desktop only; uncomment / replace with real ad code when ready */}
      <div className="hidden md:block bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
        <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Sponsored</p>
        <p className="text-sm text-slate-500">Your ad could be here</p>
      </div>
    </div>
  )

  return (
    <div className="bg-white min-h-full pb-24 md:pb-12">
      {/* Back button — floats over the photo and takes no space */}
      <div className="sticky top-0 z-20 h-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="absolute left-3 bg-white/90 backdrop-blur rounded-full p-2.5 shadow-md hover:bg-white active:scale-95 transition"
          style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
      {/* Room for the button when there is no photo under it (and on desktop) */}
      <div className={hasMedia ? 'hidden md:block h-16' : 'h-16'} />

      {/* Two-column container — stacks on mobile, splits on md+ */}
      <div className="md:max-w-6xl md:mx-auto md:flex md:gap-6 md:px-6">
        {/* LEFT: photo + content */}
        <div className="md:flex-1 md:min-w-0">
          {/* Photo carousel — skipped when the post has no media */}
          {hasMedia && (
            <div className="relative bg-slate-100 md:rounded-2xl md:overflow-hidden">
              {photos.length > 0 && (
                <div className="relative">
                  <img
                    src={photos[photoIdx]}
                    alt={post.title}
                    className="w-full aspect-square object-cover cursor-pointer"
                    onClick={() => openLightbox(photos, photoIdx)}
                  />
                  {photos.length > 1 && (
                    <>
                      <button onClick={() => setPhotoIdx(i => Math.max(i-1,0))} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => setPhotoIdx(i => Math.min(i+1, photos.length-1))} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {photos.map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i===photoIdx ? 'bg-white' : 'bg-white/50'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Video player */}
              {post.videos?.length > 0 && (
                <div className="bg-black">
                  <video
                    src={post.videos[0]}
                    controls
                    playsInline
                    className="w-full max-h-64 object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {/* Title + price + rating + description + location */}
          <div className="px-4 py-4 md:px-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1 mb-1">
                  {String(post.category ?? '').split(',').filter(Boolean).map(key => {
                    const cat = CATEGORIES.find(c => c.key === key.trim())
                    return cat ? (
                      <span key={key} className="text-xs text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full font-medium">
                        {cat.emoji} {cat.label}
                      </span>
                    ) : null
                  })}
                  {post.is_boosted && <span className="bg-brand-100 text-brand-600 text-xs px-2 py-0.5 rounded-full font-medium">⭐ Featured</span>}
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-0.5">{post.title}</h1>
              </div>
              {isHighRiskPost(post) ? (
                <span className="text-lg font-semibold text-slate-500 italic whitespace-nowrap">
                  Please contact
                </span>
              ) : (
                <span className="text-xl md:text-2xl font-bold text-brand-600 whitespace-nowrap">{formatPrice(post.price)}</span>
              )}
            </div>

            {post.average_rating > 0 && (
              <div className="flex items-center gap-1 mt-2">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(post.average_rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                ))}
                <span className="text-sm text-slate-600 ml-1">{Number(post.average_rating).toFixed(1)} ({post.reviews_count} reviews)</span>
              </div>
            )}

            {descriptionWithoutMarker(post) && (
              <p className="text-slate-600 text-sm mt-4 leading-relaxed whitespace-pre-wrap">{descriptionWithoutMarker(post)}</p>
            )}

            {post.location_name && (
              <div className="flex items-center gap-1 mt-3 text-sm text-slate-500">
                <MapPin className="w-4 h-4 text-brand-500" />
                {post.location_name}
              </div>
            )}
          </div>

          {/* Mobile-only: seller panel (no Contact button — bottom bar handles that) */}
          <div className="md:hidden px-4">
            {sellerPanel}
          </div>
        </div>

        {/* RIGHT: sticky seller + contact + ad — visible only on md+ */}
        <aside className="hidden md:block md:w-80 md:flex-shrink-0">
          <div className="md:sticky md:top-20">
            {sellerPanel}
          </div>
        </aside>
      </div>

      {reportOpen && (
        <ReportDialog postId={post.id} userId={post.seller_id} title="Report listing" onClose={() => setReportOpen(false)} />
      )}

      {/* Fullscreen lightbox — works for both post photos and review photos */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top bar — close on left, counter on right */}
          <div className="flex items-center justify-between px-4 pt-12 pb-3 flex-shrink-0">
            <button onClick={closeLightbox} className="p-2 rounded-full bg-white/10 active:bg-white/20">
              <X className="w-5 h-5 text-white" />
            </button>
            <span className="text-white/70 text-sm font-medium">
              {lightbox.idx + 1} / {lightbox.photos.length}
            </span>
          </div>

          {/* Photo */}
          <div className="flex-1 flex items-center justify-center relative min-h-0">
            <img
              src={lightbox.photos[lightbox.idx]}
              alt={`Photo ${lightbox.idx + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />

            {lightbox.photos.length > 1 && (
              <>
                <button
                  onClick={lightboxPrev}
                  disabled={lightbox.idx === 0}
                  className="absolute left-3 bg-white/15 disabled:opacity-20 text-white rounded-full p-2 active:bg-white/30"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={lightboxNext}
                  disabled={lightbox.idx === lightbox.photos.length - 1}
                  className="absolute right-3 bg-white/15 disabled:opacity-20 text-white rounded-full p-2 active:bg-white/30"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Dot indicators */}
          {lightbox.photos.length > 1 && (
            <div className="flex justify-center gap-1.5 py-5 flex-shrink-0">
              {lightbox.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(l => ({ ...l, idx: i }))}
                  className={`rounded-full transition-all ${i === lightbox.idx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews — full-width on mobile, constrained on desktop */}
      <div className="px-4 py-4 md:max-w-6xl md:mx-auto md:px-6">

        {/* 7. Reviews */}
        {reviews.length > 0 && (
          <div className="mt-5">
            <h2 className="font-bold text-slate-800 mb-3">Reviews</h2>
            <div className="space-y-3">
              {reviews.map(r => {
                const photos = Array.isArray(r.photos) ? r.photos : []
                const wasEdited = r.updated_at && new Date(r.updated_at) - new Date(r.created_at) > 60000
                return (
                  <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                    {/* Reviewer header */}
                    <div className="flex items-center gap-2 mb-2">
                      {r.reviewer_photo
                        ? <img src={r.reviewer_photo} className="w-7 h-7 rounded-full object-cover" alt={r.reviewer_name ?? ''} />
                        : <DefaultAvatar name={r.reviewer_name ?? '?'} className="w-7 h-7 text-xs" />
                      }
                      <span className="text-xs font-semibold text-slate-700 truncate">{r.reviewer_name ?? 'Anonymous'}</span>
                      <span className="text-xs text-slate-400 ml-auto">
                        {formatDate(r.created_at)}
                        {wasEdited && <span className="ml-1 italic">· edited</span>}
                      </span>
                    </div>
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 mb-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    {/* Comment */}
                    {r.comment && <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>}
                    {/* Photo thumbnails */}
                    {photos.length > 0 && (
                      <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                        {photos.map((src, i) => (
                          <button
                            key={i}
                            onClick={() => openLightbox(photos, i)}
                            className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity"
                          >
                            <img src={src} className="w-full h-full object-cover" alt={`Review photo ${i+1}`} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action bar — mobile only; desktop uses Contact Seller in the right column */}
      <div className="md:hidden fixed bottom-16 inset-x-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-3">
        <button
          onClick={() => likeMutation.mutate()}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border transition-colors ${liked ? 'border-red-400 bg-red-50 text-red-500' : 'border-slate-200 text-slate-500'}`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
          <span className="text-sm">{(post.likes_count ?? 0) + (liked ? 1 : 0)}</span>
        </button>

        {post.seller_id !== user?.id && (
          <button onClick={startChat} className="flex-1 btn-primary flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Contact Seller
          </button>
        )}
      </div>
    </div>
  )
}
