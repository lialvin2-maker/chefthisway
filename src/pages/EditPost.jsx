import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Camera, Video, X, ChevronLeft, MapPin, Check, Navigation } from 'lucide-react'
import { supabase, supabaseData } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { CATEGORIES, REFRIG_MARKER } from '../lib/utils'

async function fetchLocationSuggestions(query) {
  if (!query || query.length < 2) return []
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&countrycodes=ca&addressdetails=1`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'ChefThisWay/1.0' } })
    return await res.json()
  } catch { return [] }
}

function formatAddress(addr) {
  if (!addr) return null
  const parts = [
    addr.house_number ? `${addr.house_number} ${addr.road ?? ''}`.trim() : addr.road,
    addr.suburb || addr.neighbourhood,
    addr.city || addr.town || addr.village,
    addr.state,
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

export default function EditPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const fileRef  = useRef()
  const videoRef = useRef()

  const { data: existingPost, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data, error } = await supabaseData.from('food_posts').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
  })

  const [initialized, setInitialized] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', price: '', location_name: '',
    location_lat: null, location_lng: null, requires_license: false,
  })
  const [selectedCategories, setSelectedCategories] = useState([])
  const [photos, setPhotos]               = useState([])   // string URLs or File objects
  const [previews, setPreviews]           = useState([])
  const [video, setVideo]                 = useState(null) // new File only
  const [existingVideoUrl, setExistingVideoUrl] = useState(null)
  const [videoPreview, setVideoPreview]   = useState(null)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [gpsLoading, setGpsLoading]       = useState(false)

  const [locationSuggestions, setLocationSuggestions]         = useState([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const locationDebounceRef = useRef(null)

  // Pre-fill form once post data loads
  useEffect(() => {
    if (!existingPost || initialized) return
    // Detect marker prefix on description; if present, treat as high-risk and strip it.
    const rawDesc = existingPost.description ?? ''
    const hasMarker = rawDesc.startsWith(REFRIG_MARKER)
    const cleanDesc = hasMarker ? rawDesc.slice(REFRIG_MARKER.length).replace(/^\s*\n+/, '') : rawDesc
    setForm({
      title:            existingPost.title ?? '',
      description:      cleanDesc,
      price:            existingPost.price != null ? String(existingPost.price) : '',
      location_name:    existingPost.location_name ?? '',
      location_lat:     existingPost.location_lat ?? null,
      location_lng:     existingPost.location_lng ?? null,
      requires_license: existingPost.requires_license || hasMarker || false,
    })
    const cats = existingPost.category
      ? existingPost.category.split(',').map(s => s.trim()).filter(Boolean)
      : []
    setSelectedCategories(cats)
    const existingPhotos = existingPost.photos ?? []
    setPhotos(existingPhotos)
    setPreviews(existingPhotos)
    if (existingPost.videos?.[0]) {
      setExistingVideoUrl(existingPost.videos[0])
      setVideoPreview(existingPost.videos[0])
    }
    setInitialized(true)
  }, [existingPost, initialized])

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function toggleCategory(key) {
    setSelectedCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  function handlePhotoPick(e) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const combined  = [...photos, ...files].slice(0, 5)
    const newPreviews = combined.map(f => typeof f === 'string' ? f : URL.createObjectURL(f))
    setPhotos(combined)
    setPreviews(newPreviews)
  }

  function removePhoto(i) {
    setPhotos(p => p.filter((_, idx) => idx !== i))
    setPreviews(p => p.filter((_, idx) => idx !== i))
  }

  function handleVideoPick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setVideo(file)
    setVideoPreview(URL.createObjectURL(file))
    setExistingVideoUrl(null)
  }

  function removeVideo() {
    setVideo(null)
    setVideoPreview(null)
    setExistingVideoUrl(null)
    if (videoRef.current) videoRef.current.value = ''
  }

  function handleLocationChange(val) {
    setForm(f => ({ ...f, location_name: val, location_lat: null, location_lng: null }))
    setShowLocationSuggestions(false)
    setLocationSuggestions([])
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current)
    if (val.length < 2) return
    locationDebounceRef.current = setTimeout(async () => {
      const results = await fetchLocationSuggestions(val)
      setLocationSuggestions(results)
      if (results.length > 0) setShowLocationSuggestions(true)
    }, 400)
  }

  function selectLocation(suggestion) {
    const formatted = formatAddress(suggestion.address) || suggestion.display_name
    setForm(f => ({
      ...f,
      location_name: formatted,
      location_lat:  parseFloat(suggestion.lat),
      location_lng:  parseFloat(suggestion.lon),
    }))
    setLocationSuggestions([])
    setShowLocationSuggestions(false)
  }

  async function useGpsLocation() {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
          const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'ChefThisWay/1.0' } })
          const data = await res.json()
          const formatted = formatAddress(data.address) || data.display_name
          setForm(f => ({ ...f, location_name: formatted, location_lat: lat, location_lng: lng }))
        } catch { setError('Could not reverse-geocode your location') }
        finally { setGpsLoading(false) }
      },
      () => { setError('Location access denied'); setGpsLoading(false) },
      { timeout: 10000 }
    )
  }

  async function uploadPhotos() {
    const urls = []
    for (const file of photos) {
      if (typeof file === 'string') { urls.push(file); continue }
      const ext  = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('food-photos').upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('food-photos').getPublicUrl(path)
      urls.push(publicUrl)
    }
    return urls
  }

  async function uploadVideo() {
    if (!video) return existingVideoUrl  // keep existing if no new file
    const ext  = video.name.split('.').pop()
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('food-videos').upload(path, video)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('food-videos').getPublicUrl(path)
    return publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim())               { setError('Title is required'); return }
    if (selectedCategories.length === 0)  { setError('Please choose at least one category'); return }
    setLoading(true); setError('')
    try {
      // Re-validate the session right before writing so seller_id always matches auth.uid()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }

      const photoUrls = await uploadPhotos()
      const videoUrl  = await uploadVideo()

      // High-risk items: encode in description (DB column gated by RLS)
      const baseDesc = form.description.trim()
      const finalDesc = form.requires_license
        ? (baseDesc ? `${REFRIG_MARKER}\n\n${baseDesc}` : REFRIG_MARKER)
        : baseDesc

      const { error } = await supabase.from('food_posts').update({
        seller_name:      profile?.full_name ?? session.user.email,
        seller_photo:     profile?.avatar_url ?? null,
        title:            form.title.trim(),
        description:      finalDesc,
        price:            form.requires_license ? 0 : (form.price ? parseFloat(form.price) : 0),
        category:         selectedCategories.join(','),
        location_name:    form.location_name.trim(),
        location_lat:     form.location_lat,
        location_lng:     form.location_lng,
        photos:           photoUrls,
        videos:           videoUrl ? [videoUrl] : [],
        // requires_license intentionally omitted — handled via description marker
      }).eq('id', id).eq('seller_id', session.user.id)

      if (error) {
        console.error('[EditPost] update failed:', error)
        throw error
      }
      navigate(`/post/${id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function CategoryTile({ cat }) {
    const selected = selectedCategories.includes(cat.key)
    return (
      <button
        type="button"
        onClick={() => toggleCategory(cat.key)}
        className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
          selected
            ? 'border-brand-500 bg-brand-50 text-brand-600'
            : 'border-slate-200 text-slate-600 hover:border-slate-300'
        }`}
      >
        <span>{cat.emoji}</span>
        <span className="flex-1 text-left">{cat.label}</span>
        {selected && <Check className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />}
      </button>
    )
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!existingPost || existingPost.seller_id !== user?.id) return (
    <div className="p-8 text-center text-slate-500">Post not found or not yours.</div>
  )

  return (
    <div className="bg-white min-h-full pb-8">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Edit Listing</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        {/* Photo picker */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Photos (up to 5)</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {previews.map((src, i) => (
              <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                <img src={src} className="w-full h-full object-cover" alt="" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                >
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

        {/* Video picker */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Video <span className="text-slate-400 font-normal">(optional)</span></label>
          {videoPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-black">
              <video src={videoPreview} controls className="w-full max-h-48 object-contain" />
              <button type="button" onClick={removeVideo} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => videoRef.current?.click()}
              className="w-full h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center gap-2 text-slate-400 hover:border-brand-400 hover:text-brand-400 transition-colors"
            >
              <Video className="w-5 h-5" />
              <span className="text-sm">Add a short video clip</span>
            </button>
          )}
          <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideoPick} />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Title *</label>
          <input className="input" placeholder="e.g. Homemade Samosas (12 pcs)" value={form.title} onChange={e => set('title', e.target.value)} />
        </div>

        {/* Category */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-700">Category * <span className="text-slate-400 font-normal">(pick all that apply)</span></label>
            {selectedCategories.length > 0 && (
              <span className="text-xs text-brand-500 font-medium">{selectedCategories.length} selected</span>
            )}
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Cuisine</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {CATEGORIES.filter(c => c.group === 'cuisine').map(cat => <CategoryTile key={cat.key} cat={cat} />)}
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Food Type</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {CATEGORIES.filter(c => c.group === 'type').map(cat => <CategoryTile key={cat.key} cat={cat} />)}
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Dietary</p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.filter(c => c.group === 'diet').map(cat => <CategoryTile key={cat.key} cat={cat} />)}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            className="input resize-none h-28"
            placeholder="Describe your food: ingredients, serving size, allergens…"
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>

        {/* Requires license toggle */}
        <label className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 w-4 h-4 accent-amber-500 flex-shrink-0"
            checked={form.requires_license}
            onChange={e => set('requires_license', e.target.checked)}
          />
          <div>
            <p className="text-sm font-semibold text-amber-800">Needs refrigeration / high-risk item</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Under Canadian food safety law, items like meat, dairy, and hot meals require a license to sell. Price will show as "Please contact."
            </p>
          </div>
        </label>

        {/* Price */}
        {!form.requires_license && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Price (CAD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                className="input pl-7"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={e => set('price', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            <MapPin className="inline w-4 h-4 text-brand-500 mr-1" />Location
          </label>
          <div className="relative">
            <input
              className="input pr-10"
              placeholder="e.g. 123 Main St, Scarborough, ON"
              value={form.location_name}
              onChange={e => handleLocationChange(e.target.value)}
              onFocus={() => locationSuggestions.length > 0 && setShowLocationSuggestions(true)}
              onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 150)}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={useGpsLocation}
              disabled={gpsLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 transition-colors disabled:opacity-40"
            >
              <Navigation className={`w-4 h-4 ${gpsLoading ? 'animate-pulse' : ''}`} />
            </button>
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute z-30 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                {locationSuggestions.map((s, i) => {
                  const label = formatAddress(s.address) || s.display_name
                  return (
                    <button
                      key={i}
                      type="button"
                      className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-orange-50 flex items-start gap-2 border-b border-slate-100 last:border-0"
                      onMouseDown={() => selectLocation(s)}
                    >
                      <MapPin className="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" />
                      <span className="leading-snug">{label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          {form.location_lat && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <span>✓</span> Precise location saved
            </p>
          )}
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>}

        <button type="submit" className="btn-primary w-full text-base" disabled={loading}>
          {loading ? 'Saving…' : '✏️ Save Changes'}
        </button>
      </form>
    </div>
  )
}
