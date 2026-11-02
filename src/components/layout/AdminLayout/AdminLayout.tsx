import { Outlet, useNavigate } from 'react-router-dom';
import { FileText, LogOut, UsersRound } from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { BrandLogo } from '../../common/BrandLogo/BrandLogo';
import { useAuth } from '../../../hooks/useAuth';
import styles from './AdminLayout.module.scss';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.adminLayout}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <BrandLogo className={styles.logoImage} variant="compact" />
          <div>
            <strong>Admin IAgroTech</strong>
            <small>{user?.name ?? 'Administrador'}</small>
          </div>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" icon={<UsersRound size={16} />} onClick={() => navigate('/admin/usuarios')}>
            Usuários
          </Button>
          <Button variant="outline" icon={<FileText size={16} />} onClick={() => navigate('/admin/artigos')}>
            Artigos
          </Button>
          <Button variant="danger" icon={<LogOut size={16} />} onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
