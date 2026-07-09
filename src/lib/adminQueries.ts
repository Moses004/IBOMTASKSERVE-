import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface AdminOverviewStats {
  totalUsers: number
  customers: number
  taskers: number
  pendingVerifications: number
  verifiedTaskers: number
  rejectedTaskers: number
  totalBookings: number
  paidRevenue: number
  failedPayments: number
  unpaidBookings: number
}

async function count(table: string, filters: Record<string, string> = {}) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })
  for (const [col, val] of Object.entries(filters)) {
    query = query.eq(col, val)
  }
  const { count: c, error } = await query
  if (error) {
    console.error(`count(${table}) failed`, error)
    return 0
  }
  return c ?? 0
}

export function useAdminOverviewStats() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)

      const [
        totalUsers,
        customers,
        taskers,
        pendingVerifications,
        verifiedTaskers,
        rejectedTaskers,
        totalBookings,
        failedPayments,
        unpaidBookings,
        paidBookingsRes,
      ] = await Promise.all([
        count('profiles'),
        count('profiles', { role: 'customer' }),
        count('profiles', { role: 'tasker' }),
        count('tasker_profiles', { verification_status: 'pending' }),
        count('tasker_profiles', { verification_status: 'verified' }),
        count('tasker_profiles', { verification_status: 'rejected' }),
        count('bookings'),
        count('bookings', { payment_status: 'failed' }),
        count('bookings', { payment_status: 'unpaid' }),
        supabase.from('bookings').select('total_price').eq('payment_status', 'paid'),
      ])

      const paidRevenue = (paidBookingsRes.data ?? []).reduce(
        (sum, row: any) => sum + Number(row.total_price ?? 0),
        0
      )

      if (!cancelled) {
        setStats({
          totalUsers,
          customers,
          taskers,
          pendingVerifications,
          verifiedTaskers,
          rejectedTaskers,
          totalBookings,
          paidRevenue,
          failedPayments,
          unpaidBookings,
        })
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { stats, loading }
}

export interface VerificationAuditRow {
  id: string
  tasker_name: string
  admin_name: string
  status: string
  reason: string | null
  created_at: string
}

const PAGE_SIZE = 10

export function useVerificationHistory(page: number = 0) {
  const [rows, setRows] = useState<VerificationAuditRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    supabase
      .from('verification_audit_log')
      .select(
        `id, status, reason, created_at,
         tasker:tasker_id ( profiles ( full_name ) ),
         admin:admin_id ( full_name )`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to)
      .then(({ data, error, count }) => {
        if (error) {
          console.error(error)
          setRows([])
          setLoading(false)
          return
        }
        setTotalCount(count ?? 0)
        setRows(
          (data ?? []).map((r: any) => ({
            id: r.id,
            tasker_name: r.tasker?.profiles?.full_name ?? 'Unknown tasker',
            admin_name: r.admin?.full_name ?? 'Unknown admin',
            status: r.status,
            reason: r.reason,
            created_at: r.created_at,
          }))
        )
        setLoading(false)
      })
  }, [page])

  return { rows, loading, totalCount, pageSize: PAGE_SIZE }
}

export interface AdminBookingRow {
  id: string
  customer_name: string
  tasker_name: string
  category_name: string
  scheduled_date: string
  scheduled_time: string
  status: string
  payment_status: string
  total_price: number
  payment_reference: string | null
}

export function useAdminBookings(page: number = 0, paymentStatusFilter: string = 'all') {
  const [bookings, setBookings] = useState<AdminBookingRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    let query = supabase
      .from('bookings')
      .select(
        `id, status, payment_status, scheduled_date, scheduled_time, total_price, payment_reference,
         customer:customer_id ( full_name ),
         categories ( name ),
         tasker_profiles ( profiles ( full_name ) )`,
        { count: 'exact' }
      )
      .order('scheduled_date', { ascending: false })
      .range(from, to)

    if (paymentStatusFilter !== 'all') {
      query = query.eq('payment_status', paymentStatusFilter)
    }

    query.then(({ data, error, count }) => {
      if (error) {
        console.error(error)
        setBookings([])
        setLoading(false)
        return
      }
      setTotalCount(count ?? 0)
      setBookings(
        (data ?? []).map((row: any) => ({
          id: row.id,
          customer_name: row.customer?.full_name ?? 'Unknown',
          tasker_name: row.tasker_profiles?.profiles?.full_name ?? 'Unknown',
          category_name: row.categories?.name ?? 'Service',
          scheduled_date: row.scheduled_date,
          scheduled_time: row.scheduled_time,
          status: row.status,
          payment_status: row.payment_status,
          total_price: row.total_price,
          payment_reference: row.payment_reference,
        }))
      )
      setLoading(false)
    })
  }, [page, paymentStatusFilter, refreshKey])

  return { bookings, loading, totalCount, pageSize: PAGE_SIZE, refresh: () => setRefreshKey((k) => k + 1) }
}

export async function adminRefundBooking(bookingId: string) {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/refund-paystack-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookingId }),
  })

  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json.message ?? 'Refund failed')
  return json
}

export async function adminCancelBooking(bookingId: string) {
  const { error } = await supabase.rpc('admin_cancel_booking', { target_booking_id: bookingId })
  if (error) throw error
}

export interface TaskerBalanceRow {
  tasker_id: string
  full_name: string
  hasPayoutAccount: boolean
  availableBalance: number
}

export function useAllTaskerBalances() {
  const [rows, setRows] = useState<TaskerBalanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.from('tasker_profiles').select('id, profiles ( full_name )').eq('verification_status', 'verified'),
      supabase.from('tasker_payout_accounts').select('tasker_id'),
      supabase.from('bookings').select('tasker_id, hourly_rate, duration_hours').eq('status', 'completed').eq('payment_status', 'paid'),
      supabase.from('payouts').select('tasker_id, amount').in('status', ['pending', 'success']),
    ]).then(([taskersRes, accountsRes, bookingsRes, payoutsRes]) => {
      const accountSet = new Set((accountsRes.data ?? []).map((a: any) => a.tasker_id))

      const earningsByTasker = new Map<string, number>()
      for (const b of bookingsRes.data ?? []) {
        const prior = earningsByTasker.get((b as any).tasker_id) ?? 0
        earningsByTasker.set((b as any).tasker_id, prior + Number((b as any).hourly_rate) * Number((b as any).duration_hours))
      }

      const paidByTasker = new Map<string, number>()
      for (const p of payoutsRes.data ?? []) {
        const prior = paidByTasker.get((p as any).tasker_id) ?? 0
        paidByTasker.set((p as any).tasker_id, prior + Number((p as any).amount))
      }

      setRows(
        (taskersRes.data ?? []).map((t: any) => ({
          tasker_id: t.id,
          full_name: t.profiles?.full_name ?? 'Unknown',
          hasPayoutAccount: accountSet.has(t.id),
          availableBalance: (earningsByTasker.get(t.id) ?? 0) - (paidByTasker.get(t.id) ?? 0),
        }))
      )
      setLoading(false)
    })
  }, [refreshKey])

  return { rows, loading, refresh: () => setRefreshKey((k) => k + 1) }
}

export interface AdminPayoutRow {
  id: string
  tasker_name: string
  amount: number
  status: string
  created_at: string
  failure_reason: string | null
}

export function useAllPayouts(page: number = 0) {
  const [rows, setRows] = useState<AdminPayoutRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    supabase
      .from('payouts')
      .select('id, amount, status, created_at, failure_reason, tasker_profiles ( profiles ( full_name ) )', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(from, to)
      .then(({ data, error, count }) => {
        if (error) {
          console.error(error)
          setRows([])
          setLoading(false)
          return
        }
        setTotalCount(count ?? 0)
        setRows(
          (data ?? []).map((r: any) => ({
            id: r.id,
            tasker_name: r.tasker_profiles?.profiles?.full_name ?? 'Unknown',
            amount: r.amount,
            status: r.status,
            created_at: r.created_at,
            failure_reason: r.failure_reason,
          }))
        )
        setLoading(false)
      })
  }, [page, refreshKey])

  return { rows, loading, totalCount, pageSize: PAGE_SIZE, refresh: () => setRefreshKey((k) => k + 1) }
}

export interface AdminCategoryRow {
  id: string
  name: string
  slug: string
  icon: string | null
  is_active: boolean
}

export function useAllCategories() {
  const [categories, setCategories] = useState<AdminCategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('categories')
      .select('id, name, slug, icon, is_active')
      .order('name')
      .then(({ data, error }) => {
        setCategories(error ? [] : data)
        setLoading(false)
      })
  }, [refreshKey])

  return { categories, loading, refresh: () => setRefreshKey((k) => k + 1) }
}

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function createCategory(name: string, icon: string) {
  const { error } = await supabase.from('categories').insert({ name, slug: slugify(name), icon })
  if (error) throw error
}

export async function updateCategory(id: string, name: string, icon: string) {
  const { error } = await supabase.from('categories').update({ name, icon }).eq('id', id)
  if (error) throw error
}

export async function setCategoryActive(id: string, isActive: boolean) {
  const { error } = await supabase.from('categories').update({ is_active: isActive }).eq('id', id)
  if (error) throw error
}

export interface AdminUserRow {
  id: string
  full_name: string
  phone: string | null
  city: string | null
  role: string
  is_suspended: boolean
  created_at: string
}

export function useAllUsers(page: number = 0, roleFilter: string = 'all', search: string = '') {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    let query = supabase
      .from('profiles')
      .select('id, full_name, phone, city, role, is_suspended, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (roleFilter !== 'all') query = query.eq('role', roleFilter)
    if (search.trim()) query = query.ilike('full_name', `%${search.trim()}%`)

    query.then(({ data, error, count }) => {
      setUsers(error ? [] : data)
      setTotalCount(count ?? 0)
      setLoading(false)
    })
  }, [page, roleFilter, search, refreshKey])

  return { users, loading, totalCount, pageSize: PAGE_SIZE, refresh: () => setRefreshKey((k) => k + 1) }
}

export async function setUserSuspended(userId: string, suspended: boolean) {
  const { error } = await supabase.rpc('admin_set_user_suspended', {
    target_user_id: userId,
    suspended,
  })
  if (error) throw error
}
