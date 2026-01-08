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
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-3xl shadow-soft p-8 text-center">
            <div className="mb-6">
              <span className="material-symbols-outlined text-red-500 dark:text-red-400 text-6xl">error</span>
            </div>
            <h1 className="text-2xl font-bold text-[#131d0c] dark:text-white mb-3 font-display">
              Er ging iets mis
            </h1>
            <p className="text-gray-600 dark:text-[#a1a1a1] mb-6">
              Er is een fout opgetreden bij het laden van deze pagina.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="bg-[#b4ff7a] hover:bg-[#a2f565] dark:bg-[#10b981] dark:hover:bg-[#34d399] text-[#131d0c] dark:text-black font-bold py-3 px-6 rounded-xl transition-colors shadow-sm"
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

