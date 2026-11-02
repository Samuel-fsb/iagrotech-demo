// ============================================
// Skeleton Component
// ============================================

import styles from './Skeleton.module.scss';

type SkeletonVariant = 'text' | 'title' | 'card' | 'chart' | 'circle';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ variant = 'text', width, height, className = '' }: SkeletonProps) {
  const classes = [styles.skeleton, styles[`skeleton--${variant}`], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
    />
  );
}

// === Dashboard Skeleton ===
export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <div>
        <Skeleton variant="title" width="300px" />
        <Skeleton variant="text" width="200px" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
      <Skeleton variant="chart" />
    </div>
  );
}
