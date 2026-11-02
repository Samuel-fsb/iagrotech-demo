import { Link } from 'react-router-dom';
import { BrandLogo } from '../../components/common/BrandLogo/BrandLogo';
import styles from './Legal.module.scss';

export function PrivacyPolicy() {
  return (
    <main className={styles.legalPage}>
      <section className={styles.legalCard}>
        <BrandLogo className={styles.logo} />
        <h1>Política de Privacidade</h1>
        <p>
          Esta versão do IAgroTech é uma demonstração de portfólio. Não há cadastro, autenticação real, conta de usuário ou serviço de backend ativo.
        </p>
        <h2>Dados utilizados nesta demonstração</h2>
        <p>O sistema inicia com informações fictícias. Se você editar o perfil ou os registros, os valores serão salvos somente no localStorage deste navegador. Não informe dados pessoais, senhas ou informações reais.</p>
        <h2>Armazenamento</h2>
        <p>Não há envio dos registros simulados para um servidor. Os dados ficam no navegador atual e podem ser removidos ao limpar os dados do site ou pelo botão “Restaurar demo” da aplicação.</p>
        <h2>Exportação</h2>
        <p>O perfil oferece uma exportação local dos dados demonstrativos em arquivo JSON. Essa exportação contém apenas o estado salvo nesta demonstração.</p>
        <h2>Limitações</h2>
        <p>Esta versão não implementa autenticação, autorização, criptografia de conta ou armazenamento de produção. Ela serve apenas para exploração de funcionalidades com dados fictícios.</p>
        <Link to="/dashboard">Voltar à demonstração</Link>
      </section>
    </main>
  );
}

export function TermsOfUse() {
  return (
    <main className={styles.legalPage}>
      <section className={styles.legalCard}>
        <BrandLogo className={styles.logo} />
        <h1>Termos de Uso</h1>
        <p>
          Esta aplicação é uma versão demonstrativa para fins de portfólio e avaliação das interfaces. Os registros exibidos são fictícios e não representam uma operação rural real.
        </p>
        <h2>Uso demonstrativo</h2>
        <p>Você pode explorar os módulos de financeiro, estoque, plantações, criações, calendário e alertas. As operações de inclusão, edição e remoção alteram somente os dados locais de demonstração.</p>
        <h2>Planos e pagamentos</h2>
        <p>Planos, assinaturas, pagamentos e cobranças estão desativados. Nenhuma transação financeira real pode ser realizada nesta versão.</p>
        <h2>Conta e segurança</h2>
        <p>Não existe conta ou senha nesta demonstração. Não utilize informações pessoais ou credenciais reais nos campos de edição disponíveis.</p>
        <h2>Recomendações e conteúdo</h2>
        <p>O assistente apresenta respostas pré-definidas e não utiliza um modelo de inteligência artificial nem substitui orientação técnica profissional. Não use a demonstração para tomar decisões agrícolas, financeiras ou veterinárias.</p>
        <Link to="/dashboard">Voltar à demonstração</Link>
      </section>
    </main>
  );
}
