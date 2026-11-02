import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button/Button';
import { BrandLogo } from '../../components/common/BrandLogo/BrandLogo';
import { authService } from '../../services/auth.service';
import styles from '../Login/Login.module.scss';

export function ForgotPassword() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const form = new FormData(event.currentTarget);
    const nextEmail = String(form.get('email') || '').trim();

    setIsLoading(true);
    try {
      const response = await authService.requestPasswordReset(nextEmail);
      setEmail(nextEmail);
      setResetToken(response.devResetToken || '');
      setStep('reset');
      setSuccess(response.devResetToken
        ? 'Código gerado para ambiente local. Use o código preenchido abaixo.'
        : 'Se o e-mail existir, enviaremos um código de recuperação.');
    } catch {
      setError('Não foi possível iniciar a recuperação de senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirmPassword = String(form.get('confirmPassword') || '');
    const token = String(form.get('token') || '').trim();

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({ email, token, password });
      setSuccess('Senha atualizada com sucesso. Você já pode fazer login.');
      window.setTimeout(() => navigate('/login'), 1600);
    } catch {
      setError('Código inválido ou expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logo}>
          <BrandLogo className={styles.logoImage} />
        </div>

        <h2>Recuperar senha</h2>
        <p>Informe seu e-mail cadastrado e defina uma nova senha de acesso.</p>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        {step === 'request' ? (
          <form onSubmit={handleRequest} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">E-mail</label>
              <input id="email" name="email" type="email" placeholder="seu@email.com" required />
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>
              Gerar código
            </Button>
          </form>
        ) : (
          <form onSubmit={handleReset} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" value={email} disabled />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="token">Código de recuperação</label>
            <input id="token" name="token" value={resetToken} onChange={(event) => setResetToken(event.target.value)} required />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Nova senha</label>
            <input id="password" name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirmar nova senha</label>
            <input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} placeholder="Repita a senha" />
          </div>

          <Button type="submit" fullWidth isLoading={isLoading}>
            Atualizar senha
          </Button>
          </form>
        )}

        <p className={styles.authLink}>
          Lembrou sua senha? <Link to="/login">Voltar para login</Link>
        </p>
      </div>
    </div>
  );
}
