
import React, { useState } from 'react';
import { useUserSession } from '../contexts/UserSessionContext.tsx';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestPasswordReset } = useUserSession();

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // The function now sends a real email and doesn't return anything.
      await requestPasswordReset(email);
      setIsSubmitted(true);
    } catch (err: unknown) {
      // This catch block might not be reached if the context function doesn't throw,
      // but it's good practice to keep it.
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state on close so it's fresh next time
    setEmail('');
    setIsSubmitted(false);
    setError('');
    setLoading(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <h2 id="forgot-password-title" className="text-xl font-bold font-serif text-neutral-dark">
            {isSubmitted ? 'Request Sent' : 'Reset Password'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 font-bold text-2xl" aria-label="Close">&times;</button>
        </div>
        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-gray-600">
                If an account with the email <strong>{email}</strong> exists, a password reset link has been sent. Please check your inbox.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-500 text-center bg-red-100 p-2 rounded-md text-sm">{error}</p>}
              <p className="text-sm text-gray-600">Enter your email address and we will send you a link to reset your password.</p>
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  id="reset-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="you@example.com"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={handleClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:bg-primary/50 disabled:cursor-not-allowed">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
