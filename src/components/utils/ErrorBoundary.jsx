import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Er ging iets mis
            </h2>
            <p className="text-gray-600 mb-6">
              Geen zorgen, je gegevens zijn veilig. Probeer de pagina te verversen.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-green-500 hover:bg-green-600 w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Pagina verversen
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}