import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary Component
 * Catches React errors and displays a user-friendly fallback UI
 * Helps prevent white screen of death when components crash
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console for debugging
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Log error details
    console.error('Component stack:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>

            {/* Error Title */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Oops! Có lỗi xảy ra
              </h1>
              <p className="text-gray-600">
                Ứng dụng gặp sự cố không mong muốn. Vui lòng thử lại.
              </p>
            </div>

            {/* Error Details (only in development) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-32 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-700">Chi tiết lỗi (Development):</p>
                <p className="text-xs text-red-600 font-mono break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Thử lại
              </button>
              <button
                onClick={this.handleRefresh}
                className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Tải lại trang
              </button>
            </div>

            {/* Support Info */}
            <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
              <p>Nếu vấn đề tiếp tục, vui lòng liên hệ với hỗ trợ của chúng tôi.</p>
              <p className="mt-1">
                Email: <a href="mailto:support@1beauty.asia" className="text-primary hover:underline">support@1beauty.asia</a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
