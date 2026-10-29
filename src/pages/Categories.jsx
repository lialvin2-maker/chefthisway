import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CATEGORIES, categoryKeysFor, postInCategory } from '../lib/utils'
import FoodCard from '../components/FoodCard'
import { useBlockedIds } from '../lib/blocks'

async function fetchByCategory(category) {
  const { data, error } = await supabase
    .from('food_posts')
    .select('*')
    .eq('status', 'active')
    .or(categoryKeysFor(category).map(k => `category.ilike.%${k}%`).join(','))
    .order('is_boosted', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) throw error
  // ilike is a substring match; keep exact key matches only
  return (data ?? []).filter(p => postInCategory(p.category, category))
}

export default function Categories() {
  // The open category lives in the URL (?cat=) so the phone's swipe-back returns to the list
  const [params, setParams] = useSearchParams()
  const selected = params.get('cat')

  const blocked = useBlockedIds()
  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ['posts-by-category', selected],
    queryFn: () => fetchByCategory(selected),
    enabled: !!selected,
  })
  const posts = allPosts.filter(p => !blocked.has(p.seller_id))

  if (selected) {
    const cat = CATEGORIES.find(c => c.key === selected)
    return (
      <div className="bg-gray-50 min-h-full">
        <div className="bg-white px-4 pt-safe pb-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
          <button onClick={() => window.history.back()} aria-label="Back" className="p-2.5 -ml-2.5 rounded-full hover:bg-gray-100 active:bg-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">{cat?.emoji} {cat?.label}</h1>
            <p className="text-xs text-slate-500">{isLoading ? '…' : `${posts.length} listing${posts.length === 1 ? '' : 's'}`}</p>
          </div>
        </div>

        <div className="px-4 py-4">
          {isLoading ? (
            <div className="food-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse"><div className="w-full aspect-square bg-slate-200" /><div className="h-20" /></div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 px-6">
              <p className="text-5xl mb-4">{cat?.emoji}</p>
              <p className="font-semibold text-slate-800">No {cat?.label} food yet</p>
              <p className="text-sm text-slate-500 mt-1">Cook it? Be the first to post it.</p>
              <div className="flex justify-center gap-2 mt-5">
                <Link to="/create" className="btn-primary text-sm py-2.5">Post food</Link>
                <button onClick={() => window.history.back()} className="btn-secondary text-sm py-2.5">Other categories</button>
              </div>
            </div>
          ) : (
            <div className="food-grid">
              {posts.map(post => <FoodCard key={post.id} post={post} compact />)}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="bg-white px-4 pt-safe pb-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Categories</h1>
      </div>

      <div className="px-4 pt-2 pb-6">
        {[['type', 'Food type'], ['cuisine', 'Cuisine'], ['diet', 'Dietary']].map(([group, title]) => (
          <section key={group}>
            <h2 className="text-sm font-semibold text-slate-500 mt-5 mb-2">{title}</h2>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.filter(c => c.group === group).map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setParams({ cat: cat.key })}
                  className="card p-4 min-h-[64px] text-left flex items-center gap-3 hover:shadow-md transition active:scale-[0.98]"
                >
                  <span className="text-3xl">{cat.emoji}</span>
                  <span className="font-semibold text-slate-800 leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
