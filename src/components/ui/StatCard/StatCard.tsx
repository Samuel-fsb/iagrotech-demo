// ============================================
// StatCard Component
// ============================================

import type { ReactNode } from 'react';
import styles from './StatCard.module.scss';

type StatCardColor = 'green' | 'blue' | 'orange' | 'red' | 'purple';

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  color?: StatCardColor;
  change?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  color = 'green',
  change,
  className = '',
}: StatCardProps) {
  const classes = [
    styles.statCard,
    styles[`statCard--${color}`],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className={styles.statCard__header}>
        <span className={styles.statCard__label}>{label}</span>
        <div className={styles.statCard__icon}>{icon}</div>
      </div>
      <div className={styles.statCard__value}>{value}</div>
      {change && (
        <span
          className={`${styles.statCard__change} ${
            change.positive
              ? styles['statCard__change--positive']
              : styles['statCard__change--negative']
          }`}
        >
          {change.positive ? '↑' : '↓'} {change.value}
        </span>
      )}
    </div>
  );
}
