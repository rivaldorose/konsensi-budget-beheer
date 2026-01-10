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
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#1a2c26] rounded-[24px] shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36] p-8 text-center">
            <div className="mb-6">
              <span className="material-symbols-outlined text-[#EF4444] text-6xl">error</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-3">
              Er ging iets mis
            </h1>
            <p className="text-[#6B7280] dark:text-[#9CA3AF] mb-6">
              Er is een fout opgetreden bij het laden van deze pagina.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-[12px] transition-colors shadow-sm"
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
