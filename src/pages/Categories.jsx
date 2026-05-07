import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CATEGORIES } from '../lib/utils'
import FoodCard from '../components/FoodCard'

async function fetchByCategory(category) {
  const { data, error } = await supabase
    .from('food_posts')
    .select('*')
    .eq('status', 'active')
    .eq('category', category)
    .order('is_boosted', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(40)
  if (error) throw error
  return data ?? []
}

export default function Categories() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts-by-category', selected],
    queryFn: () => fetchByCategory(selected),
    enabled: !!selected,
  })

  if (selected) {
    const cat = CATEGORIES.find(c => c.key === selected)
    return (
      <div className="bg-gray-50 min-h-full">
        <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">{cat?.emoji} {cat?.label}</h1>
            <p className="text-xs text-slate-500">{isLoading ? '…' : `${posts.length} items`}</p>
          </div>
        </div>

        <div className="px-4 py-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse h-52 bg-slate-200" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">{cat?.emoji}</p>
              <p className="text-slate-500">No {cat?.label} listings yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {posts.map(post => <FoodCard key={post.id} post={post} compact />)}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">Categories</h1>
        <p className="text-sm text-slate-500">Browse food by type</p>
      </div>

      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        {CATEGORIES.filter(c => c.key !== 'all').map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelected(cat.key)}
            className="card p-5 text-left hover:shadow-md transition-shadow active:scale-98"
          >
            <span className="text-4xl">{cat.emoji}</span>
            <p className="font-semibold text-slate-800 mt-2">{cat.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">Browse listings</p>
          </button>
        ))}
      </div>
    </div>
  )
}
