import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  delay?: number;
}

export function Skeleton({ 
  className, 
  variant = 'rectangular', 
  width, 
  height,
  delay = 0
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
    rounded: 'rounded-lg'
  };

  const style = {
    width: width,
    height: height,
    animationDelay: `${delay}ms`
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={style}
    />
  );
}

// Predefined skeleton components for common use cases
export function SkeletonText({ className, lines = 1, delay = 0 }: { className?: string; lines?: number; delay?: number }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          delay={delay + (i * 100)}
          className={cn(
            "mb-2",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonTile({ delay = 0 }: { delay?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-4">
        <Skeleton variant="rounded" width={48} height={48} delay={delay + 100} />
      </div>
      <Skeleton variant="text" className="h-6 mb-2 w-3/4" delay={delay + 200} />
      <SkeletonText lines={2} className="mb-6" delay={delay + 300} />
      <div className="flex items-center justify-end">
        <Skeleton variant="circular" width={16} height={16} delay={delay + 400} />
      </div>
    </div>
  );
}

export function SkeletonTopBar() {
  return (
    <div className="fixed top-0 left-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo skeleton */}
        <div className="flex items-center space-x-3">
          <Skeleton variant="rounded" width={32} height={32} delay={0} />
          <Skeleton variant="text" width={80} height={24} delay={100} />
        </div>
        
        {/* Navigation skeleton */}
        <div className="flex items-center space-x-6">
          <Skeleton variant="text" width={40} height={16} delay={200} />
          <Skeleton variant="text" width={40} height={16} delay={300} />
          <div className="flex items-center space-x-2">
            <Skeleton variant="circular" width={24} height={24} delay={400} />
            <Skeleton variant="text" width={60} height={16} delay={500} />
            <Skeleton variant="circular" width={12} height={12} delay={600} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center">
          <Skeleton variant="text" className="h-12 mb-4 w-96 mx-auto" delay={0} />
          <Skeleton variant="text" className="h-6 w-2/3 mx-auto" delay={200} />
        </div>
      </div>
    </section>
  );
}

export function SkeletonServicesGrid() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <Skeleton variant="text" className="h-8 mb-4 w-48" delay={0} />
          <Skeleton variant="text" className="h-5 w-80" delay={100} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonTile key={i} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
} 