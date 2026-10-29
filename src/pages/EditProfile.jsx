import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Camera, LogOut, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function EditProfile() {
  const navigate  = useNavigate()
  const { user, profile, refreshProfile, signOut } = useAuth()
  const fileRef   = useRef()
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    bio:       profile?.bio ?? '',
    phone:     profile?.phone ?? '',
    location_name: profile?.location_name ?? '',
  })
  const [avatar, setAvatar]     = useState(null)
  const [preview, setPreview]   = useState(profile?.avatar_url ?? null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleAvatarPick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatar(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      let avatarUrl = profile?.avatar_url ?? null
      if (avatar) {
        const ext  = avatar.name.split('.').pop()
        const path = `avatars/${user.id}.${ext}`
        await supabase.storage.from('avatars').upload(path, avatar, { upsert: true })
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = publicUrl
      }

      const { error } = await supabase.from('profiles').upsert({
        id:            user.id,
        full_name:     form.full_name.trim(),
        bio:           form.bio.trim(),
        phone:         form.phone.trim(),
        location_name: form.location_name.trim(),
        avatar_url:    avatarUrl,
        updated_at:    new Date().toISOString(),
      })
      if (error) throw error

      await refreshProfile()
      setSuccess(true)
      setTimeout(() => { setSuccess(false); navigate(`/profile/${user.id}`) }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  async function handleDeleteAccount() {
    setDeleting(true); setError('')
    // Best effort: remove the user's uploads while still signed in. Storage
    // files can't be deleted from SQL, and a failure here must not block deletion.
    for (const bucket of ['food-photos', 'food-videos', 'review-photos']) {
      try {
        const { data } = await supabase.storage.from(bucket).list(user.id, { limit: 1000 })
        if (data?.length) await supabase.storage.from(bucket).remove(data.map(f => `${user.id}/${f.name}`))
      } catch { /* ignore */ }
    }
    try {
      const { data } = await supabase.storage.from('avatars').list('avatars', { search: user.id })
      if (data?.length) await supabase.storage.from('avatars').remove(data.map(f => `avatars/${f.name}`))
    } catch { /* ignore */ }

    const { error } = await supabase.rpc('delete_my_account')
    if (error) {
      setDeleting(false)
      setError("We couldn't delete your account. Please try again, or email li.alvin2@gmail.com.")
      return
    }
    await signOut().catch(() => {})
    navigate('/', { replace: true })
  }

  return (
    <div className="bg-white min-h-full pb-8">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Edit Profile</h1>
      </div>

      <form onSubmit={handleSave} className="px-4 py-5 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {preview
              ? <img src={preview} className="w-24 h-24 rounded-full object-cover border-4 border-brand-100" alt="avatar" />
              : <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center text-4xl font-bold text-brand-600">
                  {form.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
            }
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 bg-brand-500 text-white rounded-full p-2 shadow"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
          <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Your name" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Bio</label>
          <textarea className="input resize-none h-20" value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell buyers about yourself…" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Phone (optional)</label>
          <input className="input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 (416) 555-0123" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Your City / Neighbourhood</label>
          <input className="input" value={form.location_name} onChange={e => set('location_name', e.target.value)} placeholder="e.g. Scarborough, ON" />
        </div>

        {error   && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>}
        {success && <p className="text-green-600 text-sm bg-green-50 rounded-xl px-4 py-2">✅ Profile saved!</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Saving…' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </form>

      {/* Account deletion (App Store rule 5.1.1(v)) */}
      <div className="px-4 pt-2">
        <div className="border-t border-slate-100 pt-5">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete account
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="font-semibold text-red-700">Delete your account?</p>
              <p className="text-sm text-red-600 mt-1">
                This removes your profile, listings, photos, messages and reviews for good. It can't be undone.
              </p>
              {error && <p className="text-sm text-red-700 font-medium mt-2">{error}</p>}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-60 transition-colors"
                >
                  {deleting ? 'Deleting…' : 'Delete forever'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
