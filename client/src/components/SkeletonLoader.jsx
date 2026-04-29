import React from 'react';

/**
 * Skeleton Loader Component
 * Provides smooth, animated placeholder components for loading states
 * Consistent with The Quality Pulse's premium dark/yellow design
 */

export const SkeletonBox = ({ className = '', variant = 'default' }) => {
  const baseClasses = 'animate-pulse rounded-lg';
  const variants = {
    default: 'bg-slate-200 dark:bg-slate-700',
    yellow: 'bg-yellow-500/20 dark:bg-yellow-500/10',
    darker: 'bg-slate-300 dark:bg-slate-800',
  };

  return <div className={`${baseClasses} ${variants[variant]} ${className}`} />;
};

export const SkeletonRow = ({ columns = 5 }) => (
  <div className="flex items-center gap-4 py-4 px-6 border-b border-slate-100 dark:border-slate-800 animate-pulse">
    {[...Array(columns)].map((_, i) => (
      <div
        key={i}
        className={`h-4 bg-slate-200 dark:bg-slate-700 rounded-full ${
          i === 0 ? 'w-1/4' : 'flex-1'
        }`}
      />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 5 }) => (
  <div className="w-full bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg">
    <div className="bg-slate-50 dark:bg-slate-900/50 py-3 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4">
      {[...Array(columns)].map((_, i) => (
        <div
          key={i}
          className={`h-3 bg-slate-300 dark:bg-slate-600 rounded-full ${i === 0 ? 'w-1/4' : 'flex-1'}`}
        />
      ))}
    </div>
    {[...Array(rows)].map((_, i) => (
      <SkeletonRow key={i} columns={columns} />
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-md animate-pulse">
    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 mb-4" />
    <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-full mb-3" />
    <div className="h-4 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full mb-2" />
    <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-700/50 rounded-full" />
    <div className="mt-6 flex justify-between items-center">
      <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      <div className="h-6 w-16 bg-slate-100 dark:bg-slate-700 rounded-full" />
    </div>
  </div>
);

export const SkeletonStats = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm animate-pulse"
      >
        <div className="h-4 w-20 bg-slate-100 dark:bg-slate-700/50 rounded-full mb-3" />
        <div className="h-8 w-10 bg-yellow-500/20 dark:bg-yellow-500/10 rounded-lg" />
      </div>
    ))}
  </div>
);

export default {
  SkeletonBox,
  SkeletonRow,
  SkeletonTable,
  SkeletonCard,
  SkeletonStats,
};
