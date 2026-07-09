import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Star } from 'lucide-react'
import { useTaskersByCategory } from '../lib/queries'
import { Avatar } from '../components/Avatar'

export default function CategoryList() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const location = useLocation() as { state?: { name?: string } }
  const navigate = useNavigate()
  const { taskers, loading } = useTaskersByCategory(categoryId ?? null)

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
          <div className="font-display text-lg font-bold">Find Expert {location.state?.name ?? ''}</div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {['Top rated', 'Available today', 'Verified only'].map((label, i) => (
            <div
              key={label}
              className={`flex-shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${
                i === 0 ? 'bg-primary text-white' : 'border border-line bg-surface text-ink-soft'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {loading && <p className="text-sm text-ink-soft">Loading pros…</p>}

          {!loading && taskers.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-ink-soft">
              No verified pros in this category yet.
            </div>
          )}

          {taskers.map((t) => (
            <button
              key={t.tasker_id}
              onClick={() =>
                navigate(`/tasker/${t.tasker_id}`, {
                  state: { categoryId, categoryName: location.state?.name },
                })
              }
              className="flex w-full gap-3 rounded-2xl border border-line bg-surface p-4 text-left shadow-sm"
            >
              <Avatar url={t.avatar_url} name={t.full_name} className="h-16 w-16 rounded-2xl" />
              <div className="flex-1">
                <div className="font-display text-[15.5px] font-bold">{t.full_name}</div>
                <div className="mt-0.5 text-xs font-bold text-primary">
                  Expert {location.state?.name ?? ''}
                </div>
                <div className="mt-2.5 flex gap-4">
                  <div>
                    <div className="text-[9.5px] font-bold uppercase tracking-wide text-ink-faint">Rating</div>
                    <div className="mt-0.5 flex items-center gap-1 text-[13px] font-bold">
                      <Star size={12} className="fill-gold text-gold" />
                      {t.avg_rating.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9.5px] font-bold uppercase tracking-wide text-ink-faint">Total jobs</div>
                    <div className="mt-0.5 text-[13px] font-bold">{t.total_jobs}</div>
                  </div>
                  <div>
                    <div className="text-[9.5px] font-bold uppercase tracking-wide text-ink-faint">Rate</div>
                    <div className="mt-0.5 text-[13px] font-bold">${t.hourly_rate}/hr</div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
