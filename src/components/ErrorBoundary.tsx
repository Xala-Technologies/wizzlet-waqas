import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

/**
 * Catches render errors so a single broken page does not blank the entire SPA.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unexpected error',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ hasError: false, message: undefined });
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted-foreground max-w-md">
            An unexpected error occurred. You can return home and try again.
          </p>
          {import.meta.env.DEV && this.state.message ? (
            <p className="text-xs text-destructive max-w-lg font-mono break-words">{this.state.message}</p>
          ) : null}
          <Button type="button" onClick={this.handleReload}>
            Go home
          </Button>
        </main>
      );
    }

    return this.props.children;
  }
}
