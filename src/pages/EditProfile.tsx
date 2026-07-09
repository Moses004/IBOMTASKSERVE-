import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { uploadAvatar } from '../lib/storage'
import { Avatar } from '../components/Avatar'

export default function EditProfile() {
  const { profile, user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleAvatarChange(file: File | null) {
    setAvatarFile(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    setSubmitting(true)
    try {
      let avatarUrl = profile?.avatar_url ?? null
      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id, avatarFile)
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone: phone || null, city: city || null, avatar_url: avatarUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      await refreshProfile()
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas px-6 pb-10 pt-6">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface shadow-sm"
          >
            <ChevronLeft size={18} className="text-primary" />
          </button>
          <div className="font-display text-lg font-bold">Edit profile</div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-3xl border border-line bg-surface p-5 shadow-sm">
          {error && (
            <div className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</div>
          )}
          {saved && (
            <div className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success">
              Profile updated.
            </div>
          )}

          <div className="flex items-center gap-4">
            <Avatar
              url={previewUrl ?? profile?.avatar_url}
              name={fullName || 'You'}
              className="h-16 w-16 rounded-2xl"
            />
            <label className="cursor-pointer rounded-xl border border-line bg-canvas px-3.5 py-2 text-xs font-bold text-ink-soft">
              Change photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">
              Full name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="+234 801 234 5678"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="Lagos"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-primary py-3.5 font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
