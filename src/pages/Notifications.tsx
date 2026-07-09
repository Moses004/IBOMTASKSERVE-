import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Bell } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../lib/notifications'

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id ?? null)

  function handleTap(n: (typeof notifications)[number]) {
    if (!n.is_read) markAsRead(n.id)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="min-h-screen bg-canvas px-6 pb-10 pt-6">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface shadow-sm"
            >
              <ChevronLeft size={18} className="text-primary" />
            </button>
            <div className="font-display text-lg font-bold">Notifications</div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-xs font-bold text-primary">
              Mark all read
            </button>
          )}
        </div>

        <div className="mt-5 space-y-2.5">
          {loading && <p className="text-sm text-ink-soft">Loading…</p>}

          {!loading && notifications.length === 0 && (
            <div className="mt-16 flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft">
                <Bell size={26} className="text-primary" />
              </div>
              <p className="mt-4 max-w-[220px] text-sm text-ink-soft">
                Booking updates, messages, and account activity will show up here.
              </p>
            </div>
          )}

          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleTap(n)}
              className={`w-full rounded-2xl border p-4 text-left shadow-sm ${
                n.is_read ? 'border-line bg-surface' : 'border-primary bg-primary-soft/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-bold">{n.title}</div>
                {!n.is_read && <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
              </div>
              {n.body && <p className="mt-1 text-xs text-ink-soft">{n.body}</p>}
              <div className="mt-1.5 text-[10px] text-ink-faint">{timeAgo(n.created_at)}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
