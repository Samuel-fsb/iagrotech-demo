// ============================================
// MainLayout Component
// ============================================

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { Header } from '../Header/Header';
import { DemoBanner } from '../../common/DemoBanner/DemoBanner';
import styles from './MainLayout.module.scss';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen((prev) => !prev)} />
      <main className={styles.layout__content}>
        <DemoBanner />
        <Outlet />
      </main>
    </div>
  );
}
