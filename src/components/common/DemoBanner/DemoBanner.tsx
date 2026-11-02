import { Info, RotateCcw } from 'lucide-react';
import { resetDemoState } from '../../../services/demo/demo.store';
import styles from './DemoBanner.module.scss';

export function DemoBanner() {
  const handleReset = () => {
    const confirmed = window.confirm('Restaurar os dados iniciais da demonstração? Todas as alterações feitas neste navegador serão perdidas.');
    if (!confirmed) return;
    resetDemoState();
    window.location.reload();
  };

  return (
    <aside className={styles.banner} aria-label="Aviso do ambiente demonstrativo">
      <div className={styles.message}>
        <Info size={18} aria-hidden="true" />
        <span>
          <strong>Ambiente demonstrativo:</strong> os dados são fictícios e as alterações ficam salvas somente neste navegador. Não use informações pessoais ou reais.
        </span>
      </div>
      <button type="button" className={styles.resetButton} onClick={handleReset}>
        <RotateCcw size={15} />
        Restaurar demo
      </button>
    </aside>
  );
}
