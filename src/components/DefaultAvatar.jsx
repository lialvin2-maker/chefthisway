/**
 * DefaultAvatar — shown when a user has no profile photo.
 * Renders a gradient circle with the person's initial.
 * The gradient colour is derived from the first character of the name
 * so the same person always gets the same colour.
 *
 * Props:
 *   name      – string used to pick the initial & colour
 *   className – Tailwind size classes, e.g. "w-9 h-9 text-sm"
 */

const GRADIENTS = [
  'from-orange-400 to-rose-400',
  'from-violet-500 to-purple-500',
  'from-sky-400 to-cyan-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-blue-400 to-indigo-500',
]

export default function DefaultAvatar({ name, className = 'w-10 h-10 text-sm' }) {
  const initial  = name?.[0]?.toUpperCase() ?? '?'
  const gradient = GRADIENTS[(name?.charCodeAt(0) ?? 0) % GRADIENTS.length]

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white flex-shrink-0 select-none ${className}`}
    >
      {initial}
    </div>
  )
}
