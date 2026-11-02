// ============================================
// Header Component
// ============================================

import { Link } from 'react-router-dom';
import { Menu, Search, Bell } from 'lucide-react';
import styles from './Header.module.scss';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.header__left}>
        <button
          className={styles.header__menuBtn}
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>

        <div className={styles.header__search}>
          <div className={styles['header__search-icon']}>
            <Search />
          </div>
          <input
            type="text"
            className={styles['header__search-input']}
            placeholder="Buscar..."
            aria-label="Buscar"
          />
        </div>
      </div>

      <div className={styles.header__right}>
        <Link to="/alertas" className={styles.header__iconBtn} aria-label="Abrir central de alertas" title="Alertas">
          <Bell />
        </Link>
      </div>
    </header>
  );
}
