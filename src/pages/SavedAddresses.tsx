import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Trash2, MapPin } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSavedAddresses, addSavedAddress, deleteSavedAddress } from '../lib/queries'

export default function SavedAddresses() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { addresses, loading, refresh } = useSavedAddresses(user?.id ?? null)
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!user || !label.trim() || !address.trim()) return
    setSubmitting(true)
    try {
      await addSavedAddress(user.id, label.trim(), address.trim())
      setLabel('')
      setAddress('')
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save address.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteSavedAddress(id)
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete address.')
    } finally {
      setDeletingId(null)
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
          <div className="font-display text-lg font-bold">Saved addresses</div>
        </div>

        <form onSubmit={handleAdd} className="mt-5 space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Home, Office)"
            className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full address"
            rows={2}
            className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Add address'}
          </button>
        </form>

        <div className="mt-5 space-y-2.5">
          {loading && <p className="text-sm text-ink-soft">Loading…</p>}
          {!loading && addresses.length === 0 && (
            <p className="text-sm text-ink-soft">No saved addresses yet.</p>
          )}
          {addresses.map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft">
                <MapPin size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{a.label}</div>
                <div className="mt-0.5 text-xs text-ink-soft">{a.address}</div>
              </div>
              <button
                disabled={deletingId === a.id}
                onClick={() => handleDelete(a.id)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-line text-ink-faint disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
