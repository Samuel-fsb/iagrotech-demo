// ============================================
// Feedback State Components
// ============================================

import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from '../Button/Button';
import styles from './FeedbackStates.module.scss';

// === EmptyState ===
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyState__icon}>
        {icon || <Inbox />}
      </div>
      <h3 className={styles.emptyState__title}>{title}</h3>
      <p className={styles.emptyState__description}>{description}</p>
      {action}
    </div>
  );
}

// === ErrorState ===
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Erro ao carregar dados',
  description = 'Não foi possível carregar os dados. Tente novamente.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.errorState}>
      <div className={styles.errorState__icon}>
        <AlertTriangle />
      </div>
      <h3 className={styles.errorState__title}>{title}</h3>
      <p className={styles.errorState__description}>{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} icon={<RefreshCw size={16} />}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
