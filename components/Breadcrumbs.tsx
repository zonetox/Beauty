import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useBusinessData } from '../contexts/BusinessDataContext';
import { useBlogData } from '../contexts/BusinessDataContext.tsx';
import { useBusinessBlogData } from '../contexts/BusinessContext.tsx';

const ChevronRightIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const { getBusinessBySlug } = useBusinessData();
    const { getPostBySlug: getPlatformPostBySlug } = useBlogData();
    const { getPostBySlug: getBusinessPostBySlug } = useBusinessBlogData();

    const pathnames = location.pathname.split('/').filter(x => x);
    const crumbs: { label: string; path: string }[] = [{ label: 'Trang chủ', path: '/' }];

    if (pathnames.length === 0) {
        return null; // No breadcrumbs on homepage
    }
    
    // --- Static Path Mapping ---
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

    // --- Dynamic Path Handling ---
    if (pathnames[0] === 'business' && pathnames.length >= 2) {
        crumbs.push({ label: 'Danh bạ', path: '/directory' });
        const business = getBusinessBySlug(pathnames[1]);
        if (business) {
            crumbs.push({ label: business.name, path: `/business/${business.slug}` });

            if (pathnames.length === 4 && pathnames[2] === 'post') {
                const post = getBusinessPostBySlug(pathnames[3]);
                if (post) {
                    crumbs.push({ label: post.title, path: `/business/${business.slug}/post/${post.slug}` });
                }
            }
        }
    } else if (pathnames[0] === 'blog' && pathnames.length === 2) {
        crumbs.push({ label: 'Blog', path: '/blog' });
        const post = getPlatformPostBySlug(pathnames[1]);
        if (post) {
            crumbs.push({ label: post.title, path: `/blog/${post.slug}` });
        }
    } else {
        // Handle simple static paths
        const page = staticPaths[pathnames[0]];
        if (page) {
            crumbs.push({ label: page, path: `/${pathnames[0]}` });
        }
    }


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

export default Breadcrumbs;