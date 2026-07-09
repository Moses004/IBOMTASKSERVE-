import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Star, Bookmark } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTaskerDetail, useTaskerReviews, isTaskerSaved, toggleSaveTasker } from '../lib/queries'
import { Avatar } from '../components/Avatar'

export default function TaskerProfile() {
  const { taskerId } = useParams<{ taskerId: string }>()
  const location = useLocation() as { state?: { categoryId?: string; categoryName?: string } }
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tasker, loading } = useTaskerDetail(taskerId ?? null)
  const { reviews } = useTaskerReviews(taskerId ?? null)

  const [selectedCategoryId, setSelectedCategoryId] = useState(location.state?.categoryId ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (tasker && !selectedCategoryId && tasker.services.length > 0) {
      setSelectedCategoryId(tasker.services[0].category_id)
    }
  }, [tasker, selectedCategoryId])

  useEffect(() => {
    if (user && taskerId) isTaskerSaved(user.id, taskerId).then(setSaved)
  }, [user, taskerId])

  async function handleToggleSave() {
    if (!user || !taskerId) return
    setSaved((s) => !s)
    await toggleSaveTasker(user.id, taskerId, saved)
  }

  const selectedService = tasker?.services.find((s) => s.category_id === selectedCategoryId)

  if (loading || !tasker) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-ink-soft">Loading profile…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas pb-28">
      <div className="flex items-center justify-between px-6 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface shadow-sm"
        >
          <ChevronLeft size={18} className="text-primary" />
        </button>
        <button
          onClick={handleToggleSave}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface shadow-sm"
        >
          <Bookmark size={16} className={saved ? 'fill-primary text-primary' : 'text-ink-faint'} />
        </button>
      </div>

      <div className="mx-auto max-w-md border-b border-line px-6 pb-5 pt-3">
        <Avatar url={tasker.avatar_url} name={tasker.full_name} className="h-[74px] w-[74px] rounded-[22px]" />
        <div className="mt-3 font-display text-[22px] font-bold">{tasker.full_name}</div>
        {selectedService && (
          <div className="mt-0.5 text-[13px] font-bold text-primary">Expert {selectedService.category_name}</div>
        )}

        <div className="mt-3.5 flex gap-5">
          <div>
            <div className="text-[9.5px] font-bold uppercase tracking-wide text-ink-faint">Rating</div>
            <div className="mt-0.5 flex items-center gap-1 text-[13px] font-bold">
              <Star size={12} className="fill-gold text-gold" />
              {tasker.avg_rating.toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-[9.5px] font-bold uppercase tracking-wide text-ink-faint">Total jobs</div>
            <div className="mt-0.5 text-[13px] font-bold">{tasker.total_jobs}</div>
          </div>
          <div>
            <div className="text-[9.5px] font-bold uppercase tracking-wide text-ink-faint">Experience</div>
            <div className="mt-0.5 text-[13px] font-bold">{tasker.years_experience} yrs</div>
          </div>
        </div>

        {tasker.bio && <p className="mt-3.5 text-[13.5px] leading-relaxed text-ink-soft">{tasker.bio}</p>}
      </div>

      <div className="mx-auto max-w-md px-6 pt-4">
        <div className="font-display text-sm font-bold">Services & rates</div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {tasker.services.map((s) => (
            <button
              key={s.category_id}
              onClick={() => setSelectedCategoryId(s.category_id)}
              className={`rounded-full px-3.5 py-2 text-xs font-bold ${
                s.category_id === selectedCategoryId
                  ? 'bg-primary text-white'
                  : 'bg-primary-soft text-primary'
              }`}
            >
              {s.category_name} · ${s.hourly_rate}/hr
            </button>
          ))}
        </div>

        <div className="mt-6 font-display text-sm font-bold">Recent reviews</div>
        <div className="mt-2.5 space-y-3">
          {reviews.length === 0 && <p className="text-sm text-ink-soft">No reviews yet.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold">{r.customer_name}</div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < r.rating ? 'fill-gold text-gold' : 'text-line'}
                    />
                  ))}
                </div>
              </div>
              {r.comment && <p className="mt-1.5 text-[13px] text-ink-soft">{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-line bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div>
            <div className="font-display text-lg font-bold">${selectedService?.hourly_rate ?? '—'}</div>
            <div className="text-[10.5px] text-ink-soft">per hour</div>
          </div>
          <button
            disabled={!selectedService}
            onClick={() =>
              navigate(`/book/${tasker.id}`, {
                state: {
                  tasker: {
                    tasker_id: tasker.id,
                    full_name: tasker.full_name,
                    hourly_rate: selectedService?.hourly_rate ?? 0,
                  },
                  categoryId: selectedCategoryId,
                },
              })
            }
            className="flex-1 rounded-2xl bg-primary py-3.5 font-semibold text-white disabled:opacity-60"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  )
}
