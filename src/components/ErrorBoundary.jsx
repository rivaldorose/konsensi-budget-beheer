import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to debug endpoint
    try {
      fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'ErrorBoundary.jsx:16',
          message: 'Error caught by boundary',
          data: {
            errorName: error?.name,
            errorMessage: error?.message,
            errorStack: error?.stack,
            componentStack: errorInfo?.componentStack
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A'
        })
      }).catch(() => {});
    } catch (e) {}

    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <span className="material-symbols-outlined text-red-500 text-6xl">error</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Er ging iets mis
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Er is een fout opgetreden bij het laden van deze pagina.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Pagina opnieuw laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

