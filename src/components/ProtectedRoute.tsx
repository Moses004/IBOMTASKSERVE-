import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../lib/types'

interface ProtectedRouteProps {
  children: ReactNode
  /** If provided, only these roles may view the route. Omit to just require login. */
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { session, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  // Session exists but the profiles row hasn't loaded yet (e.g. right after signup)
  if (!profile) return null

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
