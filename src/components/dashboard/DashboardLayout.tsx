import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Main dashboard layout wrapper.
 * Provides consistent spacing and max-width.
 */
export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className={cn('max-w-7xl mx-auto', className)}>
      {children}
    </div>
  );
}

interface BlockGridProps {
  children: ReactNode;
  /** Number of columns on desktop */
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * Grid layout for dashboard blocks.
 * Responsive: 1 col on mobile, specified cols on desktop.
 */
export function BlockGrid({ children, cols = 2, className }: BlockGridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', colClasses[cols], className)}>
      {children}
    </div>
  );
}

interface BlockStackProps {
  children: ReactNode;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Vertical stack of blocks.
 */
export function BlockStack({ children, gap = 'md', className }: BlockStackProps) {
  const gapClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
  };

  return (
    <div className={cn(gapClasses[gap], className)}>
      {children}
    </div>
  );
}
