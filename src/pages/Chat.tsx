import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCustomerConversations } from '../lib/chat'
import { Layout } from '../components/Layout'
import { Avatar } from '../components/Avatar'

export default function Chat() {
  const { user } = useAuth()
  const { conversations, loading } = useCustomerConversations(user?.id ?? null)
  const navigate = useNavigate()

  return (
    <Layout>
      <div className="mx-auto max-w-md px-6 pt-6">
        <div className="font-display text-xl font-bold">Messages</div>

        {loading && <p className="mt-5 text-sm text-ink-soft">Loading…</p>}

        {!loading && conversations.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft">
              <MessageCircle size={26} className="text-primary" />
            </div>
            <p className="mt-4 max-w-[220px] text-sm text-ink-soft">
              Once you book a tasker, your conversation with them will show up here.
            </p>
          </div>
        )}

        <div className="mt-5 space-y-2.5">
          {conversations.map((c) => (
            <button
              key={c.bookingId}
              onClick={() => navigate(`/chat/${c.bookingId}`)}
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left shadow-sm"
            >
              <Avatar url={c.otherPartyAvatarUrl} name={c.otherPartyName} className="h-11 w-11 flex-shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{c.otherPartyName}</div>
                <div className="mt-0.5 truncate text-xs text-ink-soft">
                  {c.lastMessage ?? `${c.categoryName} · Tap to start the conversation`}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  )
}
