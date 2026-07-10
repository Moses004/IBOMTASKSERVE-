import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('React Error Boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-8 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-danger" />
          <div className="font-display text-xl font-bold text-danger">Something went wrong</div>
          <p className="mt-3 max-w-sm text-sm text-ink-soft">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 max-w-lg text-left">
              <summary className="cursor-pointer text-sm font-semibold text-ink-soft hover:text-ink">
                Error details (development only)
              </summary>
              <pre className="mt-3 overflow-auto rounded bg-surface p-3 text-xs text-danger">
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-2xl border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-deep"
          >
            Refresh page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}