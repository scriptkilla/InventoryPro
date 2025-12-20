import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
    errorInfo: undefined,
  };

  // This static method is called after an error has been thrown by a descendant component.
  // It receives the error that was thrown as a parameter and should return a value to update the state.
  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  // This method is called after an error has been thrown by a descendant component.
  // It receives the error and information about the component stack.
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      errorInfo: errorInfo,
    });
    // You could also log the error to an error reporting service here
    // logErrorToMyService(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="fixed inset-0 bg-red-950 text-white flex flex-col items-center justify-center p-8 text-center z-[9999]">
          <h1 className="text-3xl font-black mb-4">Oops! Something went wrong.</h1>
          <p className="text-xl mb-6">We're sorry for the inconvenience. Please try refreshing the page.</p>
          {this.state.error && (
            <div className="bg-red-900/50 p-6 rounded-xl max-w-xl overflow-auto custom-scrollbar text-left">
              <h2 className="text-lg font-bold mb-2">Error Details:</h2>
              <p className="font-mono text-sm break-all">
                {this.state.error.toString()}
              </p>
              {this.state.errorInfo?.componentStack && (
                <details className="mt-4">
                  <summary className="font-bold cursor-pointer">Component Stack</summary>
                  <pre className="mt-2 text-xs opacity-80">{this.state.errorInfo.componentStack}</pre>
                </details>
              )}
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-3 bg-white text-red-700 font-black rounded-xl shadow-lg hover:bg-gray-100 transition-colors"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
