import { useNavigate } from 'react-router-dom'
import { UserCog, Wallet, MapPin, ShieldCheck, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Layout } from '../components/Layout'
import { Avatar } from '../components/Avatar'

export default function Account() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()

  const menuItems = [
    { icon: UserCog, label: 'Edit profile', to: '/profile/edit' },
    { icon: Wallet, label: 'Payment history', to: '/account/payment-history' },
    { icon: MapPin, label: 'Saved addresses', to: '/account/addresses' },
    { icon: ShieldCheck, label: 'Trust & safety', to: '/account/trust-safety' },
  ]

  return (
    <Layout>
      <div className="mx-auto max-w-md px-6 pt-6">
        <div className="flex items-center gap-3.5">
          <Avatar url={profile?.avatar_url} name={profile?.full_name ?? '?'} className="h-[58px] w-[58px] rounded-2xl" />
          <div>
            <div className="font-display text-lg font-bold">{profile?.full_name}</div>
            <div className="text-xs text-ink-soft">{user?.email}</div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={() => navigate(item.to)}
              className={`flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold ${
                i < menuItems.length - 1 ? 'border-b border-line' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={17} className="text-primary" />
                {item.label}
              </div>
              <ChevronRight size={14} className="text-ink-faint" />
            </button>
          ))}
        </div>

        <button
          onClick={signOut}
          className="mt-6 w-full rounded-2xl border border-line bg-surface py-3.5 text-sm font-semibold text-ink-soft shadow-sm"
        >
          Sign out
        </button>
      </div>
    </Layout>
  )
}
