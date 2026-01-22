import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { POPULAR_SEARCH_SUGGESTIONS } from '../constants.ts';

interface SearchBarProps {
  onSearch: (filters: { keyword: string; category: string; location: string; district: string; }) => void;
  categories: string[];
  locations: string[];
  locationsHierarchy?: { [key: string]: string[] };
  showTitle?: boolean;
  isLoading?: boolean;
}

// Custom hook to debounce a value. It's particularly useful for preventing
// search queries from firing on every keystroke in the keyword input.
function useDebounce<T,>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timer to update the debounced value after the specified delay.
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: If the value changes again before the delay is over,
    // this will clear the previous timer and reset it. This is the core of debouncing.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-run effect if value or delay changes. Using `value` directly is safe
  // as long as the state updates create a new object/value, which they do.

  return debouncedValue;
}


const SearchBar: React.FC<SearchBarProps> = ({ onSearch, categories, locations, locationsHierarchy, showTitle = false, isLoading = false }) => {
  const locationUrl = useLocation();
  const navigate = useNavigate();

  const getFiltersFromUrl = () => {
    const params = new URLSearchParams(locationUrl.search);
    return {
      keyword: params.get('keyword') || '',
      category: params.get('category') || '',
      location: params.get('location') || '',
      district: params.get('district') || '',
    };
  };

  const [filters, setFilters] = useState(getFiltersFromUrl());
  const [districts, setDistricts] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce the entire filters object. This will trigger a search 500ms after the user stops changing any filter.
  const debouncedFilters = useDebounce(filters, 500);

  // Effect to update available districts when city (location) changes
  useEffect(() => {
    if (filters.location && locationsHierarchy) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDistricts(locationsHierarchy[filters.location] || []);
    } else {
      setDistricts([]);
    }
    // If city is cleared, also clear district
    if (!filters.location) {
       
      setFilters(prev => ({ ...prev, district: '' }));
    }
  }, [filters.location, locationsHierarchy]);

  // Effect to sync component state with URL when it changes (e.g., back/forward buttons)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(getFiltersFromUrl());
  }, [locationUrl.search]);

  // Effect to trigger the search operation when debounced filters change
  useEffect(() => {
    // Only apply debounce search on the directory page where onSearch is handled.
    if (locationUrl.pathname.startsWith('/directory')) {
      const currentUrlFilters = getFiltersFromUrl();
      // Check if the debounced filters have actually changed compared to the current URL.
      // This prevents firing a search on initial load or after a search has already been performed and the URL is updated.
      const hasChanged = JSON.stringify(debouncedFilters) !== JSON.stringify(currentUrlFilters);

      if (hasChanged) {
        onSearch(debouncedFilters);
      }
    }
  }, [debouncedFilters, onSearch, locationUrl.pathname]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Hide suggestions if user starts typing
    if (name === 'keyword' && value) {
      setShowSuggestions(false);
    }

    // When city changes, reset district
    if (name === 'location') {
      setFilters(prev => ({ ...prev, location: value, district: '' }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFilters(prev => ({ ...prev, keyword: suggestion }));
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false); // Hide suggestions on submit
    // For homepage, search is triggered by button click immediately by navigating to the directory page
    if (!locationUrl.pathname.startsWith('/directory')) {
      const params = new URLSearchParams();
      if (filters.keyword) params.set('keyword', filters.keyword);
      if (filters.category) params.set('category', filters.category);
      if (filters.location) params.set('location', filters.location);
      if (filters.district) params.set('district', filters.district);
      navigate(`/directory?${params.toString()}`);
    } else {
      // On directory page, button click also triggers an immediate search, bypassing the debounce
      onSearch(filters);
    }
  };

  return (
    <div className="w-full">
      {showTitle && <h2 className="text-3xl md:text-4xl font-bold font-serif text-center mb-6">Tìm kiếm cơ sở làm đẹp uy tín</h2>}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        <div className="lg:col-span-2 relative">
          <input
            type="text"
            name="keyword"
            placeholder="Tên, dịch vụ, từ khóa (vd: massage bầu)..."
            value={filters.keyword}
            onChange={handleInputChange}
            onFocus={() => { if (!filters.keyword) setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // Delay to allow click on suggestions
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-neutral-dark"
            autoComplete="off"
          />
          {showSuggestions && filters.keyword === '' && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <p className="text-xs font-semibold text-gray-500 p-2 border-b">Gợi ý tìm kiếm</p>
              <ul>
                {POPULAR_SEARCH_SUGGESTIONS.map(suggestion => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm text-neutral-dark hover:bg-gray-100"
                      onMouseDown={() => handleSuggestionClick(suggestion)} // Use onMouseDown to fire before onBlur
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div>
          <select
            name="category"
            value={filters.category}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-neutral-dark"
          >
            <option value="">Tất cả lĩnh vực</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            name="location"
            value={filters.location}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-neutral-dark"
          >
            <option value="">Toàn quốc</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <select
            name="district"
            value={filters.district}
            onChange={handleInputChange}
            disabled={!filters.location || districts.length === 0}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-neutral-dark disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Quận/Huyện</option>
            {districts.map((dist) => (
              <option key={dist} value={dist}>{dist}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full md:col-span-2 lg:col-span-4 bg-primary text-white px-8 py-3 rounded-md font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center disabled:bg-primary/50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang tìm...
            </>
          ) : (
            'Tìm kiếm'
          )}
        </button>
      </form>
    </div>
  );
};

export default SearchBar;