import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price) {
  if (price === 0 || price === null || price === undefined) return 'Free'
  return `$${Number(price).toFixed(2)} CAD`
}

// Marker prepended to description when "needs refrigeration" is checked.
// We use a description marker instead of the requires_license column because
// the RLS policy rejects rows with requires_license=true unless the user
// has a verified-seller flag.
export const REFRIG_MARKER = '🥶 Refrigerated/high-risk — please contact seller.'

export function isHighRiskPost(post) {
  if (!post) return false
  if (post.requires_license) return true                         // legacy posts
  return typeof post.description === 'string' && post.description.startsWith(REFRIG_MARKER)
}

export function descriptionWithoutMarker(post) {
  if (!post?.description) return ''
  if (post.description.startsWith(REFRIG_MARKER)) {
    return post.description.slice(REFRIG_MARKER.length).replace(/^\s*\n+/, '')
  }
  return post.description
}

export function displayPrice(post) {
  if (isHighRiskPost(post)) return null   // null means "Please contact"
  return formatPrice(post?.price)
}

// Review eligibility (client-side gate — RLS enforces it server-side too).
// Returns one of: 'hidden' | 'edit' | 'locked' | 'ready'
export const REVIEW_COOLOFF_HOURS = 24

// Dev escape hatch: in DevTools console run
//   localStorage.setItem('ctw_skip_cooloff','1')   // bypass the 24h wait
//   localStorage.removeItem('ctw_skip_cooloff')    // restore normal behavior
function effectiveCooloffHours() {
  if (typeof window === 'undefined') return REVIEW_COOLOFF_HOURS
  return localStorage.getItem('ctw_skip_cooloff') === '1' ? 0 : REVIEW_COOLOFF_HOURS
}

export function reviewEligibility({ conversation, existingReview, post, userId }) {
  if (!post || !userId) return 'hidden'
  if (post.seller_id === userId) return 'hidden'        // sellers can't review own listing
  if (existingReview) return 'edit'
  if (!conversation) return 'hidden'
  const hoursSince = (Date.now() - new Date(conversation.created_at)) / 3600000
  if (hoursSince < effectiveCooloffHours()) return 'locked'
  return 'ready'
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

export function formatTimeAgo(dateStr) {
  return formatDate(dateStr)
}

export const CATEGORIES = [
  // ── Browse by cuisine ──────────────────────────────────────
  { key: 'all',        label: 'All',        emoji: '🍽️',  group: 'all' },
  { key: 'asian',      label: 'Asian',      emoji: '🌏',  group: 'cuisine' },
  { key: 'chinese',    label: 'Chinese',    emoji: '🥢',  group: 'cuisine' },
  { key: 'hong_kong',  label: 'Hong Kong',  emoji: '🇭🇰', group: 'cuisine' },
  { key: 'japanese',   label: 'Japanese',   emoji: '🍱',  group: 'cuisine' },
  { key: 'korean',     label: 'Korean',     emoji: '🇰🇷', group: 'cuisine' },
  { key: 'vietnamese', label: 'Vietnamese', emoji: '🍜',  group: 'cuisine' },
  { key: 'thai',       label: 'Thai',       emoji: '🌶️', group: 'cuisine' },
  { key: 'indian',     label: 'Indian',     emoji: '🫓',  group: 'cuisine' },
  { key: 'western',    label: 'Western',    emoji: '🍔',  group: 'cuisine' },
  { key: 'italian',    label: 'Italian',    emoji: '🍕',  group: 'cuisine' },
  { key: 'mexican',    label: 'Mexican',    emoji: '🌮',  group: 'cuisine' },
  { key: 'caribbean',  label: 'Caribbean',  emoji: '🏝️', group: 'cuisine' },
  { key: 'middle_eastern', label: 'Middle Eastern', emoji: '🧆', group: 'cuisine' },
  // ── Browse by food type ────────────────────────────────────
  { key: 'bakery',    label: 'Bakery',    emoji: '🥐',  group: 'type' },
  { key: 'hot_mains', label: 'Hot Mains', emoji: '🍛',  group: 'type' },
  { key: 'snacks',    label: 'Snacks',    emoji: '🥟',  group: 'type' },
  { key: 'beverages', label: 'Beverages', emoji: '🧋',  group: 'type' },
  { key: 'desserts',  label: 'Desserts',  emoji: '🍰',  group: 'type' },
  { key: 'salads',    label: 'Salads',    emoji: '🥗',  group: 'type' },
  { key: 'other',     label: 'Other',     emoji: '🎁',  group: 'type' },
  // ── Browse by dietary preference ──────────────────────────
  { key: 'vegetarian',    label: 'Vegetarian',    emoji: '🥦',  group: 'diet' },
  { key: 'vegan',         label: 'Vegan',         emoji: '🌱',  group: 'diet' },
  { key: 'pescatarian',   label: 'Pescatarian',   emoji: '🐟',  group: 'diet' },
  { key: 'halal',         label: 'Halal',         emoji: '✅',  group: 'diet' },
  { key: 'kosher',        label: 'Kosher',        emoji: '✡️', group: 'diet' },
  { key: 'gluten_free',   label: 'Gluten-Free',   emoji: '🌾',  group: 'diet' },
  { key: 'dairy_free',    label: 'Dairy-Free',    emoji: '🥛',  group: 'diet' },
  { key: 'nut_free',      label: 'Nut-Free',      emoji: '🥜',  group: 'diet' },
]

// getCategoryLabel accepts a single key or a comma-separated string of keys.
// Returns the label(s) for display.
export function getCategoryLabel(keyOrKeys) {
  if (!keyOrKeys) return ''
  const keys = String(keyOrKeys).split(',').map(k => k.trim()).filter(Boolean)
  const labels = keys.map(k => CATEGORIES.find(c => c.key === k)?.label ?? k)
  return labels.join(' · ')
}

// Umbrella keys: picking "Asian" also shows posts tagged with one Asian cuisine only
const CATEGORY_CHILDREN = { asian: ['chinese', 'hong_kong', 'japanese', 'korean', 'vietnamese', 'thai'] }

export function categoryKeysFor(key) {
  return [key, ...(CATEGORY_CHILDREN[key] ?? [])]
}

// post.category holds one key or a comma list ("indian,hot_mains")
export function postInCategory(postCategory, key) {
  const cats = String(postCategory ?? '').split(',').map(c => c.trim())
  return categoryKeysFor(key).some(k => cats.includes(k))
}

export function getCategoryEmoji(key) {
  return CATEGORIES.find(c => c.key === key)?.emoji ?? ''
}

export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
