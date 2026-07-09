import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
}

export interface TaskerListing {
  tasker_id: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  avg_rating: number
  total_jobs: number
  hourly_rate: number
  category_id: string
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name, slug, icon')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setCategories(data ?? [])
        setLoading(false)
      })
  }, [])

  return { categories, loading }
}

/** Taskers offering a given category, joined from tasker_services + tasker_profiles + profiles. */
export function useTaskersByCategory(categoryId: string | null) {
  const [taskers, setTaskers] = useState<TaskerListing[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!categoryId) {
      setTaskers([])
      return
    }
    setLoading(true)
    supabase
      .from('tasker_services')
      .select(
        `hourly_rate, category_id, tasker_id,
         tasker_profiles!inner ( avg_rating, total_jobs, bio, verification_status,
           profiles!inner ( full_name, avatar_url ) )`
      )
      .eq('category_id', categoryId)
      .eq('tasker_profiles.verification_status', 'verified')
      .order('hourly_rate', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error(error)
          setTaskers([])
          setLoading(false)
          return
        }
        setTaskers(
          (data ?? []).map((row: any) => ({
            tasker_id: row.tasker_id,
            full_name: row.tasker_profiles.profiles.full_name,
            avatar_url: row.tasker_profiles.profiles.avatar_url,
            bio: row.tasker_profiles.bio,
            avg_rating: row.tasker_profiles.avg_rating,
            total_jobs: row.tasker_profiles.total_jobs,
            hourly_rate: row.hourly_rate,
            category_id: row.category_id,
          }))
        )
        setLoading(false)
      })
  }, [categoryId])

  return { taskers, loading }
}

export interface SavedTasker {
  tasker_id: string
  full_name: string
  avatar_url: string | null
  avg_rating: number
}

export function useSavedTaskers(customerId: string | null) {
  const [saved, setSaved] = useState<SavedTasker[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!customerId) {
      setSaved([])
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('saved_taskers')
      .select(
        `tasker_id, tasker_profiles!inner ( avg_rating, profiles!inner ( full_name, avatar_url ) )`
      )
      .eq('customer_id', customerId)
      .then(({ data, error }) => {
        if (error) {
          console.error(error)
          setSaved([])
          setLoading(false)
          return
        }
        setSaved(
          (data ?? []).map((row: any) => ({
            tasker_id: row.tasker_id,
            full_name: row.tasker_profiles.profiles.full_name,
            avatar_url: row.tasker_profiles.profiles.avatar_url,
            avg_rating: row.tasker_profiles.avg_rating,
          }))
        )
        setLoading(false)
      })
  }, [customerId, refreshKey])

  return { saved, loading, refresh: () => setRefreshKey((k) => k + 1) }
}

export async function isTaskerSaved(customerId: string, taskerId: string) {
  const { data } = await supabase
    .from('saved_taskers')
    .select('tasker_id')
    .eq('customer_id', customerId)
    .eq('tasker_id', taskerId)
    .maybeSingle()
  return !!data
}

export async function toggleSaveTasker(customerId: string, taskerId: string, currentlySaved: boolean) {
  if (currentlySaved) {
    await supabase.from('saved_taskers').delete().eq('customer_id', customerId).eq('tasker_id', taskerId)
  } else {
    await supabase.from('saved_taskers').insert({ customer_id: customerId, tasker_id: taskerId })
  }
}

export interface BookingRow {
  id: string
  status: string
  payment_status: string
  scheduled_date: string
  scheduled_time: string
  total_price: number
  tasker_id: string
  tasker_name: string
  tasker_avatar_url: string | null
  category_name: string
}

export function useCustomerBookings(customerId: string | null) {
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!customerId) {
      setBookings([])
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('bookings')
      .select(
        `id, status, payment_status, scheduled_date, scheduled_time, total_price, tasker_id,
         categories ( name ),
         tasker_profiles ( profiles ( full_name, avatar_url ) )`
      )
      .eq('customer_id', customerId)
      .order('scheduled_date', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error(error)
          setBookings([])
          setLoading(false)
          return
        }
        setBookings(
          (data ?? []).map((row: any) => ({
            id: row.id,
            status: row.status,
            payment_status: row.payment_status,
            scheduled_date: row.scheduled_date,
            scheduled_time: row.scheduled_time,
            total_price: row.total_price,
            tasker_id: row.tasker_id,
            tasker_name: row.tasker_profiles?.profiles?.full_name ?? 'Tasker',
            tasker_avatar_url: row.tasker_profiles?.profiles?.avatar_url ?? null,
            category_name: row.categories?.name ?? 'Service',
          }))
        )
        setLoading(false)
      })
  }, [customerId, refreshKey])

  return { bookings, loading, refresh: () => setRefreshKey((k) => k + 1) }
}

export interface TaskerDetail {
  id: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  years_experience: number
  avg_rating: number
  total_jobs: number
  services: { category_id: string; category_name: string; hourly_rate: number }[]
}

export function useTaskerDetail(taskerId: string | null) {
  const [tasker, setTasker] = useState<TaskerDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!taskerId) return
    setLoading(true)
    Promise.all([
      supabase
        .from('tasker_profiles')
        .select('id, bio, years_experience, avg_rating, total_jobs, profiles ( full_name, avatar_url )')
        .eq('id', taskerId)
        .single(),
      supabase
        .from('tasker_services')
        .select('category_id, hourly_rate, categories ( name )')
        .eq('tasker_id', taskerId),
    ]).then(([profileRes, servicesRes]) => {
      if (profileRes.error || !profileRes.data) {
        setTasker(null)
        setLoading(false)
        return
      }
      const p: any = profileRes.data
      setTasker({
        id: p.id,
        full_name: p.profiles.full_name,
        avatar_url: p.profiles.avatar_url,
        bio: p.bio,
        years_experience: p.years_experience,
        avg_rating: p.avg_rating,
        total_jobs: p.total_jobs,
        services: (servicesRes.data ?? []).map((s: any) => ({
          category_id: s.category_id,
          category_name: s.categories?.name ?? 'Service',
          hourly_rate: s.hourly_rate,
        })),
      })
      setLoading(false)
    })
  }, [taskerId])

  return { tasker, loading }
}

export interface ReviewRow {
  id: string
  rating: number
  comment: string | null
  customer_name: string
  created_at: string
}

export function useTaskerReviews(taskerId: string | null) {
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!taskerId) return
    setLoading(true)
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, profiles ( full_name )')
      .eq('tasker_id', taskerId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setReviews([])
          setLoading(false)
          return
        }
        setReviews(
          (data ?? []).map((r: any) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            customer_name: r.profiles?.full_name ?? 'Customer',
            created_at: r.created_at,
          }))
        )
        setLoading(false)
      })
  }, [taskerId])

  return { reviews, loading }
}

export interface MyService {
  category_id: string
  hourly_rate: number
}

export function useMyServices(taskerId: string | null) {
  const [services, setServices] = useState<MyService[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!taskerId) {
      setServices([])
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('tasker_services')
      .select('category_id, hourly_rate')
      .eq('tasker_id', taskerId)
      .then(({ data, error }) => {
        if (error) {
          console.error(error)
          setServices([])
        } else {
          setServices(data ?? [])
        }
        setLoading(false)
      })
  }, [taskerId, refreshKey])

  return { services, loading, refresh: () => setRefreshKey((k) => k + 1) }
}

export async function upsertTaskerService(taskerId: string, categoryId: string, hourlyRate: number) {
  const { error } = await supabase
    .from('tasker_services')
    .upsert({ tasker_id: taskerId, category_id: categoryId, hourly_rate: hourlyRate })
  if (error) throw error
}

export async function removeTaskerService(taskerId: string, categoryId: string) {
  const { error } = await supabase
    .from('tasker_services')
    .delete()
    .eq('tasker_id', taskerId)
    .eq('category_id', categoryId)
  if (error) throw error
}

export async function setTaskerAvailability(taskerId: string, isAvailable: boolean) {
  const { error } = await supabase
    .from('tasker_profiles')
    .update({ is_available: isAvailable })
    .eq('id', taskerId)
  if (error) throw error
}

export function useMyTaskerProfile(taskerId: string | null) {
  const [data, setData] = useState<{
    verification_status: string
    is_available: boolean
    rejection_reason: string | null
    bio: string | null
    years_experience: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!taskerId) return
    setLoading(true)
    supabase
      .from('tasker_profiles')
      .select('verification_status, is_available, rejection_reason, bio, years_experience')
      .eq('id', taskerId)
      .single()
      .then(({ data, error }) => {
        setData(error ? null : data)
        setLoading(false)
      })
  }, [taskerId])

  return { data, loading }
}

export async function resubmitVerification(
  taskerId: string,
  bio: string,
  idDocumentPath: string
) {
  const { error: profileError } = await supabase.from('tasker_profiles').update({ bio }).eq('id', taskerId)
  if (profileError) throw profileError

  const { error: docError } = await supabase
    .from('tasker_documents')
    .upsert({ tasker_id: taskerId, id_document_path: idDocumentPath })
  if (docError) throw docError

  const { error: rpcError } = await supabase.rpc('tasker_resubmit_verification', {
    target_tasker_id: taskerId,
  })
  if (rpcError) throw rpcError
}

export interface TaskerBookingRow {
  id: string
  status: string
  payment_status: string
  scheduled_date: string
  scheduled_time: string
  duration_hours: number
  total_price: number
  description: string
  address: string | null
  customer_name: string
  customer_avatar_url: string | null
  category_name: string
}

export function useTaskerBookings(taskerId: string | null) {
  const [bookings, setBookings] = useState<TaskerBookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!taskerId) {
      setBookings([])
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('bookings')
      .select(
        `id, status, payment_status, scheduled_date, scheduled_time, duration_hours,
         total_price, description, address,
         customer:customer_id ( full_name, avatar_url ),
         categories ( name )`
      )
      .eq('tasker_id', taskerId)
      .order('scheduled_date', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error(error)
          setBookings([])
          setLoading(false)
          return
        }
        setBookings(
          (data ?? []).map((row: any) => ({
            id: row.id,
            status: row.status,
            payment_status: row.payment_status,
            scheduled_date: row.scheduled_date,
            scheduled_time: row.scheduled_time,
            duration_hours: row.duration_hours,
            total_price: row.total_price,
            description: row.description,
            address: row.address,
            customer_name: row.customer?.full_name ?? 'Customer',
            customer_avatar_url: row.customer?.avatar_url ?? null,
            category_name: row.categories?.name ?? 'Service',
          }))
        )
        setLoading(false)
      })
  }, [taskerId, refreshKey])

  return { bookings, loading, refresh: () => setRefreshKey((k) => k + 1) }
}

export interface PayoutAccount {
  bank_name: string
  account_number: string
  account_name: string
}

export function useMyPayoutAccount(taskerId: string | null) {
  const [account, setAccount] = useState<PayoutAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!taskerId) {
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('tasker_payout_accounts')
      .select('bank_name, account_number, account_name')
      .eq('tasker_id', taskerId)
      .maybeSingle()
      .then(({ data, error }) => {
        setAccount(error ? null : data)
        setLoading(false)
      })
  }, [taskerId, refreshKey])

  return { account, loading, refresh: () => setRefreshKey((k) => k + 1) }
}

export interface PayoutRow {
  id: string
  amount: number
  status: string
  created_at: string
  completed_at: string | null
  failure_reason: string | null
}

export function useMyPayouts(taskerId: string | null) {
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!taskerId) {
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('payouts')
      .select('id, amount, status, created_at, completed_at, failure_reason')
      .eq('tasker_id', taskerId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        setPayouts(error ? [] : data)
        setLoading(false)
      })
  }, [taskerId, refreshKey])

  return { payouts, loading, refresh: () => setRefreshKey((k) => k + 1) }
}

/** Available balance = completed+paid earnings (hourly_rate × duration_hours, NOT total_price) minus already-paid-or-pending payouts. */
export function useMyEarnings(taskerId: string | null) {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!taskerId) {
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([
      supabase
        .from('bookings')
        .select('hourly_rate, duration_hours')
        .eq('tasker_id', taskerId)
        .eq('status', 'completed')
        .eq('payment_status', 'paid'),
      supabase.from('payouts').select('amount').eq('tasker_id', taskerId).in('status', ['pending', 'success']),
    ]).then(([bookingsRes, payoutsRes]) => {
      const gross = (bookingsRes.data ?? []).reduce(
        (sum, b: any) => sum + Number(b.hourly_rate) * Number(b.duration_hours),
        0
      )
      const paidOrPending = (payoutsRes.data ?? []).reduce((sum, p: any) => sum + Number(p.amount), 0)
      setBalance(gross - paidOrPending)
      setLoading(false)
    })
  }, [taskerId, refreshKey])

  return { balance, loading, refresh: () => setRefreshKey((k) => k + 1) }
}

export function useMyReviewedBookingIds(customerId: string | null) {
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!customerId) return
    supabase
      .from('reviews')
      .select('booking_id')
      .eq('customer_id', customerId)
      .then(({ data, error }) => {
        if (error) return
        setIds(new Set((data ?? []).map((r: any) => r.booking_id)))
      })
  }, [customerId, refreshKey])

  return { reviewedIds: ids, refresh: () => setRefreshKey((k) => k + 1) }
}

export async function submitReview(
  bookingId: string,
  customerId: string,
  taskerId: string,
  rating: number,
  comment: string
) {
  const { error } = await supabase
    .from('reviews')
    .insert({ booking_id: bookingId, customer_id: customerId, tasker_id: taskerId, rating, comment: comment || null })
  if (error) throw error
}

export async function updateTaskerBio(taskerId: string, bio: string, yearsExperience: number) {
  const { error } = await supabase
    .from('tasker_profiles')
    .update({ bio, years_experience: yearsExperience })
    .eq('id', taskerId)
  if (error) throw error
}

export interface AddressRow {
  id: string
  label: string
  address: string
}

export function useSavedAddresses(customerId: string | null) {
  const [addresses, setAddresses] = useState<AddressRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!customerId) return
    setLoading(true)
    supabase
      .from('customer_addresses')
      .select('id, label, address')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        setAddresses(error ? [] : data)
        setLoading(false)
      })
  }, [customerId, refreshKey])

  return { addresses, loading, refresh: () => setRefreshKey((k) => k + 1) }
}

export async function addSavedAddress(customerId: string, label: string, address: string) {
  const { error } = await supabase.from('customer_addresses').insert({ customer_id: customerId, label, address })
  if (error) throw error
}

export async function deleteSavedAddress(id: string) {
  const { error } = await supabase.from('customer_addresses').delete().eq('id', id)
  if (error) throw error
}

export interface TaskerSearchResult {
  id: string
  full_name: string
  avatar_url: string | null
}

export function useTaskerSearch(query: string) {
  const [results, setResults] = useState<TaskerSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    const handle = setTimeout(() => {
      supabase
        .from('profiles')
        .select('id, full_name, avatar_url, tasker_profiles!inner ( verification_status )')
        .eq('role', 'tasker')
        .eq('tasker_profiles.verification_status', 'verified')
        .ilike('full_name', `%${query}%`)
        .limit(6)
        .then(({ data, error }) => {
          setResults(
            error
              ? []
              : (data ?? []).map((r: any) => ({
                  id: r.id,
                  full_name: r.full_name,
                  avatar_url: r.avatar_url,
                }))
          )
          setLoading(false)
        })
    }, 300) // debounce so we're not firing a query on every keystroke

    return () => clearTimeout(handle)
  }, [query])

  return { results, loading }
}
