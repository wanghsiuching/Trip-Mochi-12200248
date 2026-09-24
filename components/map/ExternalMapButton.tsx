import React from 'react';
import { ExternalLink, Navigation, MapPin } from 'lucide-react';
import { GeoCoordinate, GoogleMapsUrlBuilder } from './MapProvider';

interface ExternalMapButtonProps {
  coordinates?: GeoCoordinate;
  title?: string;
  address?: string;
  multiStops?: GeoCoordinate[];
  origin?: GeoCoordinate;
  destination?: GeoCoordinate;
  variant?: 'icon' | 'compact' | 'full' | 'banner';
  label?: string;
  className?: string;
}

export const ExternalMapButton: React.FC<ExternalMapButtonProps> = ({
  coordinates,
  title,
  address,
  multiStops,
  origin,
  destination,
  variant = 'compact',
  label,
  className = ''
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    let targetUrl = '';

    if (multiStops && multiStops.length > 0) {
      targetUrl = GoogleMapsUrlBuilder.multiStopUrl(multiStops);
    } else if (origin && destination) {
      targetUrl = GoogleMapsUrlBuilder.directionUrl(origin, destination);
    } else if (coordinates) {
      targetUrl = GoogleMapsUrlBuilder.searchUrl(coordinates, title);
    } else if (address || title) {
      const query = [address, title].filter(Boolean).join(' ');
      targetUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={label || '在 Google Maps 開啟'}
        className={`p-2 rounded-xl bg-white border border-[#E0E5D5] text-[#5B8266] hover:bg-[#88C9A1]/10 hover:border-[#88C9A1] active:scale-95 transition-all shadow-sm flex items-center justify-center ${className}`}
      >
        <ExternalLink size={16} strokeWidth={2.4} />
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`px-2.5 py-1.5 rounded-xl bg-white border border-[#E0E5D5] text-[#4A3E3D] hover:text-[#5B8266] hover:border-[#88C9A1] text-xs font-bold active:scale-95 transition-all shadow-sm inline-flex items-center gap-1.5 ${className}`}
      >
        <Navigation size={13} className="text-[#88C9A1]" strokeWidth={2.5} />
        <span>{label || 'Google Maps'}</span>
      </button>
    );
  }

  if (variant === 'banner') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`w-full py-2.5 px-3 rounded-2xl bg-[#5B8266] hover:bg-[#4E7257] active:scale-[0.98] text-white text-xs font-bold transition-all shadow-hard-sm-sage flex items-center justify-center gap-2 ${className}`}
      >
        <Navigation size={15} strokeWidth={2.6} />
        <span>{label || '開啟整日多點導航路線'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-3 py-2 rounded-xl bg-sage/10 text-cocoa border border-sage/30 hover:bg-sage/20 text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 ${className}`}
    >
      <MapPin size={14} className="text-sage" />
      <span>{label || '查看 Google Maps 實景與導航'}</span>
      <ExternalLink size={12} className="text-gray-400 ml-0.5" />
    </button>
  );
};
