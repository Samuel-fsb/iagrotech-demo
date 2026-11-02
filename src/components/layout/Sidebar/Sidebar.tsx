// ============================================
// Sidebar Component
// ============================================

import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  DollarSign,
  Sprout,
  Bird,
  Package,
  Calendar,
  BookOpen,
  Bell,
  Bot,
  Settings,
  User,
} from 'lucide-react';
import { BrandLogo } from '../../common/BrandLogo/BrandLogo';
import { useAuth } from '../../../hooks/useAuth';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavItems = [
  { path: '/dashboard', label: 'Início', icon: Home },
  { path: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { path: '/plantacoes', label: 'Plantações', icon: Sprout },
  { path: '/criacoes', label: 'Criações', icon: Bird },
  { path: '/estoque', label: 'Estoque', icon: Package },
  { path: '/calendario', label: 'Calendário', icon: Calendar },
];

const infoNavItems = [
  { path: '/ia', label: 'Assistente IA (demo)', icon: Bot },
  { path: '/informacoes', label: 'Informações', icon: BookOpen },
  { path: '/alertas', label: 'Alertas', icon: Bell },
];

const settingsNavItems = [
  { path: '/perfil', label: 'Perfil', icon: User },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout, isDemoMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login', { replace: true });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles['overlay--visible'] : ''}`}
        onClick={onClose}
      />
      <aside className={`${styles.sidebar} ${isOpen ? styles['sidebar--open'] : ''}`}>
        {/* Logo */}
        <div className={styles.sidebar__logo}>
          <BrandLogo className={styles['sidebar__logo-image']} variant="surface" />
        </div>

        {/* Navigation */}
        <nav className={styles.sidebar__nav}>
          {/* Principal */}
          <div className={styles.sidebar__section}>
            <div className={styles['sidebar__section-label']}>Principal</div>
            {mainNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={`${styles.sidebar__item} ${
                  isActive(item.path) ? styles['sidebar__item--active'] : ''
                }`}
                onClick={onClose}
              >
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Informações */}
          <div className={styles.sidebar__section}>
            <div className={styles['sidebar__section-label']}>Informações</div>
            {infoNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={`${styles.sidebar__item} ${
                  isActive(item.path) ? styles['sidebar__item--active'] : ''
                }`}
                onClick={onClose}
              >
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Configurações */}
          <div className={styles.sidebar__section}>
            <div className={styles['sidebar__section-label']}>Conta</div>
            {settingsNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={`${styles.sidebar__item} ${
                  isActive(item.path) ? styles['sidebar__item--active'] : ''
                }`}
                onClick={onClose}
              >
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div className={styles.sidebar__user}>
          <div className={styles['sidebar__user-avatar']}>
            {user ? getInitials(user.name) : 'U'}
          </div>
          <div className={styles['sidebar__user-info']}>
            <div className={styles['sidebar__user-name']}>
              {user?.name || 'Usuário'}
            </div>
            <span
              className={`${styles['sidebar__user-plan']} ${
                user?.plan === 'PREMIUM'
                  ? styles['sidebar__user-plan--premium']
                  : styles['sidebar__user-plan--free']
              }`}
            >
              {isDemoMode ? 'Demonstração' : user?.plan === 'PREMIUM' ? '★ Premium' : 'Free'}
            </span>
          </div>
          {!isDemoMode && (
            <button
              type="button"
              className={styles.sidebar__logout}
              onClick={handleLogout}
              aria-label="Sair"
              title="Sair"
            >
              <span aria-hidden="true">↪</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
