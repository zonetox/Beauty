import React, { useContext } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useBusinessData, PublicDataContext } from '../contexts/BusinessDataContext';
import { useBlogData } from '../contexts/BusinessDataContext.tsx';
import { useBusinessBlogData } from '../contexts/BusinessContext.tsx';

const ChevronRightIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

// Shared breadcrumb rendering logic
const BreadcrumbContent: React.FC<{ crumbs: { label: string; path: string }[] }> = ({ crumbs }) => {
    if (crumbs.length <= 1) {
        return null;
    }

    return (
        <nav aria-label="Breadcrumb" className="bg-gray-50/70 border-b border-gray-200/80">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <ol className="flex items-center space-x-2 py-3 text-sm">
                    {crumbs.map((crumb, index) => {
                        const isLast = index === crumbs.length - 1;
                        return (
                            <li key={crumb.path} className="flex items-center">
                                {isLast ? (
                                    <span className="font-semibold text-neutral-dark truncate max-w-[200px] sm:max-w-none" aria-current="page">
                                        {crumb.label}
                                    </span>
                                ) : (
                                    <Link to={crumb.path} className="text-gray-500 hover:text-primary transition-colors font-medium">
                                        {crumb.label}
                                    </Link>
                                )}
                                {!isLast && <ChevronRightIcon />}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </nav>
    );
};

// Static paths mapping
const staticPaths: Record<string, string> = {
    'directory': 'Danh bạ',
    'blog': 'Blog',
    'about': 'Về chúng tôi',
    'contact': 'Liên hệ',
    'register': 'For Business',
    'login': 'Đăng nhập',
    'signup': 'Đăng ký',
    'account': 'Tài khoản',
    'reset-password': 'Reset Password'
};

// Non-public version: Does NOT use hooks, safe for auth pages
// Falls back to static labels or slug for dynamic routes
const BreadcrumbsNonPublic: React.FC = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter(x => x);
    const crumbs: { label: string; path: string }[] = [{ label: 'Trang chủ', path: '/' }];

    if (pathnames.length === 0) {
        return null; // No breadcrumbs on homepage
    }

    // --- Dynamic Path Handling (without hooks - fallback to slug) ---
    const firstPath = pathnames[0];
    if (firstPath === 'business' && pathnames.length >= 2) {
        crumbs.push({ label: 'Danh bạ', path: '/directory' });
        // Use slug as label if we can't look up business name
        const slug = pathnames[1] ?? '';
        crumbs.push({ label: slug || 'Business', path: `/business/${slug}` });

        if (pathnames.length === 4 && pathnames[2] === 'post') {
            const postSlug = pathnames[3] ?? '';
            crumbs.push({ label: postSlug || 'Post', path: `/business/${slug}/post/${postSlug}` });
        }
    } else if (firstPath === 'blog' && pathnames.length === 2) {
        crumbs.push({ label: 'Blog', path: '/blog' });
        // Use slug as label if we can't look up post title
        const slug = pathnames[1] ?? '';
        crumbs.push({ label: slug || 'Post', path: `/blog/${slug}` });
    } else if (firstPath) {
        // Handle simple static paths
        const page = staticPaths[firstPath];
        if (page) {
            crumbs.push({ label: page, path: `/${firstPath}` });
        }
    }

    return <BreadcrumbContent crumbs={crumbs} />;
};

// Public version: Uses hooks for dynamic lookups (business/blog names)
// MUST be rendered inside PublicDataProvider
const BreadcrumbsPublic: React.FC = () => {
    const location = useLocation();
    const { getBusinessBySlug } = useBusinessData();
    const { getPostBySlug: getPlatformPostBySlug } = useBlogData();
    const { getPostBySlug: getBusinessPostBySlug } = useBusinessBlogData();

    const pathnames = location.pathname.split('/').filter(x => x);
    const crumbs: { label: string; path: string }[] = [{ label: 'Trang chủ', path: '/' }];

    if (pathnames.length === 0) {
        return null; // No breadcrumbs on homepage
    }

    // --- Dynamic Path Handling (with hooks for real names) ---
    const firstPath = pathnames[0];
    if (firstPath === 'business' && pathnames.length >= 2) {
        crumbs.push({ label: 'Danh bạ', path: '/directory' });
        const business = getBusinessBySlug(pathnames[1] ?? '');
        if (business?.name && business?.slug) {
            crumbs.push({ label: business.name, path: `/business/${business.slug}` });

            if (pathnames.length === 4 && pathnames[2] === 'post') {
                const post = getBusinessPostBySlug(pathnames[3] ?? '');
                if (post?.title && post?.slug) {
                    crumbs.push({ label: post.title, path: `/business/${business.slug}/post/${post.slug}` });
                }
            }
        }
    } else if (firstPath === 'blog' && pathnames.length === 2) {
        crumbs.push({ label: 'Blog', path: '/blog' });
        const post = getPlatformPostBySlug(pathnames[1] ?? '');
        if (post?.title && post?.slug) {
            crumbs.push({ label: post.title, path: `/blog/${post.slug}` });
        }
    } else if (firstPath) {
        // Handle simple static paths
        const page = staticPaths[firstPath];
        if (page) {
            crumbs.push({ label: page, path: `/${firstPath}` });
        }
    }

    return <BreadcrumbContent crumbs={crumbs} />;
};

// Main component: Checks if PublicDataContext is available and uses appropriate version
const Breadcrumbs: React.FC = () => {
    // Check if we're inside PublicDataProvider (useContext doesn't throw if context is undefined)
    const publicDataContext = useContext(PublicDataContext);
    const hasPublicData = !!publicDataContext;
    
    // Conditionally render components (hooks are always called unconditionally inside each component)
    return hasPublicData ? <BreadcrumbsPublic /> : <BreadcrumbsNonPublic />;
};


export default Breadcrumbs;