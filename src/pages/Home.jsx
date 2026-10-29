import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, MapPin, ChevronDown, X, Check, Navigation, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, supabaseData } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useBlockedIds } from '../lib/blocks'
import { CATEGORIES, getDistance, isHighRiskPost, postInCategory } from '../lib/utils'
import FoodCard from '../components/FoodCard'
import AdSlot from '../components/AdSlot'
import DefaultAvatar from '../components/DefaultAvatar'

const DEFAULT_LOCATION = 'Toronto Area'
const LS_LOCATION_KEY = 'ctw_location'   // localStorage key

const CUISINE_KEYS = new Set(CATEGORIES.filter(c => c.group === 'cuisine').map(c => c.key))
const TYPE_KEYS    = new Set(CATEGORIES.filter(c => c.group === 'type').map(c => c.key))
const DIET_KEYS    = new Set(CATEGORIES.filter(c => c.group === 'diet').map(c => c.key))
const TYPE_CATS    = CATEGORIES.filter(c => c.group === 'type')
const SORTS = [
  { key: 'nearest', label: 'Nearest' },
  { key: 'price',   label: 'Price: low to high' },
  { key: 'rating',  label: 'Top rated' },
]
const SHEET_TITLES = { cuisine: 'Cuisine', diet: 'Dietary', sort: 'Sort by' }

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-medium transition-colors active:scale-95 ${
        active ? 'bg-brand-500 text-white' : 'bg-gray-100 text-slate-800 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )
}

// --- Nominatim location search ----------------------------------------
async function searchLocations(query) {
  if (!query || query.length < 2) return []
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&countrycodes=ca&addressdetails=1`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'ChefThisWay/1.0' },
    })
    return await res.json()
  } catch {
    return []
  }
}

function formatNominatimLabel(suggestion) {
  const a = suggestion.address ?? {}
  const parts = [
    a.road,
    a.suburb || a.neighbourhood,
    a.city || a.town || a.village,
    a.state,
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : suggestion.display_name
}

// --- Post fetching -------------------------------------------------------
async function fetchPosts({ search }) {
  let query = supabaseData
    .from('food_posts')
    .select('*')
    .eq('status', 'active')
    .order('is_boosted', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200)

  if (search) {
    const terms = search.trim().split(/\s+/).filter(Boolean)
    const filters = terms.flatMap(t => [
      `title.ilike.%${t}%`,
      `description.ilike.%${t}%`,
    ]).join(',')
    query = query.or(filters)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// --- Component -----------------------------------------------------------
export default function Home() {
  const { user, profile } = useAuth()
  const [search, setSearch]                         = useState('')
  const [selectedCategories, setSelectedCategories] = useState(new Set())
  const [sortBy, setSortBy]                         = useState('nearest')
  const [debouncedSearch, setDebouncedSearch]       = useState('')
  // Which pick-list sheet is open: 'cuisine' | 'diet' | 'sort' | null
  const [sheet, setSheet]                           = useState(null)

  // Header slides away when scrolling down, comes back when scrolling up
  const headerRef = useRef(null)
  const [headerHidden, setHeaderHidden] = useState(false)
  useEffect(() => {
    const scroller = headerRef.current?.closest('main')
    if (!scroller) return
    let lastY = scroller.scrollTop
    function onScroll() {
      const y = scroller.scrollTop
      if (Math.abs(y - lastY) < 6) return
      setHeaderHidden(y > lastY && y > (headerRef.current?.offsetHeight ?? 0))
      lastY = y
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [])

  // Filter panel state
  const [filterOpen, setFilterOpen]   = useState(false)
  const [distMax, setDistMax]         = useState(50)
  const [distMin, setDistMin]         = useState(0)
  const [distanceOn, setDistanceOn]   = useState(false)
  const [priceMin, setPriceMin]       = useState('')
  const [priceMax, setPriceMax]       = useState('')
  const [minRating, setMinRating]     = useState(0)

  // Pending (in-sheet) values — committed on Apply
  const [pendingDistMax, setPendingDistMax] = useState(50)
  const [pendingDistMin, setPendingDistMin] = useState(0)
  const [pendingDistOn, setPendingDistOn]   = useState(false)
  const [pendingPriceMin, setPendingPriceMin] = useState('')
  const [pendingPriceMax, setPendingPriceMax] = useState('')
  const [pendingRating, setPendingRating] = useState(0)

  const activeFilterCount = (distanceOn ? 1 : 0) + (priceMin || priceMax ? 1 : 0) + (minRating > 0 ? 1 : 0)

  function openFilters() {
    setPendingDistMax(distMax); setPendingDistMin(distMin); setPendingDistOn(distanceOn)
    setPendingPriceMin(priceMin); setPendingPriceMax(priceMax)
    setPendingRating(minRating)
    setFilterOpen(true)
  }
  function applyFilters() {
    setDistMax(pendingDistMax); setDistMin(pendingDistMin); setDistanceOn(pendingDistOn)
    setPriceMin(pendingPriceMin); setPriceMax(pendingPriceMax)
    setMinRating(pendingRating)
    setFilterOpen(false)
  }
  function clearFilters() {
    setPendingDistMax(50); setPendingDistMin(0); setPendingDistOn(false)
    setPendingPriceMin(''); setPendingPriceMax('')
    setPendingRating(0)
  }

  function toggleCategory(key) {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // User location state — persisted in localStorage
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_LOCATION_KEY)
      return saved ? JSON.parse(saved) : { name: DEFAULT_LOCATION, lat: null, lng: null }
    } catch {
      return { name: DEFAULT_LOCATION, lat: null, lng: null }
    }
  })

  // Location picker modal state
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const [locationQuery, setLocationQuery]           = useState('')
  const [locationResults, setLocationResults]       = useState([])
  const [gpsLoading, setGpsLoading]                 = useState(false)
  const locationDebounceRef = useRef(null)
  const locationInputRef    = useRef(null)

  // Debounce main search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // Debounce location picker search
  useEffect(() => {
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current)
    locationDebounceRef.current = setTimeout(async () => {
      const results = await searchLocations(locationQuery)
      setLocationResults(results)
    }, 450)
  }, [locationQuery])

  // Focus location input when picker opens
  useEffect(() => {
    if (locationPickerOpen) {
      setLocationQuery('')
      setLocationResults([])
      setTimeout(() => locationInputRef.current?.focus(), 80)
    }
  }, [locationPickerOpen])

  const blocked = useBlockedIds()
  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ['posts', debouncedSearch],
    queryFn: () => fetchPosts({ search: debouncedSearch }),
  })

  // 1. Category filter: OR within a group, AND across groups
  const selCuisine = [...selectedCategories].filter(k => CUISINE_KEYS.has(k))
  const selType    = [...selectedCategories].filter(k => TYPE_KEYS.has(k))
  const selDiet    = [...selectedCategories].filter(k => DIET_KEYS.has(k))

  const filtered = allPosts.filter(p => {
    if (blocked.has(p.seller_id)) return false
    const cats = String(p.category ?? '').split(',').map(c => c.trim()).filter(Boolean)
    const cuisineOk = selCuisine.length === 0 || selCuisine.some(k => postInCategory(p.category, k))
    const typeOk    = selType.length    === 0 || selType.some(k => cats.includes(k))
    const dietOk    = selDiet.length    === 0 || selDiet.some(k => cats.includes(k))
    if (!cuisineOk || !typeOk || !dietOk) return false

    // Distance filter
    if (distanceOn && userLocation.lat && userLocation.lng) {
      if (p.location_lat && p.location_lng) {
        const d = getDistance(userLocation.lat, userLocation.lng, p.location_lat, p.location_lng)
        if (d < distMin || d > distMax) return false
      }
    }
    // Price filter (skip "Please contact" items if price filter is active)
    if ((priceMin !== '' || priceMax !== '') && !isHighRiskPost(p)) {
      const price = p.price ?? 0
      if (priceMin !== '' && price < parseFloat(priceMin)) return false
      if (priceMax !== '' && price > parseFloat(priceMax)) return false
    }
    // Rating filter
    if (minRating > 0 && (p.average_rating ?? 0) < minRating) return false

    return true
  })

  // 2. Sort
  const posts = [...filtered].sort((a, b) => {
    // Boosted always float to top
    if (a.is_boosted !== b.is_boosted) return a.is_boosted ? -1 : 1

    if (sortBy === 'nearest' && userLocation.lat && userLocation.lng) {
      const dA = (a.location_lat && a.location_lng)
        ? getDistance(userLocation.lat, userLocation.lng, a.location_lat, a.location_lng) : Infinity
      const dB = (b.location_lat && b.location_lng)
        ? getDistance(userLocation.lat, userLocation.lng, b.location_lat, b.location_lng) : Infinity
      return dA - dB
    }
    if (sortBy === 'price') {
      const pA = isHighRiskPost(a) ? Infinity : (a.price ?? 0)
      const pB = isHighRiskPost(b) ? Infinity : (b.price ?? 0)
      return pA - pB
    }
    if (sortBy === 'rating') {
      return (b.average_rating ?? 0) - (a.average_rating ?? 0)
    }
    return 0
  })

  function saveLocation(loc) {
    setUserLocation(loc)
    try { localStorage.setItem(LS_LOCATION_KEY, JSON.stringify(loc)) } catch {}
  }

  function selectLocationResult(suggestion) {
    const name = formatNominatimLabel(suggestion)
    saveLocation({
      name,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    })
    setLocationPickerOpen(false)
  }

  function useGpsLocation() {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
          const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'ChefThisWay/1.0' } })
          const data = await res.json()
          const a = data.address ?? {}
          const name = [a.road, a.suburb || a.neighbourhood, a.city || a.town || a.village, a.state]
            .filter(Boolean).join(', ') || data.display_name
          saveLocation({ name, lat, lng })
          setLocationPickerOpen(false)
        } catch { /* ignore */ } finally {
          setGpsLoading(false)
        }
      },
      () => setGpsLoading(false),
      { timeout: 10000 }
    )
  }

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Header — slides away on scroll down, back on scroll up */}
      <div
        ref={headerRef}
        className={`bg-white px-4 pt-safe pb-3 sticky top-0 z-10 shadow-sm transition-transform duration-300 ${headerHidden ? '-translate-y-full' : ''}`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <button
            onClick={() => setLocationPickerOpen(true)}
            className="flex items-center gap-1 min-w-0 py-1.5 text-sm font-semibold text-slate-800 hover:text-brand-500 transition-colors"
          >
            <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <span className="truncate">{userLocation.name}</span>
            <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
          </button>
          {user ? (
            <Link to={`/profile/${user.id}`} className="flex-shrink-0">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="w-9 h-9 rounded-full object-cover border-2 border-brand-200" alt="avatar" />
                : <DefaultAvatar name={profile?.full_name ?? user?.user_metadata?.full_name ?? user.email} className="w-9 h-9 text-sm" />
              }
            </Link>
          ) : (
            <Link to="/login" className="flex-shrink-0 text-sm font-semibold text-brand-500 border border-brand-400 rounded-full px-4 py-1.5">
              Sign in
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="search"
            placeholder="Search food, creators, ingredients"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      </div>

      {/* Type tiles + filter chips (scroll away with the page) */}
      <div className="bg-white border-b border-slate-100">
        <div className="flex gap-1 overflow-x-auto no-scrollbar px-2 pt-3 pb-2">
          {TYPE_CATS.map(cat => {
            const on = selectedCategories.has(cat.key)
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => toggleCategory(cat.key)}
                aria-pressed={on}
                className="flex-shrink-0 w-[72px] flex flex-col items-center gap-1 py-1 active:scale-95 transition-transform"
              >
                <span className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-colors ${on ? 'bg-brand-100 ring-2 ring-brand-500' : 'bg-gray-100'}`}>
                  {cat.emoji}
                </span>
                <span className={`text-xs font-medium ${on ? 'text-brand-600' : 'text-slate-700'}`}>{cat.label}</span>
              </button>
            )
          })}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3">
          <Chip active={activeFilterCount > 0} onClick={openFilters}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Chip>
          <Chip active={selCuisine.length > 0} onClick={() => setSheet('cuisine')}>
            Cuisine{selCuisine.length > 0 ? ` (${selCuisine.length})` : ''} <ChevronDown className="w-4 h-4" />
          </Chip>
          <Chip active={selDiet.length > 0} onClick={() => setSheet('diet')}>
            Dietary{selDiet.length > 0 ? ` (${selDiet.length})` : ''} <ChevronDown className="w-4 h-4" />
          </Chip>
          <Chip active={false} onClick={() => setSheet('sort')}>
            {SORTS.find(o => o.key === sortBy)?.label} <ChevronDown className="w-4 h-4" />
          </Chip>
          {selectedCategories.size > 0 && (
            <button type="button" onClick={() => setSelectedCategories(new Set())} className="flex-shrink-0 h-10 px-2 text-sm font-semibold text-brand-500">
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="food-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="w-full aspect-square bg-slate-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-slate-600 font-medium">No food found</p>
            <p className="text-slate-400 text-sm mt-1">Try a different search or category</p>
            {user && (
              <Link to="/create" className="btn-primary inline-block mt-4 text-sm">
                Post the first listing!
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-3">
              {posts.length} item{posts.length !== 1 ? 's' : ''}{userLocation.lat ? ' near you' : ''}
            </p>

            {/* Featured row */}
            {posts.filter(p => p.is_boosted).length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-700 mb-2">⭐ Featured</h2>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {posts.filter(p => p.is_boosted).map(post => (
                    <div key={post.id} className="flex-shrink-0 w-64 md:w-72">
                      <FoodCard post={post} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main grid — ad banner injected after every 4 cards */}
            <div className="food-grid">
              {posts.filter(p => !p.is_boosted).flatMap((post, i) => {
                const card = <FoodCard key={post.id} post={post} compact />
                if ((i + 1) % 4 === 0) {
                  return [
                    card,
                    <div key={`ad-${i}`} className="col-span-full empty:hidden">
                      <AdSlot />
                    </div>,
                  ]
                }
                return [card]
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Pick-list sheet: cuisine / dietary / sort ── */}
      {sheet && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheet(null)} />
          <div
            className="relative bg-white rounded-t-3xl px-4 pt-4 shadow-2xl flex flex-col max-h-[80vh]"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between mb-1 px-1">
              <h2 className="text-lg font-bold text-slate-800">{SHEET_TITLES[sheet]}</h2>
              <button onClick={() => setSheet(null)} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {(sheet === 'sort'
                ? SORTS.map(o => ({ key: o.key, label: o.label, on: sortBy === o.key, pick: () => { setSortBy(o.key); setSheet(null) } }))
                : CATEGORIES.filter(c => c.group === sheet).map(c => ({ key: c.key, label: `${c.emoji}  ${c.label}`, on: selectedCategories.has(c.key), pick: () => toggleCategory(c.key) }))
              ).map(row => (
                <button
                  key={row.key}
                  type="button"
                  onClick={row.pick}
                  className="flex items-center justify-between w-full px-2 py-3.5 rounded-xl text-base text-slate-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <span>{row.label}</span>
                  {row.on
                    ? <Check className="w-5 h-5 text-brand-500" />
                    : sheet !== 'sort' && <span className="w-5 h-5 rounded-md border-2 border-slate-300" />}
                </button>
              ))}
            </div>
            {sheet !== 'sort' && (
              <button onClick={() => setSheet(null)} className="btn-primary w-full mt-3 text-sm">
                Show {posts.length} result{posts.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Filter bottom sheet ── */}
      {filterOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="relative bg-white rounded-t-3xl px-5 pt-4 pb-10 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-800">Filters</h2>
              <div className="flex items-center gap-3">
                <button onClick={clearFilters} className="text-sm text-brand-500 font-medium">Clear all</button>
                <button onClick={() => setFilterOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Distance */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">📍 Distance</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-slate-500">
                      {pendingDistOn ? `${pendingDistMin}–${pendingDistMax} km` : 'Custom distance'}
                    </span>
                    <div
                      onClick={() => setPendingDistOn(v => !v)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${pendingDistOn ? 'bg-brand-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${pendingDistOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                </div>
                {pendingDistOn && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>From</span>
                        <span className="font-semibold text-brand-500">{pendingDistMin} km</span>
                      </div>
                      <input
                        type="range" min={0} max={99} step={1}
                        value={pendingDistMin}
                        onChange={e => setPendingDistMin(Math.min(Number(e.target.value), pendingDistMax - 1))}
                        className="w-full accent-brand-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>To</span>
                        <span className="font-semibold text-brand-500">{pendingDistMax} km</span>
                      </div>
                      <input
                        type="range" min={1} max={100} step={1}
                        value={pendingDistMax}
                        onChange={e => setPendingDistMax(Math.max(Number(e.target.value), pendingDistMin + 1))}
                        className="w-full accent-brand-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Price range */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">💰 Price range (CAD)</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number" min={0} placeholder="Min"
                      value={pendingPriceMin}
                      onChange={e => setPendingPriceMin(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  </div>
                  <span className="text-slate-400 text-sm font-medium">—</span>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number" min={0} placeholder="Max"
                      value={pendingPriceMax}
                      onChange={e => setPendingPriceMax(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  </div>
                </div>
              </div>

              {/* Minimum rating */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">⭐ Minimum rating</p>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5].map(r => (
                    <button
                      key={r}
                      onClick={() => setPendingRating(r)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                        pendingRating === r
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {r === 0 ? 'Any' : `${r}★`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={applyFilters} className="btn-primary w-full mt-5 text-sm">
              Show results
            </button>
          </div>
        </div>
      )}

      {/* ── Location picker bottom sheet ── */}
      {locationPickerOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setLocationPickerOpen(false)}
          />
          {/* Sheet */}
          <div className="relative bg-white rounded-t-3xl px-4 pt-4 pb-10 shadow-2xl h-[65vh] flex flex-col">
            {/* Handle */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">Change location</h2>
              <button onClick={() => setLocationPickerOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Search input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={locationInputRef}
                type="search"
                placeholder="e.g. 123 Main St, Toronto…"
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">

            {/* GPS button */}
            <button
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 font-medium mb-2 hover:bg-gray-50"
              onClick={useGpsLocation}
              disabled={gpsLoading}
            >
              <Navigation className={`w-4 h-4 text-brand-500 ${gpsLoading ? 'animate-pulse' : ''}`} />
              {gpsLoading ? 'Getting your location…' : 'Use my current location'}
            </button>

            {/* Default location chip */}
            <button
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-brand-50 border border-brand-200 text-sm text-brand-700 font-medium mb-2"
              onClick={() => {
                saveLocation({ name: DEFAULT_LOCATION, lat: null, lng: null })
                setLocationPickerOpen(false)
              }}
            >
              <MapPin className="w-4 h-4 text-brand-500" />
              Use default — {DEFAULT_LOCATION}
              {userLocation.name === DEFAULT_LOCATION && (
                <Check className="w-4 h-4 ml-auto text-brand-500" />
              )}
            </button>

            {/* Suggestions */}
            {locationResults.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                {locationResults.map((s, i) => {
                  const label = formatNominatimLabel(s)
                  return (
                    <button
                      key={i}
                      className="flex items-start gap-2 w-full text-left px-3 py-3 text-sm text-slate-700 hover:bg-orange-50 border-b border-slate-100 last:border-0"
                      onClick={() => selectLocationResult(s)}
                    >
                      <MapPin className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                      <span className="leading-snug">{label}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {locationQuery.length >= 2 && locationResults.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4">No results found</p>
            )}
            </div>{/* end scrollable body */}
          </div>
        </div>
      )}
    </div>
  )
}
