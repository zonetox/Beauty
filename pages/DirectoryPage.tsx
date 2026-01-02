

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar.tsx';
import BusinessCard from '../components/BusinessCard.tsx';
import DirectoryMap from '../components/DirectoryMap.tsx';
import { CATEGORIES, CITIES, LOCATIONS_HIERARCHY } from '../constants.ts';
import { Business, MembershipTier } from '../types.ts';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import FilterTag from '../components/FilterTag.tsx';
import Pagination from '../components/Pagination.tsx';

const SkeletonCard: React.FC = () => (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
        <div className="bg-gray-200 h-48 w-full animate-pulse"></div>
        <div className="p-4 space-y-3">
            <div className="bg-gray-200 h-4 w-1/3 animate-pulse rounded"></div>
            <div className="bg-gray-200 h-6 w-3/4 animate-pulse rounded"></div>
            <div className="bg-gray-200 h-4 w-full animate-pulse rounded"></div>
            <div className="bg-gray-200 h-4 w-1/2 animate-pulse rounded"></div>
        </div>
    </div>
);

// Helper to check if a business is currently open
const checkIfOpen = (workingHours: { [key: string]: string }): boolean => {
    if (!workingHours) return false;
    try {
        const now = new Date();
        const currentDay = now.getDay(); // Sunday is 0, Monday is 1...
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes from midnight

        const dayMap: { [key: string]: number } = {
            'Chủ Nhật': 0, 'CN': 0,
            'Thứ 2': 1, 'T2': 1,
            'Thứ 3': 2, 'T3': 2,
            'Thứ 4': 3, 'T4': 3,
            'Thứ 5': 4, 'T5': 4,
            'Thứ 6': 5, 'T6': 5,
            'Thứ 7': 6, 'T7': 6,
        };

        for (const dayRange in workingHours) {
            const timeRange = workingHours[dayRange];
            if (!timeRange || timeRange.toLowerCase().includes('closed')) continue;

            let applicableDays: number[] = [];

            if (dayRange.toLowerCase().includes('hàng ngày')) {
                applicableDays = [0, 1, 2, 3, 4, 5, 6];
            } else if (dayRange.includes('-')) {
                const [startDayStr, endDayStr] = dayRange.split(' - ').map(s => s.trim());
                const startDay = dayMap[startDayStr];
                const endDay = dayMap[endDayStr];
                if (startDay !== undefined && endDay !== undefined) {
                    for (let i = startDay; i <= endDay; i++) {
                        applicableDays.push(i);
                    }
                }
            } else {
                const day = dayMap[dayRange.trim()];
                if (day !== undefined) {
                    applicableDays.push(day);
                }
            }

            if (applicableDays.includes(currentDay)) {
                const timeParts = timeRange.split(' - ').map(s => s.trim());
                if (timeParts.length !== 2) continue; // Malformed range

                const [startTimeStr, endTimeStr] = timeParts;
                const startHM = startTimeStr.split(':').map(Number);
                const endHM = endTimeStr.split(':').map(Number);

                if (startHM.length !== 2 || endHM.length !== 2 || isNaN(startHM[0]) || isNaN(startHM[1]) || isNaN(endHM[0]) || isNaN(endHM[1])) {
                    continue; // Malformed time
                }

                const [startH, startM] = startHM;
                const [endH, endM] = endHM;

                const startTime = startH * 60 + startM;
                const endTime = endH * 60 + endM;

                if (currentTime >= startTime && currentTime < endTime) {
                    return true;
                }
            }
        }
    } catch (e) {
        console.error("Error parsing working hours:", e);
    }
    return false;
};

const ITEMS_PER_PAGE = 12;

const DirectoryPage: React.FC = () => {
    const {
        businesses, businessMarkers, totalBusinesses,
        currentPage: dbPage, fetchBusinesses, loading: contextLoading
    } = useBusinessData();

    const [mapVisibleBusinesses, setMapVisibleBusinesses] = useState<any[]>([]);
    const [highlightedBusinessId, setHighlightedBusinessId] = useState<number | null>(null);
    const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);
    const [mapBounds, setMapBounds] = useState<any | null>(null);
    const [filterByMap, setFilterByMap] = useState(true);

    const location = useLocation();
    const navigate = useNavigate();
    const listContainerRef = useRef<HTMLDivElement>(null);

    const getFiltersFromUrl = useCallback(() => {
        const params = new URLSearchParams(location.search);
        return {
            keyword: params.get('keyword') || '',
            category: params.get('category') || '',
            location: params.get('location') || '',
            district: params.get('district') || '',
            sort: params.get('sort') || 'default',
            hasDeals: params.get('deals') === 'true',
            isVerified: params.get('verified') === 'true',
            isOpenNow: params.get('open') === 'true',
            page: parseInt(params.get('page') || '1', 10),
        };
    }, [location.search]);

    const activeFilters = getFiltersFromUrl();

    // Effect to fetch paginated businesses when filters or page in URL changes
    useEffect(() => {
        const filters = getFiltersFromUrl();
        fetchBusinesses(filters.page, {
            search: filters.keyword,
            location: filters.location,
            district: filters.district,
            category: filters.category
        });
    }, [location.search, fetchBusinesses, getFiltersFromUrl]);

    // Fast marker filtering for Map (uses the lightweight markers state)
    const filteredMarkers = businessMarkers.filter(m => m.isActive);

    // List View filtering (depends on Map Bounds if enabled)
    useEffect(() => {
        if (filterByMap && mapBounds) {
            const visible = businesses.filter(b =>
                b.latitude && b.longitude && mapBounds.contains([b.latitude, b.longitude])
            );
            setMapVisibleBusinesses(visible);
        } else {
            setMapVisibleBusinesses(businesses);
        }
    }, [mapBounds, businesses, filterByMap]);

    // Scroll to selected business in the list when a marker is clicked
    useEffect(() => {
        if (selectedBusinessId && listContainerRef.current) {
            const element = listContainerRef.current.querySelector(`#business-card-${selectedBusinessId}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [selectedBusinessId]);

    const handleFilterChange = (newFilters: Partial<ReturnType<typeof getFiltersFromUrl>>) => {
        const currentFilters = getFiltersFromUrl();
        const updatedFilters = { ...currentFilters, ...newFilters };
        const params = new URLSearchParams();
        if (updatedFilters.keyword) params.set('keyword', updatedFilters.keyword);
        if (updatedFilters.category) params.set('category', updatedFilters.category);
        if (updatedFilters.location) params.set('location', updatedFilters.location);
        if (updatedFilters.district) params.set('district', updatedFilters.district);
        if (updatedFilters.sort !== 'default') params.set('sort', updatedFilters.sort);
        if (updatedFilters.hasDeals) params.set('deals', 'true');
        if (updatedFilters.isVerified) params.set('verified', 'true');
        if (updatedFilters.isOpenNow) params.set('open', 'true');

        // Reset to page 1 on filter change, unless specifically setting the page
        const newPage = newFilters.page !== undefined ? newFilters.page : 1;
        params.set('page', newPage.toString());

        navigate(`/directory?${params.toString()}`, { replace: true });
    };

    const hasActiveFilters = Object.values(activeFilters).some((v, i) => i < 8 && v && v !== 'default'); // Ignore page
    const hasTagFilters = activeFilters.keyword || activeFilters.category || activeFilters.location || activeFilters.district || activeFilters.hasDeals || activeFilters.isVerified || activeFilters.isOpenNow;
    const hasSearchQuery = !!(activeFilters.keyword || activeFilters.category || activeFilters.location || activeFilters.district);

    const handleRemoveFilter = (filterToRemove: string) => {
        const newParams = new URLSearchParams(location.search);
        newParams.delete(filterToRemove);
        if (filterToRemove === 'location') newParams.delete('district');
        newParams.set('page', '1');
        navigate(`/directory?${newParams.toString()}`, { replace: true });
    };

    const handleClearAllFilters = () => navigate('/directory', { replace: true });

    // Pagination logic
    const PAGE_SIZE = 20;
    const totalPages = Math.ceil(totalBusinesses / PAGE_SIZE);
    const paginatedBusinesses = mapVisibleBusinesses; // Already paginated by server if filterByMap is off


    return (
        <div>
            {/* Map View */}
            <div className="w-full h-[70vh]">
                <DirectoryMap
                    businesses={filteredMarkers as any}
                    highlightedBusinessId={highlightedBusinessId}
                    selectedBusinessId={selectedBusinessId}
                    onMarkerClick={(id) => setSelectedBusinessId(prev => prev === id ? null : id)}
                    onPopupClose={() => setSelectedBusinessId(null)}
                    onMarkerMouseEnter={(id) => setHighlightedBusinessId(id)}
                    onMarkerMouseLeave={() => setHighlightedBusinessId(null)}
                    onBoundsChange={setMapBounds}
                    shouldFitBounds={hasSearchQuery}
                />
            </div>

            <div className="container mx-auto px-4 py-6">
                {/* Search Bar */}
                <SearchBar
                    onSearch={(filters) => handleFilterChange(filters)}
                    categories={CATEGORIES} locations={CITIES} locationsHierarchy={LOCATIONS_HIERARCHY}
                    isLoading={contextLoading}
                />

                {/* List View */}
                <div className="mt-6">
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 mb-4 pb-4 border-b border-gray-200">
                            <div className="flex flex-wrap items-center gap-2">
                                {hasTagFilters ? (
                                    <>
                                        {activeFilters.keyword && <FilterTag label="Từ khóa" value={activeFilters.keyword} onRemove={() => handleRemoveFilter('keyword')} />}
                                        {activeFilters.category && <FilterTag label="Lĩnh vực" value={activeFilters.category} onRemove={() => handleRemoveFilter('category')} />}
                                        {activeFilters.location && <FilterTag label="TP" value={activeFilters.location} onRemove={() => handleRemoveFilter('location')} />}
                                        {activeFilters.district && <FilterTag label="Quận" value={activeFilters.district} onRemove={() => handleRemoveFilter('district')} />}
                                        {activeFilters.hasDeals && <FilterTag label="Khác" value="Có ưu đãi" onRemove={() => handleRemoveFilter('deals')} />}
                                        {activeFilters.isVerified && <FilterTag label="Khác" value="Đã xác thực" onRemove={() => handleRemoveFilter('verified')} />}
                                        {activeFilters.isOpenNow && <FilterTag label="Khác" value="Đang mở cửa" onRemove={() => handleRemoveFilter('open')} />}
                                    </>
                                ) : (
                                    <span className="text-sm text-gray-500 italic">Đã áp dụng sắp xếp.</span>
                                )}
                            </div>
                            <button onClick={handleClearAllFilters} className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors flex-shrink-0 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Xóa tất cả bộ lọc</span>
                            </button>
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        <h2 className="text-lg font-semibold text-neutral-dark flex-shrink-0">
                            {contextLoading ? 'Đang tìm kiếm...' : (
                                <span>
                                    {filterByMap && businesses.length > 0
                                        ? <>Hiển thị <strong className="text-primary">{mapVisibleBusinesses.length}</strong> hiện tại (tổng {totalBusinesses})</>
                                        : <>Tìm thấy <strong className="text-primary">{totalBusinesses}</strong> kết quả</>
                                    }
                                </span>
                            )}
                        </h2>
                        <div className="flex items-center gap-x-6 gap-y-3 flex-wrap">
                            <div className="flex items-center gap-2 text-sm">
                                <label htmlFor="sort-by" className="font-medium">Sắp xếp:</label>
                                <select id="sort-by" value={activeFilters.sort} onChange={(e) => handleFilterChange({ sort: e.target.value })} className="bg-white border border-gray-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-1.5">
                                    <option value="default">Mặc định</option>
                                    <option value="rating">Đánh giá cao</option>
                                    <option value="newest">Mới nhất</option>
                                    <option value="name">Tên (A-Z)</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-x-4 gap-y-2 flex-wrap text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={activeFilters.hasDeals}
                                        onChange={(e) => handleFilterChange({ hasDeals: e.target.checked })}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <span className="font-medium">Có ưu đãi</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={activeFilters.isVerified}
                                        onChange={(e) => handleFilterChange({ isVerified: e.target.checked })}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <span className="font-medium">Đã xác thực</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={activeFilters.isOpenNow}
                                        onChange={(e) => handleFilterChange({ isOpenNow: e.target.checked })}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <span className="font-medium">Đang mở cửa</span>
                                </label>
                            </div>
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={filterByMap}
                                        onChange={() => setFilterByMap(prev => !prev)}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${filterByMap ? 'bg-primary' : 'bg-gray-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${filterByMap ? 'translate-x-full' : ''}`}></div>
                                </div>
                                <span className="font-medium">Lọc theo bản đồ</span>
                            </label>
                        </div>
                    </div>

                    <div ref={listContainerRef}>
                        {contextLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(ITEMS_PER_PAGE)].map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : paginatedBusinesses.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {paginatedBusinesses.map((business) => (
                                        <BusinessCard
                                            key={business.id}
                                            business={business}
                                            highlighted={selectedBusinessId === business.id || highlightedBusinessId === business.id}
                                            onMouseEnter={() => setHighlightedBusinessId(business.id)}
                                            onMouseLeave={() => setHighlightedBusinessId(null)}
                                        />
                                    ))}
                                </div>
                                {totalPages > 1 && (
                                    <div className="mt-12">
                                        <Pagination
                                            currentPage={activeFilters.page}
                                            totalPages={totalPages}
                                            onPageChange={(page) => handleFilterChange({ page })}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-lg text-gray-600">Không tìm thấy doanh nghiệp nào phù hợp.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DirectoryPage;