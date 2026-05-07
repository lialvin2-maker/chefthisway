import { Link } from 'react-router-dom'
import { Heart, Star, MapPin } from 'lucide-react'
import { formatPrice, getCategoryLabel, displayPrice, isHighRiskPost, descriptionWithoutMarker } from '../lib/utils'
import DefaultAvatar from './DefaultAvatar'

export default function FoodCard({ post, compact = false }) {
  const photo = post.photos?.[0]

  return (
    <Link to={`/post/${post.id}`} className="card block hover:shadow-md transition-shadow">
      {/* Photo */}
      <div className="relative">
        {photo ? (
          <img
            src={photo}
            alt={post.title}
            className={compact ? 'w-full h-36 object-cover' : 'w-full h-52 object-cover'}
            loading="lazy"
          />
        ) : (
          <div className={`w-full ${compact ? 'h-36' : 'h-52'} bg-orange-50 flex items-center justify-center`}>
            <img src="/logo.png" alt="ChefThisWay" className="w-16 h-16 object-contain opacity-40" />
          </div>
        )}
        {post.is_boosted && (
          <span className="absolute top-2 left-2 bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}
        {post.status === 'sold' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">SOLD</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-brand-500 font-medium mb-0.5">
              {getCategoryLabel(post.category)}
            </p>
            <h3 className="font-semibold text-slate-800 text-sm leading-tight truncate">
              {post.title}
            </h3>
          </div>
          {isHighRiskPost(post) ? (
            <span className="text-xs font-semibold text-slate-400 italic whitespace-nowrap">Please contact</span>
          ) : (
            <span className="text-brand-600 font-bold text-sm whitespace-nowrap">
              {formatPrice(post.price)}
            </span>
          )}
        </div>

        {!compact && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{descriptionWithoutMarker(post)}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            {post.seller_photo ? (
              <img src={post.seller_photo} alt={post.seller_name} className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <DefaultAvatar name={post.seller_name} className="w-4 h-4 text-[8px]" />
            )}
            <span className="truncate max-w-[80px]">{post.seller_name ?? 'Unknown'}</span>
            {post.updated_at && new Date(post.updated_at) - new Date(post.created_at) > 60000 && (
              <span className="text-[9px] text-slate-400 italic ml-1">edited</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            {post.average_rating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {Number(post.average_rating).toFixed(1)}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <Heart className="w-3 h-3" />
              {post.likes_count ?? 0}
            </span>
          </div>
        </div>

        {post.location_name && (
          <div className="flex items-center gap-0.5 mt-1 text-xs text-slate-400">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{post.location_name}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
