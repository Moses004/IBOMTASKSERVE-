import { supabase } from './supabase'
import { payWithPaystack } from './paystack'

export interface CreateBookingParams {
  customerId: string
  taskerId: string
  categoryId: string
  description: string
  address: string
  scheduledDate: string // YYYY-MM-DD
  scheduledTime: string // HH:MM
  durationHours: number
  hourlyRate: number
  serviceFee?: number
}

export async function createBooking(params: CreateBookingParams) {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      customer_id: params.customerId,
      tasker_id: params.taskerId,
      category_id: params.categoryId,
      description: params.description,
      address: params.address,
      scheduled_date: params.scheduledDate,
      scheduled_time: params.scheduledTime,
      duration_hours: params.durationHours,
      hourly_rate: params.hourlyRate,
      service_fee: params.serviceFee ?? 3.5,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function verifyPaystackPayment(bookingId: string, reference: string) {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-paystack-payment`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingId, reference }),
    }
  )

  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? json.error ?? 'Payment verification failed')
  return json
}

export type PaymentAttemptResult =
  | { status: 'success' }
  | { status: 'cancelled' }
  | { status: 'failed'; message: string }

/**
 * Shared by both the initial booking flow and the "retry payment" action on
 * an already-created unpaid booking. Distinguishes "customer closed the
 * popup" (completely normal, not an error) from an actual failure — and
 * generates a fresh unique reference each attempt, since Paystack requires
 * a globally unique reference per transaction and reusing one tied only to
 * the booking id would collide on a second attempt.
 */
export async function attemptBookingPayment(
  bookingId: string,
  totalPrice: number,
  email: string
): Promise<PaymentAttemptResult> {
  try {
    const result = await payWithPaystack({
      email,
      amount: totalPrice,
      reference: `taskserve_${bookingId}_${Date.now()}`,
    })

    if (!result) return { status: 'cancelled' }

    await verifyPaystackPayment(bookingId, result.reference)
    return { status: 'success' }
  } catch (err) {
    return { status: 'failed', message: err instanceof Error ? err.message : 'Payment failed.' }
  }
}

async function callBookingRpc(fn: string, bookingId: string) {
  const { error } = await supabase.rpc(fn, { target_booking_id: bookingId })
  if (error) throw error
}

export const acceptBooking = (bookingId: string) => callBookingRpc('tasker_accept_booking', bookingId)
export const startBooking = (bookingId: string) => callBookingRpc('tasker_start_booking', bookingId)
export const completeBooking = (bookingId: string) => callBookingRpc('tasker_complete_booking', bookingId)
export const cancelBookingAsCustomer = (bookingId: string) => callBookingRpc('customer_cancel_booking', bookingId)

/**
 * Declining goes through an Edge Function rather than the plain RPC —
 * unlike accept/start/complete, this one needs to reach Paystack (with the
 * secret key) to automatically refund the customer if they'd already paid.
 */
export async function declineBooking(bookingId: string): Promise<{ refundInitiated: boolean; message?: string }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/decline-booking-with-refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookingId }),
  })

  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json.message ?? 'Could not decline booking')
  return { refundInitiated: json.refundInitiated, message: json.message }
}
