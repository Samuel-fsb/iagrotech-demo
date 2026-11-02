import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button/Button';
import { BrandLogo } from '../../components/common/BrandLogo/BrandLogo';
import styles from './Login.module.scss';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loggedUser = await login(email, password);
      navigate(loggedUser.role === 'ADMIN' ? '/admin/usuarios' : '/dashboard', { replace: true });
    } catch (err) {
      setError('E-mail ou senha inválidos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setEmail('demo@iagrotech.com.br');
    setPassword('demo123');
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logo}>
          <BrandLogo className={styles.logoImage} />
        </div>
        
        <h2>Bem-vindo de volta!</h2>
        <p>Acesse sua conta para gerenciar sua propriedade.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Link className={styles.forgotLink} to="/recuperar-senha">
            Esqueci minha senha
          </Link>

          <Button type="submit" fullWidth isLoading={isLoading}>
            Entrar
          </Button>

          <Button variant="ghost" fullWidth onClick={handleDemoLogin}>
            Preencher dados de demonstração
          </Button>
        </form>
        <p className={styles.authLink}>
          Ainda não tem conta? <Link to="/registrar">Criar cadastro</Link>
        </p>
        <p className={styles.authLink}>
          Quer conhecer primeiro? <Link to="/sobre">Ver funcionalidades e planos</Link>
        </p>
      </div>
    </div>
  );
}
