import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../lib/types'
import { AlertTriangle } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  /** If provided, only these roles may view the route. Omit to just require login. */
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { session, profile, loading, authError, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  // Session exists but profile failed to load
  if (authError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-8 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-danger" />
        <div className="font-display text-xl font-bold text-danger">Unable to load profile</div>
        <p className="mt-3 max-w-sm text-sm text-ink-soft">
          {authError}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-deep"
          >
            Try again
          </button>
          <button
            onClick={signOut}
            className="rounded-2xl border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-canvas"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  // Session exists but the profiles row hasn't loaded yet (loading is false but profile is still null)
  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-8 text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <div className="font-display text-sm text-ink-soft">Setting up your account...</div>
      </div>
    )
  }

  if (profile.is_suspended) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-8 text-center">
        <div className="font-display text-xl font-bold text-danger">Account suspended</div>
        <p className="mt-3 max-w-xs text-sm text-ink-soft">
          Your account has been suspended. Contact support if you believe this is a mistake.
        </p>
        <button
          onClick={signOut}
          className="mt-6 rounded-2xl border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink-soft"
        >
          Sign out
        </button>
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}