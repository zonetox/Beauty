import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';
import { supabase } from '../lib/supabaseClient.ts';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

/**
 * ProtectedRoute (Deterministic Layer)
 * 
 * Duty: Passive access control based on Unified Auth State.
 * Verifies both Identity (user) and Data (profile/role).
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { state: authState, user, profile, isDataLoaded, error: authError } = useAuth();
    const location = useLocation();

    // 1. Identity Check
    if (authState === 'loading') {
        return null; // Silent while determining identity
    }

    if (authState === 'unauthenticated' || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Data Check
    if (!isDataLoaded) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold text-neutral-dark">Đang tải dữ liệu...</h2>
                <p className="text-gray-500">Việc này sẽ diễn ra trong giây lát.</p>
            </div>
        );
    }

    // 3. Fallback: If profile still missing or errored
    if (!profile || authError) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6 text-center">
                <div className="text-red-500 text-6xl mb-6">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tài khoản chưa hoàn tất</h2>
                <p className="text-gray-600 mb-8 max-w-sm">
                    {authError || "Chúng tôi không tìm thấy hồ sơ của bạn. Vui lòng thử đăng xuất và đăng nhập lại."}
                </p>
                <div className="flex gap-4">
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-white rounded-xl">Thử lại</button>
                    <button onClick={() => supabase.auth.signOut()} className="px-6 py-2 bg-white border border-gray-200 rounded-xl">Đăng xuất</button>
                </div>
            </div>
        );
    }

    // SUCCESS: Unified state verified
    return <>{children}</>;
};

export default ProtectedRoute;