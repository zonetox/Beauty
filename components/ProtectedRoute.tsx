import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';
import { useProfile } from '../providers/ProfileProvider.tsx';
import { supabase } from '../lib/supabaseClient.ts';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

/**
 * ProtectedRoute (Layered Architecture)
 * 
 * Duty: Deterministic access control.
 * Layer 1 (Identity): Verified by useAuth
 * Layer 2 (Data): Verified by useProfile
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { state: authState, user } = useAuth();
    const { profile, isLoaded: profileLoaded, refreshProfile } = useProfile();
    const location = useLocation();

    // Self-healing state for slow triggers
    const [isCreatingProfile, setIsCreatingProfile] = useState(false);

    /**
     * SELF-HEALING: "The Virtual Handshake"
     * If Auth is valid but Profile is missing after 3 seconds,
     * attempt a safe manual creation to fix the account.
     */
    useEffect(() => {
        if (authState === 'authenticated' && profileLoaded && !profile && !isCreatingProfile) {
            const timer = setTimeout(async () => {
                console.warn('[Guard] Profile missing after grace period. Attempting self-healing...');
                setIsCreatingProfile(true);
                try {
                    if (user?.id) {
                        await supabase.from('profiles').insert({
                            id: user.id,
                            email: user.email || null,
                            full_name: user.user_metadata?.full_name || user.email || null
                        } as any);
                    }
                    await refreshProfile();
                } catch (e) {
                    console.error('[Guard] Self-healing failed:', e);
                } finally {
                    setIsCreatingProfile(false);
                }
            }, 3000); // 3 second grace period

            return () => clearTimeout(timer);
        }
    }, [authState, profileLoaded, profile, user, refreshProfile, isCreatingProfile]);

    // 1. Identity Check (Layer 1)
    if (authState === 'loading') {
        return null; // Silent while determining identity
    }

    if (authState === 'unauthenticated' || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Data Check (Layer 2)
    if (!profileLoaded || isCreatingProfile) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold text-neutral-dark">Đang khởi tạo tài khoản...</h2>
                <p className="text-gray-500">Việc này sẽ diễn ra trong giây lát.</p>
            </div>
        );
    }

    // 3. Fallback: If profile still missing after loading (e.g. deletion, error)
    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6 text-center">
                <div className="text-red-500 text-6xl mb-6">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tài khoản chưa hoàn tất</h2>
                <p className="text-gray-600 mb-8 max-w-sm">
                    Chúng tôi không tìm thấy hồ sơ của bạn. Vui lòng liên hệ hỗ trợ hoặc thử đăng xuất và đăng nhập lại.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-white rounded-xl">Thử lại</button>
                    <button onClick={() => supabase.auth.signOut()} className="px-6 py-2 bg-white border border-gray-200 rounded-xl">Đăng xuất</button>
                </div>
            </div>
        );
    }

    // SUCCESS: All layers verified
    return <>{children}</>;
};

export default ProtectedRoute;