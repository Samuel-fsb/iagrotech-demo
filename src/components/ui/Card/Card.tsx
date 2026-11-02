// ============================================
// Card Component
// ============================================

import type { ReactNode } from 'react';
import styles from './Card.module.scss';

interface CardProps {
  children: ReactNode;
  className?: string;
  flush?: boolean;
}

interface CardHeaderProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

interface CardSectionProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '', flush = false }: CardProps) {
  const classes = [
    styles.card,
    flush ? styles['card--flush'] : '',
    className,
  ].filter(Boolean).join(' ');

  return <div className={classes}>{children}</div>;
}

export function CardHeader({ title, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`${styles.card__header} ${className}`}>
      <h3>{title}</h3>
      {action}
    </div>
  );
}

export function CardBody({ children, className = '' }: CardSectionProps) {
  return <div className={`${styles.card__body} ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: CardSectionProps) {
  return <div className={`${styles.card__footer} ${className}`}>{children}</div>;
}
