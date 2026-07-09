import { useState } from 'react'
import { useAllTaskerBalances, useAllPayouts } from '../../lib/adminQueries'
import { initiatePayout } from '../../lib/payouts'
import { Pagination } from '../../components/Pagination'

const statusStyle: Record<string, string> = {
  pending: 'bg-[#FFF4D9] text-[#E0A100]',
  success: 'bg-success-soft text-success',
  failed: 'bg-danger-soft text-danger',
  reversed: 'bg-danger-soft text-danger',
}

export default function AdminPayouts() {
  const { rows, loading, refresh } = useAllTaskerBalances()
  const [historyPage, setHistoryPage] = useState(0)
  const { rows: history, loading: historyLoading, totalCount: historyTotal, pageSize: historyPageSize, refresh: refreshHistory } = useAllPayouts(historyPage)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [amountDraft, setAmountDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function openPayForm(taskerId: string, balance: number) {
    setPayingId(taskerId)
    setAmountDraft(balance.toFixed(2))
  }

  async function handlePay(taskerId: string) {
    const amount = Number(amountDraft)
    if (!amount || amount <= 0) return
    setSubmitting(true)
    try {
      await initiatePayout(taskerId, amount)
      setPayingId(null)
      refresh()
      refreshHistory()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Payout failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const payable = rows.filter((r) => r.hasPayoutAccount && r.availableBalance > 0)
  const noAccount = rows.filter((r) => !r.hasPayoutAccount && r.availableBalance > 0)

  return (
    <div>
      <div className="font-display text-xl font-bold">Payouts</div>
      <p className="mt-1 text-sm text-ink-soft">Pay verified taskers for completed, paid jobs.</p>

      <div className="mt-6 text-xs font-bold uppercase tracking-wide text-primary">Ready to pay</div>
      <div className="mt-3 space-y-3">
        {loading && <p className="text-sm text-ink-soft">Loading…</p>}
        {!loading && payable.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-5 text-center text-sm text-ink-soft">
            No taskers currently have a payable balance.
          </div>
        )}
        {payable.map((r) => (
          <div key={r.tasker_id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold">{r.full_name}</div>
              <div className="font-display text-sm font-bold text-primary">${r.availableBalance.toFixed(2)}</div>
            </div>

            {payingId === r.tasker_id ? (
              <div className="mt-3 flex gap-2">
                <input
                  type="number"
                  value={amountDraft}
                  onChange={(e) => setAmountDraft(e.target.value)}
                  max={r.availableBalance}
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none"
                />
                <button
                  disabled={submitting}
                  onClick={() => handlePay(r.tasker_id)}
                  className="flex-shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {submitting ? 'Sending…' : 'Confirm'}
                </button>
                <button
                  onClick={() => setPayingId(null)}
                  className="flex-shrink-0 rounded-xl border border-line px-3 py-2 text-xs font-bold text-ink-soft"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => openPayForm(r.tasker_id, r.availableBalance)}
                className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
              >
                Pay via Paystack
              </button>
            )}
          </div>
        ))}
      </div>

      {noAccount.length > 0 && (
        <>
          <div className="mt-6 text-xs font-bold uppercase tracking-wide text-primary">
            Owed, but no payout account yet
          </div>
          <div className="mt-3 space-y-2">
            {noAccount.map((r) => (
              <div key={r.tasker_id} className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 shadow-sm">
                <div className="text-sm font-bold">{r.full_name}</div>
                <div className="text-sm text-ink-soft">${r.availableBalance.toFixed(2)} pending setup</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 text-xs font-bold uppercase tracking-wide text-primary">Payout history</div>
      <div className="mt-3 space-y-2.5">
        {historyLoading && <p className="text-sm text-ink-soft">Loading…</p>}
        {!historyLoading && history.length === 0 && (
          <p className="text-sm text-ink-soft">No payouts made yet.</p>
        )}
        {history.map((h) => (
          <div key={h.id} className="rounded-2xl border border-line bg-surface p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold">{h.tasker_name}</div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusStyle[h.status] ?? ''}`}>
                {h.status}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-ink-soft">
              <span>${h.amount}</span>
              <span>{new Date(h.created_at).toLocaleDateString()}</span>
            </div>
            {h.failure_reason && <div className="mt-1 text-xs text-danger">{h.failure_reason}</div>}
          </div>
        ))}
      </div>

      <Pagination page={historyPage} pageSize={historyPageSize} totalCount={historyTotal} onPageChange={setHistoryPage} />
    </div>
  )
}
