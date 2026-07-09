import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ShieldCheck, History, ClipboardList, Wallet, Tag, Users } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const tabs = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/verifications', label: 'Verifications', icon: ShieldCheck, end: false },
  { to: '/admin/verification-history', label: 'History', icon: History, end: false },
  { to: '/admin/bookings', label: 'Bookings', icon: ClipboardList, end: false },
  { to: '/admin/payouts', label: 'Payouts', icon: Wallet, end: false },
  { to: '/admin/categories', label: 'Categories', icon: Tag, end: false },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-canvas">
      <div className="border-b border-line bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <div className="font-display text-lg font-bold">TaskServe Admin</div>
            <div className="text-xs text-ink-soft">{profile?.full_name}</div>
          </div>
          <button
            onClick={signOut}
            className="rounded-xl border border-line bg-canvas px-4 py-2 text-xs font-semibold text-ink-soft"
          >
            Sign out
          </button>
        </div>

        <div className="mx-auto mt-4 flex max-w-3xl gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-primary text-white' : 'bg-canvas text-ink-soft'
                }`
              }
            >
              <tab.icon size={15} />
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <Outlet />
      </div>
    </div>
  )
}
