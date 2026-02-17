'use client';

import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

// Function to report errors to a monitoring service
const reportError = (error: Error, errorInfo: ErrorInfo) => {
  // Report to centralized logging service
  logger.error('React error boundary caught error', error, {
    componentStack: errorInfo.componentStack
  });
};

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  compact?: boolean; // For smaller error UI in non-critical components
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    reportError(error, errorInfo);
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Compact fallback UI for non-critical components
      if (this.props.compact) {
        return (
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <div className="flex">
              <div className="shrink-0">
                <svg className="size-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading component</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>We encountered an error loading this section.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={this.handleReset}
                  >
                    Try again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Default fallback UI
      return (
        <div className="flex h-[70vh] w-full flex-col items-center justify-center p-4 text-center">
          <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-8"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>
          <p className="mb-4 max-w-md text-muted-foreground">
            We&apos;re sorry, but there was an error loading this page. Please try again or contact support if the problem persists.
          </p>
          <div className="space-x-2">
            <Button onClick={this.handleReset}>Try Again</Button>
            <Button variant="outline" onClick={this.handleReload}>
              Reload Page
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Go to Homepage
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-6 max-w-lg overflow-auto rounded-md bg-muted p-4 text-left text-sm">
              <p className="font-mono font-bold">{this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <pre className="mt-2 text-xs text-muted-foreground">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

// Functional component wrapper for global error handling
const ErrorBoundary = (props: Props) => {
  useEffect(() => {
    const isBrowserExtensionError = (filename?: string) => {
      if (!filename) return false;
      return (
        filename.startsWith('chrome-extension://') ||
        filename.startsWith('moz-extension://') ||
        filename.startsWith('safari-extension://')
      );
    };

    // Log global errors for monitoring, but do not render a full-page fallback.
    // Global errors can originate from browser extensions or unrelated scripts and
    // should not take down the whole React tree.
    const errorHandler = (event: ErrorEvent) => {
      if (isBrowserExtensionError(event.filename)) return;

      logger.error('Global uncaught error', event.error ?? event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
      // Do not call preventDefault() so Next.js/devtools can surface the error.
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection', event.reason);
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  return <ErrorBoundaryClass {...props} />;
};

export default ErrorBoundary;
