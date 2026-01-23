
import React, { useEffect, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Business, BusinessCategory } from '../types.ts';
import MapBusinessCard from './MapBusinessCard.tsx';

interface DirectoryMapProps {
    businesses: Business[];
    highlightedBusinessId: number | null;
    selectedBusinessId: number | null;
    onBoundsChange: (bounds: unknown) => void;
    onMarkerClick: (businessId: number) => void;
    onPopupClose: () => void;
    onMarkerMouseEnter: (businessId: number) => void;
    onMarkerMouseLeave: () => void;
    shouldFitBounds: boolean;
    centerCoords?: [number, number] | null;
}

const DirectoryMap: React.FC<DirectoryMapProps> = ({ businesses, highlightedBusinessId, selectedBusinessId, onBoundsChange, onMarkerClick, onPopupClose, onMarkerMouseEnter, onMarkerMouseLeave, shouldFitBounds, centerCoords }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null); // To hold the Leaflet map instance
    const markersRef = useRef<{ [key: number]: L.Marker }>({}); // To hold marker instances

    // --- Custom Category Icons ---
    const categoryIcons: Record<string, string> = React.useMemo(() => ({
        [BusinessCategory.SPA]: `<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />`, // Heart
        [BusinessCategory.SALON]: `<g transform="scale(1.2) translate(-2 -2)"><circle cx="6.5" cy="6" r="2.5"/><circle cx="6.5" cy="18" r="2.5"/><line x1="8" y1="7.5" x2="16" y2="16"/><line x1="8" y1="16.5" x2="16" y2="8"/></g>`, // Scissors
        [BusinessCategory.NAIL]: `<g transform="scale(1.1) translate(-1 -2)"><rect x="6" y="4" width="12" height="4" rx="1" /><path d="M8 9 L 16 9 L 14.5 20 L 9.5 20 Z" /></g>`, // Polish Bottle
        [BusinessCategory.CLINIC]: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6" />`, // Plus
        [BusinessCategory.DENTAL]: `<path d="M6 9 C6 4, 18 4, 18 9 C18 14, 15 15, 15 19 C15 22, 9 22, 9 19 C9 15, 6 14, 6 9 Z" />`, // Tooth
    }), []);

    const getIcon = React.useCallback((category: BusinessCategory, isHighlighted: boolean) => {
        const iconSvg = categoryIcons[category] || `<circle cx="12" cy="12" r="4" />`;
        const isFilled = category === BusinessCategory.DENTAL || category === BusinessCategory.NAIL;
        const fillColor = isFilled ? 'currentColor' : 'none';
        const strokeWidth = isFilled ? '0' : '2';

        const iconColor = isHighlighted ? '#4A4A4A' : '#BFA16A'; // secondary vs primary
        const size = isHighlighted ? 40 : 32;
        const animationClass = isHighlighted ? 'animate-bounce' : '';

        const pinPath = `M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.1.4-.27.6-.503.214-.249.4-.555.515-.874.114-.319.18-.684.188-1.085l.002-.18.001-.206v-.008a6 6 0 00-12 0v.008l.001.206.002.18c.008.401.074.766.188 1.085.115.319.3.625.515.874.2.233.415.403.6.503.095.054.192.103.281.14l.018.008.006.003z`;

        const html = `
        <div class="relative ${animationClass}" style="width:${size}px; height:${size}px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="${iconColor}" class="drop-shadow-lg">
                <path d="${pinPath}" />
            </svg>
            <div class="absolute top-[20%] left-1/2 -translate-x-1/2 w-[40%] h-[40%]" style="color: white;">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="${fillColor}"
                    stroke="currentColor"
                    stroke-width="${strokeWidth}"
                    viewBox="0 0 24 24"
                    style="overflow: visible;"
                >
                    ${iconSvg}
                </svg>
            </div>
        </div>`;

        return L.divIcon({
            html,
            className: 'bg-transparent border-0',
            iconSize: [size, size],
            iconAnchor: [size / 2, size],
            popupAnchor: [0, -size]
        });
    }, [categoryIcons]);

    // --- Map Initialization ---
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current, {
                center: [10.7769, 106.7009], // Default center on Ho Chi Minh City
                zoom: 12, // City-level zoom
                scrollWheelZoom: true,
            });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);

            mapRef.current.on('moveend', () => {
                if (mapRef.current) {
                    onBoundsChange(mapRef.current.getBounds());
                }
            });

            // Ensure map fills container correctly (fixes "Gray Area" issue)
            const forceResize = () => {
                if (mapRef.current) {
                    mapRef.current.invalidateSize();
                }
            };

            setTimeout(forceResize, 100);
            setTimeout(forceResize, 500); // Second pass for slower renders

            const handleResize = () => {
                if (mapRef.current) {
                    mapRef.current.invalidateSize();
                }
            };

            window.addEventListener('resize', handleResize);
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }
        return undefined;
    }, [onBoundsChange]);

    // --- Update Markers when businesses change ---
    useEffect(() => {
        if (!mapRef.current) return;

        // Clear old markers
        Object.values(markersRef.current).forEach((marker) => marker.remove());
        markersRef.current = {};

        const validBusinesses = businesses.filter(b => b.latitude && b.longitude);

        validBusinesses.forEach(business => {
            const popupContent = ReactDOMServer.renderToString(<MapBusinessCard business={business} />);
            const category = business?.categories?.[0] ?? BusinessCategory.SPA;
            const icon = getIcon(category, false);

            const marker = L.marker([business.latitude!, business.longitude!], { icon })
                .bindPopup(popupContent)
                .on('click', () => {
                    onMarkerClick(business.id);
                })
                .on('popupclose', () => {
                    onPopupClose();
                })
                .on('mouseover', () => {
                    onMarkerMouseEnter(business.id);
                })
                .on('mouseout', () => {
                    onMarkerMouseLeave();
                });

            if (mapRef.current) {
                marker.addTo(mapRef.current);
            }

            markersRef.current[business.id] = marker;
        });

        // Fit map to markers only if a search is active
        if (shouldFitBounds && validBusinesses.length > 0) {
            const group = L.featureGroup(Object.values(markersRef.current));
            if (mapRef.current) {
                mapRef.current.fitBounds(group.getBounds().pad(0.2));
            }
        }

    }, [businesses, shouldFitBounds, onMarkerClick, onPopupClose, onMarkerMouseEnter, onMarkerMouseLeave, getIcon]);

    // --- Handle Center Coords (Search Sync) ---
    useEffect(() => {
        if (mapRef.current && centerCoords) {
            mapRef.current.flyTo(centerCoords, 13, {
                animate: true,
                duration: 1.5
            });
        }
    }, [centerCoords]);

    // --- Handle Selection (Click) ---
    useEffect(() => {
        if (!mapRef.current) return;

        if (selectedBusinessId && markersRef.current[selectedBusinessId]) {
            const selectedMarker = markersRef.current[selectedBusinessId];
            if (!selectedMarker.isPopupOpen()) {
                selectedMarker.openPopup();
            }
            // Pan smoothly to the marker
            mapRef.current.flyTo(selectedMarker.getLatLng(), mapRef.current.getZoom());
        }
    }, [selectedBusinessId]);

    // --- Handle Highlighting (Hover or Selection) ---
    useEffect(() => {
        if (!mapRef.current) return;

        Object.keys(markersRef.current).forEach(idStr => {
            const id = Number(idStr);
            const business = businesses.find(b => b.id === id);
            if (business && markersRef.current[id]) {
                const isHighlighted = id === highlightedBusinessId || id === selectedBusinessId;
                const category = business?.categories?.[0] ?? BusinessCategory.SPA;
                markersRef.current[id].setIcon(getIcon(category, isHighlighted));

                // Bring active marker to front. Hovered is on top of selected.
                if (isHighlighted) {
                    const zOffset = id === highlightedBusinessId ? 1000 : 900;
                    markersRef.current[id].setZIndexOffset(zOffset);
                } else {
                    markersRef.current[id].setZIndexOffset(0);
                }
            }
        });

    }, [highlightedBusinessId, selectedBusinessId, businesses, getIcon]);

    return <div ref={mapContainerRef} className="h-full w-full relative z-10" />;
};

export default DirectoryMap;
