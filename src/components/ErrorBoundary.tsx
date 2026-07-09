import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in app tree:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-8 text-center">
          <div className="font-display text-xl font-bold text-danger">Something went wrong</div>
          <p className="mt-3 max-w-xs text-sm text-ink-soft">
            {this.state.error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
