import { Component, type ErrorInfo, type ReactNode } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

/** Keeps admin shell usable when a Convex admin query rejects the session. */
export class AdminQueryBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Query failed',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AdminQueryBoundary]', error, info.componentStack);
  }

  private retry = () => {
    this.setState({ hasError: false, message: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <DashboardLayout type="admin">
          <div className="mx-auto max-w-md py-16 text-center space-y-4">
            <h1 className="text-xl font-semibold">Admin data unavailable</h1>
            <p className="text-sm text-muted-foreground">
              This page needs a real platform-owner role in Convex. Sign in with{' '}
              <span className="font-medium text-foreground">admin@wizzlet.dev</span> (local owner
              credentials on the sign-in page), or open the demo owner UI.
            </p>
            {import.meta.env.DEV && this.state.message ? (
              <p className="text-xs font-mono text-destructive break-words">{this.state.message}</p>
            ) : null}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button type="button" variant="outline" onClick={this.retry}>
                Retry
              </Button>
              <Button asChild variant="outline">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/demo/admin">Demo owner</Link>
              </Button>
            </div>
          </div>
        </DashboardLayout>
      );
    }
    return this.props.children;
  }
}
