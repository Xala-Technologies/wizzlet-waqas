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
  authLikely?: boolean;
}

function classifyAdminError(message: string): { authLikely: boolean; summary: string } {
  const lower = message.toLowerCase();
  const authLikely =
    lower.includes('forbidden') ||
    lower.includes('not authenticated') ||
    lower.includes('unauthorized') ||
    lower.includes('admin required') ||
    lower.includes('not an admin');
  if (authLikely) {
    return {
      authLikely: true,
      summary:
        'This page needs a real platform-owner role in Convex. Sign in with admin@wizzlet.dev (local owner credentials on the sign-in page), or open the demo owner UI.',
    };
  }
  return {
    authLikely: false,
    summary:
      'An admin query failed while loading this page. Retry after Convex finishes syncing, or reload if the error persists.',
  };
}

/** Keeps admin shell usable when a Convex admin query rejects or crashes. */
export class AdminQueryBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    const message = error instanceof Error ? error.message : 'Query failed';
    const { authLikely } = classifyAdminError(message);
    return {
      hasError: true,
      message,
      authLikely,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AdminQueryBoundary]', error, info.componentStack);
  }

  private retry = () => {
    this.setState({ hasError: false, message: undefined, authLikely: undefined });
  };

  private hardReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { authLikely, summary } = classifyAdminError(this.state.message ?? '');
      return (
        <DashboardLayout type="admin">
          <div className="mx-auto max-w-md py-16 text-center space-y-4">
            <h1 className="text-xl font-semibold">Admin data unavailable</h1>
            <p className="text-sm text-muted-foreground">{summary}</p>
            {import.meta.env.DEV && this.state.message ? (
              <p className="text-xs font-mono text-destructive break-words text-left">{this.state.message}</p>
            ) : null}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button type="button" variant="outline" onClick={this.retry}>
                Retry
              </Button>
              <Button type="button" variant="outline" onClick={this.hardReload}>
                Reload
              </Button>
              {authLikely ? (
                <>
                  <Button asChild variant="outline">
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/demo/admin">Demo owner</Link>
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </DashboardLayout>
      );
    }
    return this.props.children;
  }
}
