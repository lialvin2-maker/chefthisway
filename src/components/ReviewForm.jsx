import { useState, useRef } from 'react'
import { Camera, X, Star, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

/**
 * Modal/sheet that lets a user leave (or edit) a per-post review.
 *
 * Props:
 *   post           – { id, title, photos, seller_name }
 *   existingReview – review row (for edit mode) or null
 *   onClose        – () => void  (parent unmounts the modal)
 *   onSuccess      – () => void  (parent refetches reviews)
 */
export default function ReviewForm({ post, existingReview, onClose, onSuccess }) {
  const { user, profile } = useAuth()
  const fileRef = useRef()

  const [rating, setRating]           = useState(existingReview?.rating ?? 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment]         = useState(existingReview?.comment ?? '')
  // photos: array of (existing-URL string) | (File). previews: parallel array of <img src> values.
  const [photos, setPhotos]           = useState(existingReview?.photos ?? [])
  const [previews, setPreviews]       = useState(existingReview?.photos ?? [])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  function handlePhotoPick(e) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const newPhotos   = [...photos, ...files].slice(0, 5)
    const newPreviews = newPhotos.map(f => (typeof f === 'string' ? f : URL.createObjectURL(f)))
    setPhotos(newPhotos)
    setPreviews(newPreviews)
  }

  function removePhoto(i) {
    setPhotos(p => p.filter((_, idx) => idx !== i))
    setPreviews(p => p.filter((_, idx) => idx !== i))
  }

  async function uploadPhotos() {
    const urls = []
    for (const f of photos) {
      if (typeof f === 'string') { urls.push(f); continue }    // already-uploaded URL passthrough
      const ext  = f.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('review-photos').upload(path, f)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('review-photos').getPublicUrl(path)
      urls.push(publicUrl)
    }
    return urls
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (rating === 0) { setError('Please give a star rating'); return }
    setLoading(true); setError('')
    try {
      // Re-validate session right before write so reviewer_id matches auth.uid()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { onClose(); return }

      const photoUrls = await uploadPhotos()

      const payload = {
        rating,
        comment: comment.trim(),
        photos: photoUrls,
        reviewer_name:  profile?.full_name ?? session.user.email,
        reviewer_photo: profile?.avatar_url ?? null,
        updated_at:     new Date().toISOString(),
      }

      if (existingReview) {
        const { error } = await supabase
          .from('reviews')
          .update(payload)
          .eq('id', existingReview.id)
          .eq('reviewer_id', session.user.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('reviews')
          .insert({ ...payload, post_id: post.id, reviewer_id: session.user.id })
        if (error) throw error
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('[ReviewForm] save failed:', err)
      setError(err.message || 'Could not save review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">{existingReview ? 'Edit your review' : 'Leave a review'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5 flex-1 pb-24">
        {/* Post preview */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
          {post.photos?.[0]
            ? <img src={post.photos[0]} className="w-12 h-12 rounded-xl object-cover" alt={post.title} />
            : <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-lg">🍽️</div>
          }
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-slate-800 truncate">{post.title}</p>
            {post.seller_name && <p className="text-xs text-slate-500 truncate">{post.seller_name}</p>}
          </div>
        </div>

        {/* Stars */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">How was it?</label>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(s => {
              const filled = s <= (hoverRating || rating)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1"
                >
                  <Star className={`w-9 h-9 transition-colors ${filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                </button>
              )
            })}
          </div>
          {rating > 0 && <p className="text-xs text-slate-500 mt-1">{rating} of 5 stars</p>}
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Photos <span className="text-slate-400 font-normal">(up to 5, optional)</span></label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {previews.map((src, i) => (
              <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                <img src={src} className="w-full h-full object-cover" alt="" />
                <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {previews.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-brand-400 hover:text-brand-400 transition-colors"
              >
                <Camera className="w-6 h-6" />
                <span className="text-xs mt-1">Add photo</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoPick} />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Tell others about your experience <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            className="input resize-none h-28"
            placeholder="What was the food like? How was the seller?"
            value={comment}
            onChange={e => setComment(e.target.value.slice(0, 500))}
          />
          <p className="text-xs text-slate-400 mt-1">{comment.length}/500</p>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>}

        <button
          type="submit"
          disabled={loading || rating === 0}
          className="btn-primary w-full text-base"
        >
          {loading ? 'Posting…' : (existingReview ? 'Save changes' : 'Post review')}
        </button>
      </form>
    </div>
  )
}
