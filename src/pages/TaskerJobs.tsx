import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTaskerBookings } from '../lib/queries'
import { acceptBooking, declineBooking, startBooking, completeBooking } from '../lib/bookings'
import { Avatar } from '../components/Avatar'

const tabs = [
  { key: 'pending', label: 'New requests' },
  { key: 'confirmed', label: 'Upcoming' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'history', label: 'History' },
] as const
type TabKey = (typeof tabs)[number]['key']

const statusStyle: Record<string, string> = {
  pending: 'bg-primary-soft text-primary',
  confirmed: 'bg-primary-soft text-primary',
  in_progress: 'bg-[#FFF4D9] text-[#E0A100]',
  completed: 'bg-success-soft text-success',
  cancelled: 'bg-danger-soft text-danger',
}

export default function TaskerJobs() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { bookings, loading, refresh } = useTaskerBookings(user?.id ?? null)
  const [tab, setTab] = useState<TabKey>('pending')
  const [actingOn, setActingOn] = useState<string | null>(null)

  const visible = bookings.filter((b) => {
    if (tab === 'history') return b.status === 'completed' || b.status === 'cancelled'
    return b.status === tab
  })

  const pendingPaidCount = bookings.filter((b) => b.status === 'pending' && b.payment_status === 'paid').length

  async function handleAction(action: (id: string) => Promise<void>, bookingId: string) {
    setActingOn(bookingId)
    try {
      await action(bookingId)
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setActingOn(null)
    }
  }

  async function handleDecline(bookingId: string, wasPaid: boolean) {
    if (!confirm(wasPaid ? 'Decline this booking? The customer will be automatically refunded.' : 'Decline this booking?')) return
    setActingOn(bookingId)
    try {
      const result = await declineBooking(bookingId)
      if (wasPaid) {
        alert(
          result.refundInitiated
            ? 'Booking declined. The customer has been automatically refunded.'
            : (result.message ?? 'Booking declined, but the automatic refund could not be completed.')
        )
      }
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setActingOn(null)
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
          <div className="font-display text-lg font-bold">Your jobs</div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex-shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${
                tab === t.key ? 'bg-primary text-white' : 'border border-line bg-surface text-ink-soft'
              }`}
            >
              {t.label}
              {t.key === 'pending' && pendingPaidCount > 0 && (
                <span className="ml-1.5 rounded-full bg-danger px-1.5 py-0.5 text-[9px] text-white">
                  {pendingPaidCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {loading && <p className="text-sm text-ink-soft">Loading…</p>}

          {!loading && visible.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-ink-soft">
              Nothing here right now.
            </div>
          )}

          {visible.map((b) => (
            <div key={b.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar url={b.customer_avatar_url} name={b.customer_name} className="h-9 w-9 rounded-full" />
                  <div>
                    <div className="text-sm font-bold">{b.customer_name}</div>
                    <div className="mt-0.5 text-xs text-ink-soft">
                      {b.category_name} · {b.scheduled_date} · {b.scheduled_time} · {b.duration_hours}h
                    </div>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusStyle[b.status]}`}>
                  {b.status.replace('_', ' ')}
                </span>
              </div>

              <p className="mt-2.5 text-xs text-ink-soft">{b.description}</p>
              {b.address && <p className="mt-1 text-xs text-ink-faint">{b.address}</p>}

              <div className="mt-2.5 flex items-center justify-between">
                <div className="font-display text-sm font-bold">${b.total_price}</div>
                {b.payment_status !== 'paid' && (
                  <span className="text-[10px] font-bold uppercase text-ink-faint">
                    {b.payment_status === 'unpaid' ? 'Awaiting payment' : b.payment_status}
                  </span>
                )}
              </div>

              <button
                onClick={() => navigate(`/chat/${b.id}`)}
                className="mt-2.5 text-xs font-bold text-primary underline"
              >
                Message {b.customer_name}
              </button>

              {b.status === 'pending' && b.payment_status === 'paid' && (
                <div className="mt-3 flex gap-2">
                  <button
                    disabled={actingOn === b.id}
                    onClick={() => handleAction(acceptBooking, b.id)}
                    className="flex-1 rounded-xl bg-success py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    disabled={actingOn === b.id}
                    onClick={() => handleDecline(b.id, true)}
                    className="flex-1 rounded-xl bg-danger py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    Decline (auto-refunds)
                  </button>
                </div>
              )}

              {b.status === 'pending' && b.payment_status !== 'paid' && (
                <div className="mt-3 rounded-xl bg-canvas px-3 py-2 text-xs text-ink-soft">
                  Waiting for the customer to complete payment before you can accept.
                </div>
              )}

              {b.status === 'confirmed' && (
                <button
                  disabled={actingOn === b.id}
                  onClick={() => handleAction(startBooking, b.id)}
                  className="mt-3 w-full rounded-xl bg-primary py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  Start job
                </button>
              )}

              {b.status === 'in_progress' && (
                <button
                  disabled={actingOn === b.id}
                  onClick={() => handleAction(completeBooking, b.id)}
                  className="mt-3 w-full rounded-xl bg-success py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  Mark complete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
