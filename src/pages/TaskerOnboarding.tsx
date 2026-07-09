import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { uploadAvatar, uploadIdDocument } from '../lib/storage'
import { useAuth } from '../contexts/AuthContext'

export default function TaskerOnboarding() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [bio, setBio] = useState('')
  const [years, setYears] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [idFile, setIdFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!idFile) {
      setError('An ID document is required before you can accept bookings.')
      return
    }
    setError(null)
    setSubmitting(true)

    try {
      // 1. Tasker profile (bio, experience) — public storefront fields
      const { error: profileError } = await supabase.from('tasker_profiles').upsert({
        id: user.id,
        bio,
        years_experience: Number(years) || 0,
      })
      if (profileError) throw profileError

      // 2. Optional avatar — goes to the public bucket, URL saved on the base profile
      if (avatarFile) {
        const avatarUrl = await uploadAvatar(user.id, avatarFile)
        const { error: avatarError } = await supabase
          .from('profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', user.id)
        if (avatarError) throw avatarError
      }

      // 3. ID document — private bucket, only the storage path is recorded,
      //    never a public URL. Admins view it via a signed URL later.
      const docPath = await uploadIdDocument(user.id, idFile)
      const { error: docError } = await supabase
        .from('tasker_documents')
        .upsert({ tasker_id: user.id, id_document_path: docPath })
      if (docError) throw docError

      await refreshProfile()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-display text-2xl font-bold">Tell customers about yourself</div>
          <p className="mt-2 text-sm text-ink-soft">
            Your ID stays private — it's only visible to you and our verification team.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-line bg-surface p-6 shadow-sm">
          {error && (
            <div className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">
              Profile photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">Bio</label>
            <textarea
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="Licensed plumber with 6 years of experience in leak repair and installations..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">
              Years of experience
            </label>
            <input
              type="number"
              min={0}
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="6"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">
              ID document <span className="normal-case text-ink-faint">(required for verification)</span>
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              required
              onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-primary"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-primary py-3.5 font-semibold text-white transition hover:bg-primary-deep disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit for verification'}
          </button>
        </form>
      </div>
    </div>
  )
}
