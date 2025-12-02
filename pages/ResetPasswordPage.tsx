
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserSession } from '../contexts/UserSessionContext.tsx';

type PageState = 'form' | 'success';

const ResetPasswordPage: React.FC = () => {
    const { resetPassword } = useUserSession();

    const [pageState, setPageState] = useState<PageState>('form');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(password);
            setPageState('success');
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. The reset link may have expired, or you are not in a valid recovery session.');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (pageState) {
            case 'success':
                 return (
                    <>
                        <h1 className="text-2xl font-bold text-center text-green-600 font-serif">Password Updated!</h1>
                        <p className="text-center text-gray-600 mt-4">
                            Your password has been changed successfully. You can now log in with your new password.
                        </p>
                        <Link to="/login" className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark">
                            Proceed to Login
                        </Link>
                    </>
                );

            case 'form':
                return (
                    <>
                        <h1 className="text-2xl font-bold text-center text-neutral-dark font-serif">Set a New Password</h1>
                        <p className="text-sm text-center text-gray-600 mt-2">
                            Please enter and confirm your new password below.
                        </p>
                        {error && <p className="text-red-500 text-center bg-red-100 p-3 rounded-md mt-4">{error}</p>}
                        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:bg-primary/50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Updating...' : 'Reset Password'}
                                </button>
                            </div>
                        </form>
                    </>
                );
        }
    }


    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-128px)] bg-background">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                {renderContent()}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
