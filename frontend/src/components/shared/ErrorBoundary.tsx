import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white">
          <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-100">Something went wrong</h2>
              <p className="text-sm text-slate-400">
                An unexpected application error occurred. Click below to reload the app.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-lg bg-slate-950 text-left border border-slate-800/80 font-mono text-xs text-red-400 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button 
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/login';
                }} 
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload / Back to Login
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
