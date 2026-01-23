export const keys = {
    auth: {
        session: ['auth', 'session'],
        profile: (userId: string | null) => ['auth', 'profile', userId],
        role: (userId: string | null) => ['auth', 'role', userId],
    },
    business: {
        details: (slug: string) => ['business', 'details', slug],
    },
    admin: {
        logs: ['admin', 'logs'],
        notifications: ['admin', 'notifications'],
        announcements: ['admin', 'announcements'],
        tickets: ['admin', 'tickets'],
        registrationRequests: ['admin', 'registrationRequests'],
        settings: ['admin', 'settings'],
        pageContent: ['admin', 'pageContent'],
    }
} as const;
