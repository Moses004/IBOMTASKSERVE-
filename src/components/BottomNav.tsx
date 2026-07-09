import { NavLink } from 'react-router-dom'
import { Home, ClipboardList, MessageCircle, Bookmark, User } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/bookings', label: 'Booking', icon: ClipboardList, end: false },
  { to: '/chat', label: 'Chat', icon: MessageCircle, end: false },
  { to: '/save', label: 'Save', icon: Bookmark, end: false },
  { to: '/account', label: 'Profile', icon: User, end: false },
]

export function BottomNav() {
  return (
    <div className="sticky bottom-0 z-10 border-t border-line bg-surface px-2 pb-6 pt-2.5">
      <div className="mx-auto flex max-w-md">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-1 text-[10px] font-bold ${
                isActive ? 'text-primary' : 'text-ink-faint'
              }`
            }
          >
            <tab.icon size={21} strokeWidth={2} />
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
