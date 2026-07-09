import { useEffect, useState } from 'react'
import { useAllUsers, setUserSuspended } from '../../lib/adminQueries'
import { Pagination } from '../../components/Pagination'

const roleFilters = ['all', 'customer', 'tasker', 'admin'] as const
type RoleFilter = (typeof roleFilters)[number]

export default function AdminUsers() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('') // debounced value actually sent to the query
  const [page, setPage] = useState(0)
  const [actingOn, setActingOn] = useState<string | null>(null)

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(handle)
  }, [searchInput])

  const { users, loading, totalCount, pageSize, refresh } = useAllUsers(page, roleFilter, search)

  function changeRoleFilter(r: RoleFilter) {
    setRoleFilter(r)
    setPage(0)
  }

  function changeSearch(value: string) {
    setSearchInput(value)
    setPage(0)
  }

  async function handleToggleSuspend(userId: string, currentlySuspended: boolean) {
    const verb = currentlySuspended ? 'reactivate' : 'suspend'
    if (!confirm(`Are you sure you want to ${verb} this user?`)) return
    setActingOn(userId)
    try {
      await setUserSuspended(userId, !currentlySuspended)
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : `Could not ${verb} user.`)
    } finally {
      setActingOn(null)
    }
  }

  return (
    <div>
      <div className="font-display text-xl font-bold">Users</div>
      <p className="mt-1 text-sm text-ink-soft">
        Suspending blocks app access immediately. It doesn't retroactively touch their existing bookings or payouts.
      </p>

      <input
        value={searchInput}
        onChange={(e) => changeSearch(e.target.value)}
        placeholder="Search by name…"
        className="mt-4 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
      />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {roleFilters.map((r) => (
          <button
            key={r}
            onClick={() => changeRoleFilter(r)}
            className={`flex-shrink-0 rounded-full px-3.5 py-2 text-xs font-bold capitalize ${
              roleFilter === r ? 'bg-primary text-white' : 'border border-line bg-surface text-ink-soft'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {loading && <p className="text-sm text-ink-soft">Loading…</p>}

        {!loading && users.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-ink-soft">
            No users match this filter.
          </div>
        )}

        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-deep font-display text-sm font-bold text-white">
              {u.full_name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="text-sm font-bold">{u.full_name}</div>
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[9px] font-bold uppercase text-primary">
                  {u.role}
                </span>
                {u.is_suspended && (
                  <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[9px] font-bold uppercase text-danger">
                    Suspended
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-ink-soft">
                {u.phone ?? 'No phone'} {u.city ? `· ${u.city}` : ''}
              </div>
            </div>
            {u.role !== 'admin' && (
              <button
                disabled={actingOn === u.id}
                onClick={() => handleToggleSuspend(u.id, u.is_suspended)}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
                  u.is_suspended ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
                }`}
              >
                {u.is_suspended ? 'Reactivate' : 'Suspend'}
              </button>
            )}
          </div>
        ))}
      </div>

      <Pagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
    </div>
  )
}
