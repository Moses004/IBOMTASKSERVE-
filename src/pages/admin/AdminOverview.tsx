import { Link } from 'react-router-dom'
import { Users, UserCog, ShieldCheck, ShieldAlert, ClipboardList, Wallet, AlertTriangle, Clock } from 'lucide-react'
import { useAdminOverviewStats } from '../../lib/adminQueries'

interface StatCardProps {
  icon: typeof Users
  label: string
  value: string | number
  tone?: 'default' | 'warning' | 'danger' | 'success'
  href?: string
}

const toneStyles: Record<string, string> = {
  default: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-[#FFF4D9] text-[#E0A100]',
  danger: 'bg-danger-soft text-danger',
}

function StatCard({ icon: Icon, label, value, tone = 'default', href }: StatCardProps) {
  const content = (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
        <Icon size={17} />
      </div>
      <div className="mt-3 font-display text-2xl font-bold">{value}</div>
      <div className="mt-0.5 text-xs text-ink-soft">{label}</div>
    </div>
  )
  return href ? <Link to={href}>{content}</Link> : content
}

export default function AdminOverview() {
  const { stats, loading } = useAdminOverviewStats()

  if (loading || !stats) {
    return <p className="text-sm text-ink-soft">Loading overview…</p>
  }

  return (
    <div>
      <div className="font-display text-xl font-bold">Overview</div>
      <p className="mt-1 text-sm text-ink-soft">A snapshot of the platform right now.</p>

      {stats.pendingVerifications > 0 && (
        <Link
          to="/admin/verifications"
          className="mt-5 flex items-center justify-between rounded-2xl bg-primary px-5 py-4 text-white shadow-sm"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Clock size={16} />
            {stats.pendingVerifications} tasker{stats.pendingVerifications === 1 ? '' : 's'} waiting on verification
          </div>
          <span className="text-xs font-bold underline">Review →</span>
        </Link>
      )}

      <div className="mt-6 text-xs font-bold uppercase tracking-wide text-primary">People</div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={stats.totalUsers} />
        <StatCard icon={Users} label="Customers" value={stats.customers} />
        <StatCard icon={UserCog} label="Taskers" value={stats.taskers} />
        <StatCard
          icon={ShieldCheck}
          label="Verified taskers"
          value={stats.verifiedTaskers}
          tone="success"
        />
      </div>

      <div className="mt-6 text-xs font-bold uppercase tracking-wide text-primary">Verification queue</div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Pending review"
          value={stats.pendingVerifications}
          tone={stats.pendingVerifications > 0 ? 'warning' : 'default'}
          href="/admin/verifications"
        />
        <StatCard icon={ShieldAlert} label="Rejected" value={stats.rejectedTaskers} tone="danger" />
      </div>

      <div className="mt-6 text-xs font-bold uppercase tracking-wide text-primary">Bookings & payments</div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total bookings" value={stats.totalBookings} href="/admin/bookings" />
        <StatCard
          icon={Wallet}
          label="Paid revenue"
          value={`$${stats.paidRevenue.toFixed(2)}`}
          tone="success"
          href="/admin/bookings"
        />
        <StatCard
          icon={AlertTriangle}
          label="Failed payments"
          value={stats.failedPayments}
          tone={stats.failedPayments > 0 ? 'danger' : 'default'}
          href="/admin/bookings"
        />
        <StatCard
          icon={Clock}
          label="Unpaid bookings"
          value={stats.unpaidBookings}
          tone={stats.unpaidBookings > 0 ? 'warning' : 'default'}
          href="/admin/bookings"
        />
      </div>
    </div>
  )
}
