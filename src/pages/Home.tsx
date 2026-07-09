import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCategories, useSavedTaskers, useTaskerSearch } from '../lib/queries'
import { useNotifications } from '../lib/notifications'
import { getCategoryStyle } from '../lib/categoryIcons'
import { Layout } from '../components/Layout'
import { Avatar } from '../components/Avatar'

export default function Home() {
  const { profile, user } = useAuth()
  const { categories, loading } = useCategories()
  const { saved } = useSavedTaskers(user?.id ?? null)
  const { unreadCount } = useNotifications(user?.id ?? null)
  const [search, setSearch] = useState('')
  const { results: taskerResults, loading: searching } = useTaskerSearch(search)
  const navigate = useNavigate()

  const matchingCategories = search.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()))
    : categories

  const isSearching = search.trim().length > 0

  return (
    <Layout>
      <div className="mx-auto max-w-md px-6 pt-6">
        <div className="flex items-center justify-between">
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface shadow-sm">
            <div className="grid grid-cols-2 gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-sm bg-primary" />
              ))}
            </div>
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface shadow-sm"
          >
            <Bell size={18} className="text-primary" />
            {unreadCount > 0 && (
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-danger" />
            )}
          </button>
        </div>

        <div className="mt-4 font-display text-xl font-bold">
          Hi {profile?.full_name?.split(' ')[0]}, what do you need?
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-sm">
          <Search size={16} className="flex-shrink-0 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for services or pros"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
          />
        </div>

        {isSearching ? (
          <>
            {matchingCategories.length > 0 && (
              <>
                <div className="mt-6 font-display text-sm font-bold">Categories</div>
                <div className="mt-2.5 space-y-2">
                  {matchingCategories.map((c) => {
                    const style = getCategoryStyle(c.slug)
                    const Icon = style.icon
                    return (
                      <button
                        key={c.id}
                        onClick={() => navigate(`/category/${c.id}`, { state: { name: c.name } })}
                        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-sm"
                      >
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${style.bg}`}>
                          <Icon size={17} className={style.fg} />
                        </div>
                        <div className="text-sm font-bold">{c.name}</div>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            <div className="mt-6 font-display text-sm font-bold">Pros</div>
            <div className="mt-2.5 space-y-2">
              {searching && <p className="text-sm text-ink-soft">Searching…</p>}
              {!searching && taskerResults.length === 0 && (
                <p className="text-sm text-ink-soft">No verified pros match "{search}".</p>
              )}
              {taskerResults.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/tasker/${t.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-sm"
                >
                  <Avatar url={t.avatar_url} name={t.full_name} className="h-9 w-9 rounded-full" />
                  <div className="text-sm font-bold">{t.full_name}</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mt-7 flex items-center justify-between">
              <div className="font-display text-base font-bold">Categories</div>
            </div>

            {loading ? (
              <p className="mt-3 text-sm text-ink-soft">Loading…</p>
            ) : (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {categories.map((c) => {
                  const style = getCategoryStyle(c.slug)
                  const Icon = style.icon
                  return (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/category/${c.id}`, { state: { name: c.name } })}
                      className="flex w-[74px] flex-shrink-0 flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3 pt-3.5 shadow-sm"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.bg}`}>
                        <Icon size={19} className={style.fg} />
                      </div>
                      <div className="text-center text-[11px] font-bold leading-tight">{c.name}</div>
                    </button>
                  )
                })}
              </div>
            )}

            {saved.length > 0 && (
              <>
                <div className="mt-7 flex items-center justify-between">
                  <div className="font-display text-base font-bold">Your saved pros</div>
                  <button onClick={() => navigate('/save')} className="text-xs font-bold text-primary">
                    See all
                  </button>
                </div>
                <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                  {saved.map((s) => (
                    <button
                      key={s.tasker_id}
                      onClick={() => navigate(`/tasker/${s.tasker_id}`)}
                      className="w-36 flex-shrink-0 rounded-2xl border border-line bg-surface p-3.5 text-left shadow-sm"
                    >
                      <Avatar url={s.avatar_url} name={s.full_name} className="h-9 w-9 rounded-full" />
                      <div className="mt-2.5 text-sm font-bold">{s.full_name}</div>
                      <div className="mt-0.5 text-xs text-ink-soft">★ {s.avg_rating.toFixed(1)}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div className="h-6" />
      </div>
    </Layout>
  )
}
