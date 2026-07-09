import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCustomerBookings, useMyReviewedBookingIds, submitReview } from '../lib/queries'
import { cancelBookingAsCustomer, attemptBookingPayment } from '../lib/bookings'
import { Layout } from '../components/Layout'
import { Avatar } from '../components/Avatar'

const statusStyle: Record<string, string> = {
  pending: 'bg-primary-soft text-primary',
  confirmed: 'bg-primary-soft text-primary',
  in_progress: 'bg-[#FFF4D9] text-[#E0A100]',
  completed: 'bg-success-soft text-success',
  cancelled: 'bg-danger-soft text-danger',
}

const statusLabel: Record<string, string> = {
  pending: 'Awaiting tasker',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function Bookings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { bookings, loading, refresh } = useCustomerBookings(user?.id ?? null)
  const { reviewedIds, refresh: refreshReviewed } = useMyReviewedBookingIds(user?.id ?? null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleCancel(bookingId: string) {
    if (!confirm('Cancel this booking?')) return
    setCancellingId(bookingId)
    try {
      await cancelBookingAsCustomer(bookingId)
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not cancel booking.')
    } finally {
      setCancellingId(null)
    }
  }

  async function handlePayNow(bookingId: string, totalPrice: number) {
    if (!user?.email) return
    setPayingId(bookingId)
    try {
      const result = await attemptBookingPayment(bookingId, totalPrice, user.email)
      if (result.status === 'failed') {
        alert(result.message)
      }
      // 'cancelled' (closed popup) needs no message here — they're still
      // looking right at the "Payment incomplete" label, nothing changed.
      refresh()
    } finally {
      setPayingId(null)
    }
  }

  function openReview(bookingId: string) {
    setReviewingId(bookingId)
    setRating(5)
    setComment('')
  }

  async function handleSubmitReview(bookingId: string, taskerId: string) {
    if (!user) return
    setSubmitting(true)
    try {
      await submitReview(bookingId, user.id, taskerId, rating, comment)
      setReviewingId(null)
      refreshReviewed()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-md px-6 pt-6">
        <div className="font-display text-xl font-bold">Bookings</div>

        <div className="mt-5 space-y-3">
          {loading && <p className="text-sm text-ink-soft">Loading…</p>}

          {!loading && bookings.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-ink-soft">
              No bookings yet — browse a category from Home to book your first pro.
            </div>
          )}

          {bookings.map((b) => (
            <div key={b.id} className="flex gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <Avatar url={b.tasker_avatar_url} name={b.tasker_name} className="h-12 w-12 flex-shrink-0 rounded-2xl" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold">{b.tasker_name}</div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusStyle[b.status]}`}>
                    {statusLabel[b.status] ?? b.status}
                  </span>
                </div>
                <div className="mt-1 text-xs text-ink-soft">
                  {b.category_name} · {b.scheduled_date} · {b.scheduled_time}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="text-xs font-bold text-primary">${b.total_price}</div>
                  {b.payment_status === 'unpaid' && (
                    <span className="text-[10px] font-bold uppercase text-ink-faint">Payment incomplete</span>
                  )}
                </div>

                {b.payment_status === 'unpaid' && b.status !== 'cancelled' && (
                  <button
                    disabled={payingId === b.id}
                    onClick={() => handlePayNow(b.id, b.total_price)}
                    className="mt-2.5 w-full rounded-lg bg-primary py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {payingId === b.id ? 'Opening Paystack…' : `Complete payment · $${b.total_price}`}
                  </button>
                )}

                <button
                  onClick={() => navigate(`/chat/${b.id}`)}
                  className="mt-1 text-xs font-bold text-primary underline"
                >
                  Message {b.tasker_name}
                </button>

                {(b.status === 'pending' || b.status === 'confirmed') && (
                  <button
                    disabled={cancellingId === b.id}
                    onClick={() => handleCancel(b.id)}
                    className="mt-2.5 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink-soft disabled:opacity-50"
                  >
                    Cancel booking
                  </button>
                )}

                {b.status === 'completed' && !reviewedIds.has(b.id) && reviewingId !== b.id && (
                  <button
                    onClick={() => openReview(b.id)}
                    className="mt-2.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Leave a review
                  </button>
                )}

                {b.status === 'completed' && reviewedIds.has(b.id) && (
                  <div className="mt-2 text-xs font-semibold text-success">You reviewed this job</div>
                )}

                {reviewingId === b.id && (
                  <div className="mt-3 rounded-xl bg-canvas p-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setRating(n)}>
                          <Star
                            size={20}
                            className={n <= rating ? 'fill-gold text-gold' : 'text-line'}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                      placeholder="How did it go? (optional)"
                      className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        disabled={submitting}
                        onClick={() => handleSubmitReview(b.id, b.tasker_id)}
                        className="flex-1 rounded-lg bg-primary py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {submitting ? 'Submitting…' : 'Submit review'}
                      </button>
                      <button
                        onClick={() => setReviewingId(null)}
                        className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink-soft"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
