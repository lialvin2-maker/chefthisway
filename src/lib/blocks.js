import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseData } from './supabase'
import { useAuth } from './AuthContext'

// The signed-in user's block list as a Set of user ids (empty when signed out).
export function useBlockedIds() {
  const { user } = useAuth()
  const { data } = useQuery({
    queryKey: ['blocks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabaseData.from('blocks').select('blocked_id').eq('blocker_id', user.id)
      if (error) throw error
      return data.map(b => b.blocked_id)
    },
    enabled: !!user,
    staleTime: 60000,
  })
  return new Set(data ?? [])
}

export function useToggleBlock() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return async (otherId, block) => {
    const q = block
      ? supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: otherId })
      : supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', otherId)
    const { error } = await q
    if (error && error.code !== '23505') throw error  // 23505 = already blocked
    qc.invalidateQueries(['blocks', user.id])
  }
}
