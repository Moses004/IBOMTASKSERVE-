import { useState } from 'react'
import { useVerificationHistory } from '../../lib/adminQueries'
import { Pagination } from '../../components/Pagination'

const statusStyle: Record<string, string> = {
  verified: 'bg-success-soft text-success',
  rejected: 'bg-danger-soft text-danger',
}

export default function AdminVerificationHistory() {
  const [page, setPage] = useState(0)
  const { rows, loading, totalCount, pageSize } = useVerificationHistory(page)

  return (
    <div>
      <div className="font-display text-xl font-bold">Verification History</div>
      <p className="mt-1 text-sm text-ink-soft">Every approval and rejection decision, in order.</p>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-ink-soft">Loading…</p>}

        {!loading && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-ink-soft">
            No verification decisions have been made yet.
          </div>
        )}

        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-bold">{r.tasker_name}</div>
                <div className="mt-0.5 text-xs text-ink-soft">
                  by {r.admin_name} · {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusStyle[r.status]}`}>
                {r.status}
              </span>
            </div>
            {r.reason && (
              <div className="mt-2.5 rounded-xl bg-canvas px-3 py-2 text-xs text-ink-soft">"{r.reason}"</div>
            )}
          </div>
        ))}
      </div>

      <Pagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
    </div>
  )
}
