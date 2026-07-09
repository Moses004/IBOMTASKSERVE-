import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../lib/types'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState<Extract<UserRole, 'customer' | 'tasker'>>('customer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    const { error } = await signUp({ email, password, fullName, phone, role })
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }

    // Taskers continue into a short onboarding form before they can list services;
    // customers land straight in the app.
    navigate(role === 'tasker' ? '/tasker/onboarding' : '/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-display text-3xl font-bold text-primary">TaskServe</div>
          <p className="mt-2 text-sm text-ink-soft">Create your account</p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`rounded-2xl border-2 p-4 text-left transition ${
              role === 'customer' ? 'border-primary bg-primary-soft' : 'border-line bg-surface'
            }`}
          >
            <div className="font-display text-sm font-bold">I need a task done</div>
            <div className="mt-0.5 text-xs text-ink-soft">Book vetted local pros</div>
          </button>
          <button
            type="button"
            onClick={() => setRole('tasker')}
            className={`rounded-2xl border-2 p-4 text-left transition ${
              role === 'tasker' ? 'border-primary bg-primary-soft' : 'border-line bg-surface'
            }`}
          >
            <div className="font-display text-sm font-bold">I offer services</div>
            <div className="mt-0.5 text-xs text-ink-soft">Get hired for tasks</div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-line bg-surface p-6 shadow-sm">
          {error && (
            <div className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">
              Full name
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="Ada Okafor"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">
              Phone <span className="normal-case text-ink-faint">(optional)</span>
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="+234 801 234 5678"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-primary py-3.5 font-semibold text-white transition hover:bg-primary-deep disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : `Sign up as a ${role === 'tasker' ? 'Tasker' : 'Customer'}`}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
