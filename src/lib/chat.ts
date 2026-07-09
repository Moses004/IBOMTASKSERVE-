import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface ConversationRow {
  bookingId: string
  otherPartyName: string
  otherPartyAvatarUrl: string | null
  categoryName: string
  status: string
  lastMessage: string | null
  lastMessageAt: string | null
}

/** Every booking a customer is part of, with its most recent message (if any). */
export function useCustomerConversations(customerId: string | null) {
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!customerId) return
    setLoading(true)
    Promise.all([
      supabase
        .from('bookings')
        .select('id, status, categories ( name ), tasker_profiles ( profiles ( full_name, avatar_url ) )')
        .eq('customer_id', customerId)
        .neq('status', 'cancelled'),
      supabase
        .from('messages')
        .select('booking_id, content, created_at')
        .order('created_at', { ascending: false }),
    ]).then(([bookingsRes, messagesRes]) => {
      const lastMessageByBooking = new Map<string, { content: string; created_at: string }>()
      for (const m of messagesRes.data ?? []) {
        if (!lastMessageByBooking.has((m as any).booking_id)) {
          lastMessageByBooking.set((m as any).booking_id, m as any)
        }
      }
      setConversations(
        (bookingsRes.data ?? []).map((b: any) => ({
          bookingId: b.id,
          otherPartyName: b.tasker_profiles?.profiles?.full_name ?? 'Tasker',
          otherPartyAvatarUrl: b.tasker_profiles?.profiles?.avatar_url ?? null,
          categoryName: b.categories?.name ?? 'Service',
          status: b.status,
          lastMessage: lastMessageByBooking.get(b.id)?.content ?? null,
          lastMessageAt: lastMessageByBooking.get(b.id)?.created_at ?? null,
        }))
      )
      setLoading(false)
    })
  }, [customerId])

  return { conversations, loading }
}

/** Every booking a tasker is part of, with its most recent message (if any). */
export function useTaskerConversations(taskerId: string | null) {
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!taskerId) return
    setLoading(true)
    Promise.all([
      supabase
        .from('bookings')
        .select('id, status, categories ( name ), customer:customer_id ( full_name, avatar_url )')
        .eq('tasker_id', taskerId)
        .neq('status', 'cancelled'),
      supabase
        .from('messages')
        .select('booking_id, content, created_at')
        .order('created_at', { ascending: false }),
    ]).then(([bookingsRes, messagesRes]) => {
      const lastMessageByBooking = new Map<string, { content: string; created_at: string }>()
      for (const m of messagesRes.data ?? []) {
        if (!lastMessageByBooking.has((m as any).booking_id)) {
          lastMessageByBooking.set((m as any).booking_id, m as any)
        }
      }
      setConversations(
        (bookingsRes.data ?? []).map((b: any) => ({
          bookingId: b.id,
          otherPartyName: b.customer?.full_name ?? 'Customer',
          otherPartyAvatarUrl: b.customer?.avatar_url ?? null,
          categoryName: b.categories?.name ?? 'Service',
          status: b.status,
          lastMessage: lastMessageByBooking.get(b.id)?.content ?? null,
          lastMessageAt: lastMessageByBooking.get(b.id)?.created_at ?? null,
        }))
      )
      setLoading(false)
    })
  }, [taskerId])

  return { conversations, loading }
}

export interface MessageRow {
  id: string
  sender_id: string
  content: string
  created_at: string
}

/** Messages for one booking, kept live via Supabase Realtime. */
export function useMessageThread(bookingId: string | null) {
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookingId) return
    setLoading(true)

    supabase
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        setMessages(error ? [] : data)
        setLoading(false)
      })

    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as MessageRow])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookingId])

  return { messages, loading }
}

export async function sendMessage(bookingId: string, senderId: string, content: string) {
  const { error } = await supabase.from('messages').insert({ booking_id: bookingId, sender_id: senderId, content })
  if (error) throw error
}
