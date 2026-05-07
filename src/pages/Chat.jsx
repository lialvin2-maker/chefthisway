import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Star, Lock } from 'lucide-react'
import { supabase, supabaseData } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { formatDate, reviewEligibility, REVIEW_COOLOFF_HOURS, isHighRiskPost } from '../lib/utils'
import ReviewForm from '../components/ReviewForm'

async function fetchConversation(id) {
  const { data } = await supabaseData
    .from('conversations')
    .select(`*, food_posts(id, title, photos, price, seller_id, seller_name, requires_license, description)`)
    .eq('id', id)
    .single()
  return data
}
async function fetchMessages(convId) {
  const { data } = await supabaseData
    .from('messages')
    .select('*')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
  return data ?? []
}
async function fetchMyReview(postId, userId) {
  if (!postId || !userId) return null
  const { data } = await supabaseData
    .from('reviews')
    .select('*')
    .eq('post_id', postId)
    .eq('reviewer_id', userId)
    .maybeSingle()
  return data
}

export default function Chat() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const bottomRef = useRef()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)

  const { data: conv }          = useQuery({ queryKey: ['conv', id],  queryFn: () => fetchConversation(id) })
  const { data: messages = [] } = useQuery({ queryKey: ['msgs', id],  queryFn: () => fetchMessages(id), refetchInterval: 3000 })
  const postId = conv?.food_posts?.id
  const { data: myReview } = useQuery({
    queryKey: ['my-review', postId, user?.id],
    queryFn:  () => fetchMyReview(postId, user.id),
    enabled:  !!postId && !!user?.id,
  })

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('chat-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, () => {
        qc.invalidateQueries(['msgs', id])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [id])

  // Scroll to bottom when messages load
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Mark as read
  useEffect(() => {
    if (!conv || !user) return
    const field = conv.buyer_id === user.id ? { unread_buyer: 0 } : { unread_seller: 0 }
    supabase.from('conversations').update(field).eq('id', id)
    qc.invalidateQueries(['conversations'])
  }, [conv, user])

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')
    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      await supabase.from('messages').insert({
        conversation_id: id,
        sender_id: session.user.id,
        content,
      })
      // Update conversation last_message
      const isBuyer = conv?.buyer_id === session.user.id
      await supabase.from('conversations').update({
        last_message:    content,
        last_message_at: new Date().toISOString(),
        ...(isBuyer ? { unread_seller: (conv?.unread_seller ?? 0) + 1 } : { unread_buyer: (conv?.unread_buyer ?? 0) + 1 }),
      }).eq('id', id)

      qc.invalidateQueries(['msgs', id])
      qc.invalidateQueries(['conversations'])
    } finally {
      setSending(false)
    }
  }

  const post = conv?.food_posts
  const reviewState = reviewEligibility({
    conversation:   conv,
    existingReview: myReview,
    post,
    userId:         user?.id,
  })

  return (
    <div className="flex flex-col h-dvh bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-slate-100 bg-white z-10">
        <button onClick={() => navigate('/inbox')} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {post && (
          <Link to={`/post/${post.id}`} className="flex items-center gap-2 flex-1 min-w-0">
            {post.photos?.[0]
              ? <img src={post.photos[0]} className="w-10 h-10 rounded-xl object-cover" alt={post.title} />
              : <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-lg">🍽️</div>
            }
            <div className="min-w-0">
              <p className="font-semibold text-sm text-slate-800 truncate">{post.title}</p>
              <p className="text-xs text-brand-500">
                {isHighRiskPost(post)
                  ? 'Please contact'
                  : (post.price > 0 ? `$${post.price} CAD` : 'Free')}
              </p>
            </div>
          </Link>
        )}

        {/* Review button — surfaces in the chat header per your spec */}
        {reviewState === 'ready' && (
          <button
            onClick={() => setReviewOpen(true)}
            className="flex items-center gap-1 bg-brand-500 text-white text-xs font-semibold px-3 py-2 rounded-full hover:bg-brand-600 transition-colors flex-shrink-0"
          >
            <Star className="w-3.5 h-3.5 fill-white" />
            Review
          </button>
        )}
        {reviewState === 'edit' && (
          <button
            onClick={() => setReviewOpen(true)}
            className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-2 rounded-full hover:bg-amber-200 transition-colors flex-shrink-0"
          >
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            Edit review
          </button>
        )}
        {reviewState === 'locked' && (
          <button
            onClick={() => alert(`You can leave a review ${REVIEW_COOLOFF_HOURS}h after first contacting the seller. Give it a little time!`)}
            className="flex items-center gap-1 bg-gray-100 text-slate-400 text-xs font-semibold px-3 py-2 rounded-full flex-shrink-0"
          >
            <Lock className="w-3.5 h-3.5" />
            Review
          </button>
        )}
      </div>

      {/* Review modal */}
      {reviewOpen && post && (
        <ReviewForm
          post={post}
          existingReview={myReview}
          onClose={() => setReviewOpen(false)}
          onSuccess={() => {
            qc.invalidateQueries(['my-review', postId])
            qc.invalidateQueries(['reviews', postId])
            qc.invalidateQueries(['post', postId])
          }}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scroll-smooth-native">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-slate-500 text-sm">Say hello! Ask about the food, pickup time, or anything else.</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id
          const showTime = i === 0 || new Date(msg.created_at) - new Date(messages[i-1].created_at) > 5 * 60 * 1000
          return (
            <div key={msg.id}>
              {showTime && (
                <div className="text-center">
                  <span className="text-xs text-slate-400 bg-gray-50 px-2 py-0.5 rounded-full">
                    {formatDate(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-brand-500 text-white rounded-br-sm'
                    : 'bg-gray-100 text-slate-800 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 bg-white"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <input
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  )
}
