import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Business, Order, AdminUser, AdminPageTab } from '../types.ts';
import { generateSearchSuggestions, isGeminiAvailable } from '../lib/geminiService.ts';

// Search Icon
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

interface SearchResult {
    type: 'Business' | 'Order' | 'User';
    label: string;
    description: string;
    tab: AdminPageTab;
    id: string | number;
}

interface AdminGlobalSearchProps {
    businesses: Business[];
    orders: Order[];
    adminUsers: AdminUser[];
    onNavigate: (tab: AdminPageTab) => void;
}

const AdminGlobalSearch: React.FC<AdminGlobalSearchProps> = ({ businesses, orders, adminUsers, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const results = useMemo<SearchResult[]>(() => {
        if (!query.trim()) return [];

        const lowerQuery = query.toLowerCase();
        const MAX_RESULTS_PER_TYPE = 3;

        const businessResults: SearchResult[] = businesses
            .filter(b => b.name.toLowerCase().includes(lowerQuery))
            .slice(0, MAX_RESULTS_PER_TYPE)
            .map(b => ({ type: 'Business', label: b.name, description: b.address, tab: 'businesses', id: b.id }));

        const orderResults: SearchResult[] = orders
            .filter(o => o.id.toLowerCase().includes(lowerQuery) || o.business_name.toLowerCase().includes(lowerQuery))
            .slice(0, MAX_RESULTS_PER_TYPE)
            .map(o => ({ type: 'Order', label: `Order #${o.id}`, description: o.business_name, tab: 'orders', id: o.id }));

        const userResults: SearchResult[] = adminUsers
            .filter(u => u.admin_username.toLowerCase().includes(lowerQuery) || u.email.toLowerCase().includes(lowerQuery))
            .slice(0, MAX_RESULTS_PER_TYPE)
            .map(u => ({ type: 'User', label: u.admin_username, description: u.email, tab: 'users', id: u.id }));

        return [...businessResults, ...orderResults, ...userResults].slice(0, 7);
    }, [query, businesses, orders, adminUsers]);

    // Generate AI search suggestions
    useEffect(() => {
        if (!query.trim() || query.length < 3) {
            setAiSuggestions([]);
            return;
        }

        if (!isGeminiAvailable()) {
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoadingSuggestions(true);
            try {
                const suggestions = await generateSearchSuggestions(query);
                if (suggestions) {
                    setAiSuggestions(suggestions);
                }
            } catch (error) {
                console.error('Error generating search suggestions:', error);
            } finally {
                setLoadingSuggestions(false);
            }
        }, 500); // Debounce 500ms

        return () => clearTimeout(timeoutId);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = (result: SearchResult) => {
        onNavigate(result.tab);
        setQuery('');
        setIsFocused(false);
    };

    const showResults = isFocused && query.length > 0;

    return (
        <div className="relative w-64" ref={searchRef}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    placeholder="Global Search..."
                    className="block w-full bg-white border border-gray-300 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
            </div>
            {showResults && (
                <div className="absolute z-10 mt-2 w-full bg-white rounded-md shadow-lg border">
                    {results.length > 0 ? (
                        <>
                            <ul className="max-h-60 overflow-y-auto border-b">
                                {results.map((result, index) => (
                                    <li key={`${result.type}-${result.id}-${index}`}>
                                        <button onClick={() => handleResultClick(result)} className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors">
                                            <p className="text-sm font-medium text-neutral-dark">{result.label}</p>
                                            <p className="text-xs text-gray-500">{result.description} <span className="font-semibold text-primary">({result.type})</span></p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            {isGeminiAvailable() && (aiSuggestions.length > 0 || loadingSuggestions) && (
                                <div className="px-4 py-2 bg-blue-50 border-t">
                                    <p className="text-xs font-semibold text-blue-900 mb-2">💡 Gợi ý tìm kiếm:</p>
                                    {loadingSuggestions ? (
                                        <p className="text-xs text-blue-700">Đang tạo gợi ý...</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {aiSuggestions.map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        setQuery(suggestion);
                                                        setIsFocused(true);
                                                    }}
                                                    className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                            {loadingSuggestions ? 'Đang tìm kiếm...' : 'Không tìm thấy kết quả.'}
                            {isGeminiAvailable() && aiSuggestions.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                    <p className="text-xs font-semibold text-blue-900 mb-2">💡 Gợi ý tìm kiếm:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {aiSuggestions.map((suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    setQuery(suggestion);
                                                    setIsFocused(true);
                                                }}
                                                className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminGlobalSearch;
