import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCustomerBookings } from '../lib/queries'

const paymentStyle: Record<string, string> = {
  unpaid: 'bg-[#FFF4D9] text-[#E0A100]',
  paid: 'bg-success-soft text-success',
  failed: 'bg-danger-soft text-danger',
  refund_pending: 'bg-[#FFF4D9] text-[#E0A100]',
  refunded: 'bg-primary-soft text-primary',
}

const paymentLabel: Record<string, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  failed: 'Failed',
  refund_pending: 'Refund pending',
  refunded: 'Refunded',
}

export default function PaymentHistory() {
  const { user } = useAuth()
  const { bookings, loading } = useCustomerBookings(user?.id ?? null)
  const navigate = useNavigate()

  const paidTotal = bookings.filter((b) => b.payment_status === 'paid').reduce((s, b) => s + Number(b.total_price), 0)

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
          <div className="font-display text-lg font-bold">Payment history</div>
        </div>

        <div className="mt-4 rounded-2xl bg-primary px-5 py-5 text-white shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-80">Total paid</div>
          <div className="mt-1 font-display text-3xl font-bold">${paidTotal.toFixed(2)}</div>
        </div>

        <div className="mt-5 space-y-2.5">
          {loading && <p className="text-sm text-ink-soft">Loading…</p>}
          {!loading && bookings.length === 0 && (
            <p className="text-sm text-ink-soft">No payments yet.</p>
          )}
          {bookings.map((b) => (
            <div key={b.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold">{b.category_name} · {b.tasker_name}</div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${paymentStyle[b.payment_status] ?? ''}`}>
                  {paymentLabel[b.payment_status] ?? b.payment_status}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-ink-soft">
                <span>{b.scheduled_date}</span>
                <span className="font-bold text-primary">${b.total_price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
