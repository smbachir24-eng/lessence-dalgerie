import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<any, any> {
  state = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl space-y-6 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h1 className="text-2xl font-serif italic">Oups! Quelque chose s'est mal passé.</h1>
            <p className="text-gray-500 text-sm">
              Une erreur inattendue est survenue. Veuillez rafraîchir la page ou réessayer plus tard.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <pre className="text-[10px] text-left bg-gray-100 p-4 rounded-xl overflow-auto max-h-40">
                {this.state.error?.message}
              </pre>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-black text-white rounded-2xl font-medium"
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
