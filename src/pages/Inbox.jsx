import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { supabase, supabaseData } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { formatDate } from '../lib/utils'
import { useEffect } from 'react'
import AdSlot from '../components/AdSlot'
import { useBlockedIds } from '../lib/blocks'

async function fetchConversations(userId) {
  const { data, error } = await supabaseData
    .from('conversations')
    .select(`*, food_posts(title, photos)`)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data ?? []
}

export default function Inbox() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const blocked = useBlockedIds()
  const { data: allConvs = [], isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => fetchConversations(user.id),
    enabled: !!user,
  })
  const convs = allConvs.filter(c => !blocked.has(c.buyer_id === user.id ? c.seller_id : c.buyer_id))

  // Real-time updates
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('inbox-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        qc.invalidateQueries(['conversations', user.id])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  if (isLoading) return (
    <div className="bg-white min-h-full">
      <div className="px-4 pt-safe pb-4 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inbox</h1>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="w-14 h-14 rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-2/3" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="bg-white min-h-full">
      <div className="px-4 pt-safe pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inbox</h1>
        <p className="text-xs text-slate-500">{convs.length} conversation{convs.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Ad banner — only shown when there are real conversations */}
      {convs.length > 0 && (
        <div className="px-4 pt-2 empty:hidden">
          <AdSlot />
        </div>
      )}

      {convs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <MessageCircle className="w-14 h-14 text-slate-200 mb-4" />
          <p className="text-slate-600 font-medium">No messages yet</p>
          <p className="text-slate-400 text-sm mt-1 max-w-xs">When you contact a seller or someone contacts you, it'll appear here.</p>
          <Link to="/" className="btn-primary text-sm py-2.5 mt-5">Browse food</Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-50">
          {convs.map(conv => {
            const isBuyer  = conv.buyer_id  === user.id
            const unread   = isBuyer ? conv.unread_buyer : conv.unread_seller
            const postImg  = conv.food_posts?.photos?.[0]
            const postTitle = conv.food_posts?.title ?? 'Food item'
            const other    = isBuyer ? conv.seller_name : conv.buyer_name

            return (
              <li key={conv.id}>
                <button
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  {/* Post thumbnail */}
                  <div className="relative flex-shrink-0">
                    {postImg
                      ? <img src={postImg} className="w-14 h-14 rounded-xl object-cover" alt={postTitle} />
                      : <div className="w-14 h-14 rounded-xl bg-brand-100 flex items-center justify-center text-2xl">🍽️</div>
                    }
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {postTitle}
                      </p>
                      <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                        {formatDate(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {other ? `${other} · ` : ''}{isBuyer ? 'Seller' : 'Buyer'}
                    </p>
                    {conv.last_message && (
                      <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                        {conv.last_message}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
