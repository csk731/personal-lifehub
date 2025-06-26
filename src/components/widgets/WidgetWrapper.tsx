'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import { ExternalLink, ChevronDown } from 'lucide-react';

interface Widget {
  id: string;
  width: number;
  height: number;
  name: string;
}

interface WidgetWrapperProps {
  widget: Widget;
  children: ReactNode;
  className?: string;
  onViewMore?: () => void;
  showViewMore?: boolean;
}

export function WidgetWrapper({ widget, children, className = '', onViewMore, showViewMore = false }: WidgetWrapperProps) {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if content overflows after render
  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current) {
        const isOverflow = contentRef.current.scrollHeight > contentRef.current.clientHeight;
        setIsOverflowing(isOverflow);
      }
    };

    // Check immediately
    checkOverflow();

    // Check again after a short delay to ensure content is fully rendered
    const timer = setTimeout(checkOverflow, 100);

    return () => clearTimeout(timer);
  }, [children]);

  // Simple wrapper that works with column layout
  const baseClasses = 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md break-inside-avoid flex flex-col relative';
  
  return (
    <div className={`${baseClasses} ${className}`}>
      {/* View More Button - Always in top right */}
      {onViewMore && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={onViewMore}
            className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors shadow-lg opacity-80 hover:opacity-100"
            title="View Full Dashboard"
          >
            <span>View All</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}
      
      <div 
        ref={contentRef}
        className="flex-1 overflow-hidden"
        style={{ maxHeight: '24rem' }} // 384px max height
      >
        {children}
      </div>
      
      {/* View More Overlay - Only show if content overflows */}
      {isOverflowing && onViewMore && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent h-16 flex items-end justify-center pb-2">
          <button
            onClick={onViewMore}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <span>View More</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
} 