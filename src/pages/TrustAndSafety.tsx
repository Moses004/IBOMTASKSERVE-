import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ShieldCheck, Lock, RotateCcw, Flag } from 'lucide-react'

const sections = [
  {
    icon: ShieldCheck,
    title: 'ID-verified taskers',
    body: 'Every tasker submits a government ID before they can list services. An admin reviews and approves each one — you only ever see taskers marked "Verified".',
  },
  {
    icon: Lock,
    title: 'Secure payments',
    body: "Payments are processed by Paystack. TaskServe never sees or stores your card details — Paystack handles that directly.",
  },
  {
    icon: RotateCcw,
    title: 'Refunds',
    body: "If something goes wrong with a booking, contact support. Approved refunds are issued back to your original payment method through Paystack.",
  },
  {
    icon: Flag,
    title: 'Report a problem',
    body: "If a tasker behaves inappropriately or a job goes badly, message our support team with the booking details and we'll look into it.",
  },
]

export default function TrustAndSafety() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-canvas px-6 pb-10 pt-6">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface shadow-sm"
          >
            <ChevronLeft size={18} className="text-primary" />
          </button>
          <div className="font-display text-lg font-bold">Trust & Safety</div>
        </div>

        <div className="mt-5 space-y-3">
          {sections.map((s) => (
            <div key={s.title} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft">
                  <s.icon size={17} className="text-primary" />
                </div>
                <div className="text-sm font-bold">{s.title}</div>
              </div>
              <p className="mt-2.5 text-sm text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
