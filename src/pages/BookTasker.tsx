import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { createBooking, attemptBookingPayment } from '../lib/bookings'
import type { TaskerListing } from '../lib/queries'
import { useSavedAddresses } from '../lib/queries'

type Stage = 'form' | 'redirecting' | 'verifying' | 'done' | 'payment_incomplete'

export default function BookTasker() {
  const { taskerId } = useParams<{ taskerId: string }>()
  const location = useLocation() as {
    state?: { tasker?: TaskerListing; categoryId?: string; categoryName?: string }
  }
  const { user } = useAuth()
  const { addresses: savedAddresses } = useSavedAddresses(user?.id ?? null)
  const navigate = useNavigate()

  const tasker = location.state?.tasker
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [hours, setHours] = useState(2)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('form')

  // Kept once created so a cancelled/failed payment can be retried against
  // the SAME booking instead of creating a duplicate one.
  const [pendingBooking, setPendingBooking] = useState<{ id: string; total_price: number } | null>(null)

  const rate = tasker?.hourly_rate ?? 0
  const total = hours * rate + 3.5

  async function runPayment(bookingId: string, totalPrice: number) {
    setStage('redirecting')
    const result = await attemptBookingPayment(bookingId, totalPrice, user!.email!)

    if (result.status === 'success') {
      setStage('done')
      return
    }

    if (result.status === 'cancelled') {
      // Not an error — the customer just closed the popup. The booking
      // already exists (unpaid); let them retry rather than showing a
      // scary message or silently losing track of it.
      setStage('payment_incomplete')
      return
    }

    setError(result.message)
    setStage('payment_incomplete')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !taskerId || !location.state?.categoryId) return
    setError(null)

    try {
      const booking = await createBooking({
        customerId: user.id,
        taskerId,
        categoryId: location.state.categoryId,
        description,
        address,
        scheduledDate: date,
        scheduledTime: time,
        durationHours: hours,
        hourlyRate: rate,
      })
      setPendingBooking({ id: booking.id, total_price: booking.total_price })
      await runPayment(booking.id, booking.total_price)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your booking.')
      setStage('form')
    }
  }

  async function handleRetryPayment() {
    if (!pendingBooking) return
    setError(null)
    await runPayment(pendingBooking.id, pendingBooking.total_price)
  }

  if (stage === 'done') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-6 text-center">
        <div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success-soft text-2xl">
            ✓
          </div>
          <div className="mt-4 font-display text-xl font-bold">You're booked and paid</div>
          <p className="mt-2 text-sm text-ink-soft">
            {tasker?.full_name} will get your request and confirm shortly.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  if (stage === 'payment_incomplete') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-6 text-center">
        <div className="w-full max-w-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF4D9] text-2xl">
            ⏳
          </div>
          <div className="mt-4 font-display text-xl font-bold">Payment not completed</div>
          <p className="mt-2 text-sm text-ink-soft">
            {error
              ? error
              : "You closed the payment window. Your booking is saved — nothing is lost. You can try payment again whenever you're ready."}
          </p>
          <button
            onClick={handleRetryPayment}
            className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white"
          >
            Try payment again · ${pendingBooking?.total_price.toFixed(2)}
          </button>
          <button
            onClick={() => navigate('/bookings')}
            className="mt-3 w-full rounded-2xl border border-line bg-surface py-3.5 text-sm font-semibold text-ink-soft"
          >
            I'll pay later
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas px-6 py-8">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface shadow-sm"
          >
            <ChevronLeft size={18} className="text-primary" />
          </button>
          <div className="font-display text-lg font-bold">Book {tasker?.full_name ?? 'tasker'}</div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-3xl border border-line bg-surface p-5 shadow-sm">
          {error && <div className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</div>}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">
              What do you need done?
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">Address</label>
            {savedAddresses.length > 0 && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {savedAddresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAddress(a.address)}
                    className="flex-shrink-0 rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-bold text-ink-soft"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">Time</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">Hours</label>
            <input
              type="number"
              min={1}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="rounded-2xl bg-canvas p-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>{hours} hrs × ${rate}/hr</span>
              <span>${(hours * rate).toFixed(2)}</span>
            </div>
            <div className="mt-1 flex justify-between text-ink-soft">
              <span>Service fee</span>
              <span>$3.50</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-dashed border-line pt-2 font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={stage !== 'form'}
            className="w-full rounded-2xl bg-primary py-3.5 font-semibold text-white disabled:opacity-60"
          >
            {stage === 'form' && `Pay & confirm booking · $${total.toFixed(2)}`}
            {stage === 'redirecting' && 'Opening Paystack…'}
            {stage === 'verifying' && 'Verifying payment…'}
          </button>
        </form>
      </div>
    </div>
  )
}
