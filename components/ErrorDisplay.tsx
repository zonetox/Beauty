import React, { useState, useMemo } from 'react';
import { useErrorLogger, ErrorLog } from '../contexts/ErrorLoggerContext.tsx';

const ErrorDisplay: React.FC = () => {
  const { errors, clearErrors, clearError, exportErrors } = useErrorLogger();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const filteredErrors = useMemo(() => {
    let filtered = errors;

    if (filter !== 'all') {
      filtered = filtered.filter(e => e.severity === filter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(e => e.source === sourceFilter);
    }

    return filtered;
  }, [errors, filter, sourceFilter]);

  const uniqueSources = useMemo(() => {
    return Array.from(new Set(errors.map(e => e.source || 'Unknown')));
  }, [errors]);

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  const infoCount = errors.filter(e => e.severity === 'info').length;

  const handleExport = () => {
    const data = exportErrors();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSeverityColor = (severity: ErrorLog['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: ErrorLog['severity']) => {
    switch (severity) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  };

  if (errors.length === 0) {
    return null; // Không hiển thị nếu không có lỗi
  }

  return (
    <>
      {/* Error Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative px-3 py-2 rounded-md text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors flex items-center gap-2"
        title="Xem lỗi ứng dụng"
      >
        <span className="text-lg">🐛</span>
        <span className="hidden sm:inline">Lỗi</span>
        {errorCount > 0 && (
          <span className="bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
            {errorCount}
          </span>
        )}
        {warningCount > 0 && (
          <span className="bg-yellow-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
            {warningCount}
          </span>
        )}
      </button>

      {/* Error Panel */}
      {isOpen && (
        <div className="fixed top-16 right-4 w-[90vw] max-w-2xl max-h-[80vh] bg-white rounded-lg shadow-2xl border-2 border-red-300 z-[9999] flex flex-col">
          {/* Header */}
          <div className="bg-red-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🐛</span>
              <div>
                <h3 className="font-bold text-lg">Error Logger</h3>
                <p className="text-sm text-red-100">
                  {errors.length} lỗi • {errorCount} errors • {warningCount} warnings • {infoCount} info
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm transition-colors"
                title="Export errors to JSON"
              >
                📥 Export
              </button>
              <button
                onClick={clearErrors}
                className="px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm transition-colors"
                title="Clear all errors"
              >
                🗑️ Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-3 bg-gray-50 border-b flex flex-wrap gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'error' | 'warning' | 'info')}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="all">Tất cả ({errors.length})</option>
              <option value="error">Errors ({errorCount})</option>
              <option value="warning">Warnings ({warningCount})</option>
              <option value="info">Info ({infoCount})</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="all">Tất cả sources</option>
              {uniqueSources.map(source => (
                <option key={source} value={source}>
                  {source} ({errors.filter(e => e.source === source).length})
                </option>
              ))}
            </select>
          </div>

          {/* Error List */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredErrors.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Không có lỗi nào phù hợp với bộ lọc
              </div>
            ) : (
              <div className="space-y-3">
                {filteredErrors.map((error) => (
                  <div
                    key={error.id}
                    className={`border rounded-lg p-3 ${getSeverityColor(error.severity)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getSeverityIcon(error.severity)}</span>
                          <span className="font-semibold text-sm">{error.source}</span>
                          <span className="text-xs opacity-75">{formatTime(error.timestamp)}</span>
                        </div>
                        <div className="text-sm font-mono bg-white/50 p-2 rounded mt-2 break-words">
                          {error.message}
                        </div>
                        {error.stack && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer opacity-75 hover:opacity-100">
                              Stack Trace
                            </summary>
                            <pre className="text-xs bg-white/50 p-2 rounded mt-1 overflow-x-auto">
                              {error.stack}
                            </pre>
                          </details>
                        )}
                        {error.url && (
                          <div className="text-xs opacity-75 mt-1">
                            URL: {error.url}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => clearError(error.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        title="Xóa lỗi này"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-3 border-t text-xs text-gray-600 text-center">
            Lỗi được tự động ghi nhận từ console, unhandled errors, và error handlers
          </div>
        </div>
      )}
    </>
  );
};

export default ErrorDisplay;
