import { Link, useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../lib/notifications'

export default function Dashboard() {
  const { profile, user, signOut } = useAuth()
  const { unreadCount } = useNotifications(user?.id ?? null)
  const navigate = useNavigate()

  if (!profile) return null

  const roleLabel = { customer: 'Customer', tasker: 'Tasker', admin: 'Admin' }[profile.role]

  return (
    <div className="min-h-screen bg-canvas px-6 py-10">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-xl font-bold">Hi, {profile.full_name.split(' ')[0]}</div>
            <div className="mt-1 inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              {roleLabel}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/notifications')}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface"
            >
              <Bell size={17} className="text-primary" />
              {unreadCount > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />}
            </button>
            <button
              onClick={signOut}
              className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink-soft"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-line bg-surface p-6 shadow-sm">
          {profile.role === 'tasker' && (
            <div>
              <p className="text-sm text-ink-soft">
                View incoming job requests, manage your services and rates, and set your availability.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/tasker/jobs"
                  className="inline-block rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
                >
                  View your jobs
                </Link>
                <Link
                  to="/tasker/services"
                  className="inline-block rounded-2xl border border-line bg-canvas px-5 py-2.5 text-sm font-semibold text-ink-soft"
                >
                  Manage your services
                </Link>
                <Link
                  to="/tasker/payouts"
                  className="inline-block rounded-2xl border border-line bg-canvas px-5 py-2.5 text-sm font-semibold text-ink-soft"
                >
                  Payouts
                </Link>
                <Link
                  to="/tasker/messages"
                  className="inline-block rounded-2xl border border-line bg-canvas px-5 py-2.5 text-sm font-semibold text-ink-soft"
                >
                  Messages
                </Link>
                <Link
                  to="/profile/edit"
                  className="inline-block rounded-2xl border border-line bg-canvas px-5 py-2.5 text-sm font-semibold text-ink-soft"
                >
                  Edit profile
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
