import { useState } from 'react';
import styles from './cadastro.module.scss';
import logo from '../../assets/logo.svg';

type CampoProps = {
  label: string;
  type?: string;
  placeholder: string;
  icon: React.ReactNode;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  minLength?: number;
};

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg
    className={styles['input-icon']}
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

function Campo({ label, type = 'text', placeholder, icon, ...props }: CampoProps) {
  return (
    <label>
      {label}
        <div className={styles['input-wrapper']}>
        {icon}
        <input type={type} placeholder={placeholder} required {...props} />
      </div>
    </label>
  );
}

export default function Cadastro() {
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (senha !== confirmacao) {
      setErro('As senhas não coincidem.');
      return;
    }

    setErro('');
    alert('Cadastro realizado com sucesso!');
  }

  return (
    <main className={styles['cadastro-container']}>
      <form className={styles['cadastro-card']} onSubmit={handleSubmit}>
        <div className={styles.logo}>
          <img src={logo} alt="IAgroTech" className={styles.logoImage} />
        </div>

        <h1>Criar conta</h1>
        <p className={styles.subtitle}>Preencha seus dados para continuar</p>

        <div className={styles['form-row']}>
          <Campo
            label="Nome"
            placeholder="Digite seu nome"
            icon={<Icon><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3-6 8-6s8 2 8 6" /></Icon>}
          />
          <Campo
            label="Sobrenome"
            placeholder="Digite seu sobrenome"
            icon={<Icon><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3-6 8-6s8 2 8 6" /></Icon>}
          />
        </div>

        <Campo
          label="E-mail"
          type="email"
          placeholder="seuemail@exemplo.com"
          icon={<Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>}
        />
        <Campo
          label="Senha"
          type="password"
          placeholder="Digite sua senha"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          minLength={6}
          icon={<Icon><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Icon>}
        />
        <Campo
          label="Confirmação de senha"
          type="password"
          placeholder="Confirme sua senha"
          value={confirmacao}
          onChange={(event) => setConfirmacao(event.target.value)}
          icon={<Icon><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Icon>}
        />

        {erro && <span className={styles['error-message']}>{erro}</span>}

        <button type="submit">Cadastrar</button>

        <p className={styles['login-link']}>
          Já possui uma conta? <a href="/login">Entrar</a>
        </p>
      </form>
    </main>
  );
}
