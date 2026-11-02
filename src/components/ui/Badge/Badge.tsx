// ============================================
// Badge Component
// ============================================

import type { ReactNode } from 'react';
import styles from './Badge.module.scss';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ variant = 'neutral', children, dot = false, className = '' }: BadgeProps) {
  const classes = [styles.badge, styles[`badge--${variant}`], className].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {dot && <span className={styles.badge__dot} />}
      {children}
    </span>
  );
}
