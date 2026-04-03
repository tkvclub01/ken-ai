'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Log to error reporting service (e.g., Sentry)
    // logErrorToService(error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
    toast.success('Retrying...')
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] w-full items-center justify-center rounded-lg border bg-card p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Something went wrong</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
            <Button onClick={this.handleRetry} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
