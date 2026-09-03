import React from 'react';

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: React.ErrorInfo | null;
};

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ errorInfo: info });
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Đã xảy ra lỗi không mong muốn</h2>
            <p className="mt-2 text-sm text-gray-600">Vui lòng tải lại trang hoặc thử lại sau.</p>
            {this.state.error && (
              <div className="mt-4 text-left bg-red-50 p-4 rounded-md overflow-auto max-h-48 text-xs text-red-800 font-mono">
                {this.state.error.toString()}
                <br/>
                {this.state.errorInfo?.componentStack}
              </div>
            )}
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Tải lại trang
              </button>
            </div>
          </div>
        </div>);
    }
    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;




