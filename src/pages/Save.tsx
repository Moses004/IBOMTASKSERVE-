import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSavedTaskers, toggleSaveTasker } from '../lib/queries'
import { Layout } from '../components/Layout'
import { Avatar } from '../components/Avatar'
import { Bookmark } from 'lucide-react'

export default function Save() {
  const { user } = useAuth()
  const { saved, loading, refresh } = useSavedTaskers(user?.id ?? null)
  const navigate = useNavigate()

  async function handleUnsave(taskerId: string) {
    if (!user) return
    await toggleSaveTasker(user.id, taskerId, true)
    refresh()
  }

  return (
    <Layout>
      <div className="mx-auto max-w-md px-6 pt-6">
        <div className="font-display text-xl font-bold">Saved Pros</div>

        <div className="mt-5 space-y-3">
          {loading && <p className="text-sm text-ink-soft">Loading…</p>}

          {!loading && saved.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-ink-soft">
              Tap the bookmark icon on a tasker's profile to save them here for quick rebooking.
            </div>
          )}

          {saved.map((s) => (
            <div key={s.tasker_id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <button onClick={() => navigate(`/tasker/${s.tasker_id}`)} className="flex flex-1 items-center gap-3 text-left">
                <Avatar url={s.avatar_url} name={s.full_name} className="h-14 w-14 flex-shrink-0 rounded-2xl" />
                <div>
                  <div className="font-display font-bold">{s.full_name}</div>
                  <div className="mt-0.5 text-xs text-ink-soft">★ {s.avg_rating.toFixed(1)}</div>
                </div>
              </button>
              <button
                onClick={() => handleUnsave(s.tasker_id)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-line"
              >
                <Bookmark size={16} className="fill-primary text-primary" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
