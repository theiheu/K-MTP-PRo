import React from 'react';

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error | null;
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
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-800">Đã xảy ra lỗi không mong muốn</h2>
            <p className="mt-2 text-sm text-gray-600">Vui lòng tải lại trang hoặc thử lại sau.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;


