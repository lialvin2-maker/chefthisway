import { Link, useLocation } from 'react-router-dom'
import { Home, Grid3X3, PlusCircle, MessageCircle, User } from 'lucide-react'
import { useAuth } from './lib/AuthContext'
import { cn } from './lib/utils'
import { useEffect, useState } from 'react'
import { supabase, supabaseData } from './lib/supabase'

const NAV = [
  { label: 'Home',       icon: Home,          path: '/' },
  { label: 'Categories', icon: Grid3X3,        path: '/categories' },
  { label: 'Create',     icon: PlusCircle,     path: '/create',    isCreate: true },
  { label: 'Inbox',      icon: MessageCircle,  path: '/inbox' },
  { label: 'Profile',    icon: User,           path: null },   // dynamic path
]

export default function Layout({ children }) {
  const { pathname } = useLocation()
  const { user, profile } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    fetchUnread()
    const channel = supabase
      .channel('unread-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchUnread)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  async function fetchUnread() {
    if (!user) return
    const { data } = await supabaseData
      .from('conversations')
      .select('unread_buyer, unread_seller')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    if (!data) return
    let total = 0
    data.forEach(c => {
      if (c.buyer_id === user.id)  total += c.unread_buyer  || 0
      if (c.seller_id === user.id) total += c.unread_seller || 0
    })
    setUnread(total)
  }

  return (
    <div className="flex flex-col h-dvh">
      {/* Page content — scrollable */}
      <main className="flex-1 overflow-y-auto scroll-smooth-native pb-16">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-100 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {NAV.map((item) => {
            const href = item.label === 'Profile'
              ? (user ? `/profile/${user.id}` : '/login')
              : item.path
            const isActive = item.label === 'Profile'
              ? pathname.startsWith('/profile')
              : item.label === 'Home'
                ? pathname === '/'
                : pathname.startsWith(item.path)

            if (item.isCreate) {
              return (
                <Link
                  key={item.label}
                  to={href}
                  className="flex flex-col items-center -mt-5"
                >
                  <div className="w-14 h-14 rounded-full bg-brand-500 shadow-lg shadow-brand-200 flex items-center justify-center active:scale-95 transition-transform">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                </Link>
              )
            }

            return (
              <Link
                key={item.label}
                to={href}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors',
                  isActive ? 'text-brand-500' : 'text-slate-400'
                )}
              >
                <item.icon className={cn('w-6 h-6 transition-colors', isActive ? 'text-brand-500' : 'text-slate-400')} />
                <span className={cn('text-[10px] font-medium', isActive ? 'text-brand-500' : 'text-slate-400')}>
                  {item.label}
                </span>

                {/* Unread badge on Inbox */}
                {item.label === 'Inbox' && unread > 0 && (
                  <span className="absolute -top-0.5 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
