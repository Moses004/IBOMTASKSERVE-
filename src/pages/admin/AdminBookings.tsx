import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useAdminBookings, adminRefundBooking, adminCancelBooking, useAdminOverviewStats } from '../../lib/adminQueries'
import { Pagination } from '../../components/Pagination'

const paymentStyle: Record<string, string> = {
  unpaid: 'bg-[#FFF4D9] text-[#E0A100]',
  paid: 'bg-success-soft text-success',
  failed: 'bg-danger-soft text-danger',
  refund_pending: 'bg-[#FFF4D9] text-[#E0A100]',
  refunded: 'bg-primary-soft text-primary',
}

const statusStyle: Record<string, string> = {
  pending: 'bg-primary-soft text-primary',
  confirmed: 'bg-primary-soft text-primary',
  in_progress: 'bg-primary-soft text-primary',
  completed: 'bg-success-soft text-success',
  cancelled: 'bg-danger-soft text-danger',
}

const filters = ['all', 'unpaid', 'paid', 'failed', 'refund_pending', 'refunded'] as const
const filterLabels: Record<string, string> = {
  all: 'All',
  unpaid: 'Unpaid',
  paid: 'Paid',
  failed: 'Failed',
  refund_pending: 'Refund pending',
  refunded: 'Refunded',
}
type Filter = (typeof filters)[number]

export default function AdminBookings() {
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(0)
  const { bookings, loading, totalCount, pageSize, refresh } = useAdminBookings(page, filter)
  const { stats } = useAdminOverviewStats()
  const [actingOn, setActingOn] = useState<string | null>(null)

  function changeFilter(f: Filter) {
    setFilter(f)
    setPage(0) // filter changed — the current page number no longer means the same thing
  }

  async function handleRefund(bookingId: string) {
    if (!confirm('Request a real refund through Paystack for this booking? This cannot be undone.')) return
    setActingOn(bookingId)
    try {
      await adminRefundBooking(bookingId)
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not request refund.')
    } finally {
      setActingOn(null)
    }
  }

  async function handleCancel(bookingId: string) {
    if (!confirm('Cancel this booking?')) return
    setActingOn(bookingId)
    try {
      await adminCancelBooking(bookingId)
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not cancel booking.')
    } finally {
      setActingOn(null)
    }
  }

  return (
    <div>
      <div className="font-display text-xl font-bold">Bookings</div>
      <p className="mt-1 text-sm text-ink-soft">Every booking on the platform, with payment status.</p>

      {stats && (stats.failedPayments > 0 || stats.unpaidBookings > 0) && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          <AlertTriangle size={16} />
          {stats.failedPayments > 0 && `${stats.failedPayments} failed payment${stats.failedPayments === 1 ? '' : 's'}`}
          {stats.failedPayments > 0 && stats.unpaidBookings > 0 && ' · '}
          {stats.unpaidBookings > 0 && `${stats.unpaidBookings} unpaid booking${stats.unpaidBookings === 1 ? '' : 's'}`}
          {' '}(across the whole platform, not just this page)
        </div>
      )}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
            className={`flex-shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${
              filter === f ? 'bg-primary text-white' : 'border border-line bg-surface text-ink-soft'
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {loading && <p className="text-sm text-ink-soft">Loading…</p>}

        {!loading && bookings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-ink-soft">
            No bookings match this filter.
          </div>
        )}

        {bookings.map((b) => (
          <div key={b.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-bold">
                  {b.customer_name} <span className="font-normal text-ink-soft">→</span> {b.tasker_name}
                </div>
                <div className="mt-0.5 text-xs text-ink-soft">
                  {b.category_name} · {b.scheduled_date} · {b.scheduled_time}
                </div>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusStyle[b.status] ?? ''}`}>
                  {b.status}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${paymentStyle[b.payment_status] ?? ''}`}>
                  {filterLabels[b.payment_status] ?? b.payment_status}
                </span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between">
              <div className="font-display text-sm font-bold">${b.total_price}</div>
              {b.payment_reference && (
                <div className="text-[10px] text-ink-faint">ref: {b.payment_reference}</div>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              {b.payment_status === 'paid' && (
                <button
                  disabled={actingOn === b.id}
                  onClick={() => handleRefund(b.id)}
                  className="rounded-xl border border-line bg-canvas px-3 py-1.5 text-xs font-bold text-ink-soft disabled:opacity-50"
                >
                  Refund via Paystack
                </button>
              )}
              {b.status !== 'cancelled' && b.status !== 'completed' && (
                <button
                  disabled={actingOn === b.id}
                  onClick={() => handleCancel(b.id)}
                  className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-1.5 text-xs font-bold text-danger disabled:opacity-50"
                >
                  Cancel booking
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Pagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
    </div>
  )
}
