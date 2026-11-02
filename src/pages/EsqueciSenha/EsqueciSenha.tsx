import { useState } from 'react';
import { Leaf } from 'lucide-react';
import cadastroStyles from '../Cadastro/cadastro.module.scss';
import styles from './EsqueciSenha.module.scss';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem(`Enviamos um código de recuperação para ${email}.`);
  }

  return (
    <main
      className={`${cadastroStyles['cadastro-container']} ${styles['recuper-container']}`}
    >
      <form
        className={`${cadastroStyles['cadastro-card']} ${styles.recuperCard}`}
        onSubmit={handleSubmit}
      >
        <div className={cadastroStyles.logo}>
          <div className={cadastroStyles.logoIcon}>
            <Leaf size={28} />
          </div>
          <h2>IAgroTech</h2>
        </div>

        <h1>Recuperar senha</h1>

        <p className={cadastroStyles.subtitle}>
          Digite seu e-mail para receber um código de recuperação.
        </p>

        <label>
          E-mail
          <div className={cadastroStyles['input-wrapper']}>
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
        </label>

        {mensagem && (
          <p className={styles['success-message']}>{mensagem}</p>
        )}

        <button type="submit" className={styles.submitButton}>Enviar código</button>

        <p className={cadastroStyles['login-link']}>
          Lembrou sua senha? <a href="/login">Entrar</a>
        </p>
      </form>
    </main>
  );
}
