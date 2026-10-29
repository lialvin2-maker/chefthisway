import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const REASONS = [
  'Unsafe or spoiled food',
  'Scam or fake listing',
  'Offensive or inappropriate content',
  'Harassment or abuse',
  'Spam',
  'Something else',
]

// Report a listing (postId) or a person (userId). Reports land in the
// `reports` table for the owner to review in Supabase.
export default function ReportDialog({ postId = null, userId = null, title, onClose }) {
  const { user } = useAuth()
  const [reason, setReason]   = useState('')
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!reason) { setError('Pick a reason.'); return }
    setSending(true); setError('')
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      post_id: postId,
      reported_user_id: userId,
      reason,
      details: details.trim() || null,
    })
    setSending(false)
    if (error) setError("We couldn't send your report. Please try again.")
    else setDone(true)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="py-4">
            <p className="text-slate-700">Thanks. We review every report within 24 hours and remove content that breaks our rules.</p>
            <button onClick={onClose} className="btn-primary w-full mt-5">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              {REASONS.map(r => (
                <label key={r} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${reason === r ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-brand-500" />
                  <span className="text-sm text-slate-700">{r}</span>
                </label>
              ))}
            </div>
            <textarea
              className="input resize-none h-20"
              placeholder="Anything else we should know? (optional)"
              value={details}
              maxLength={1000}
              onChange={e => setDetails(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={sending}>
              {sending ? 'Sending…' : 'Send report'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
