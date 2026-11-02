import { Link } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Handshake,
  LineChart,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  Sprout,
  UsersRound,
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { DEMO_MODE } from '../../config/demo';
import { BrandLogo } from '../../components/common/BrandLogo/BrandLogo';
import styles from './About.module.scss';

const features = [
  {
    icon: LineChart,
    title: 'Financeiro',
    description: 'Controle receitas, despesas, resultado da propriedade e histórico de movimentações.',
  },
  {
    icon: Sprout,
    title: 'Plantações',
    description: 'Acompanhe culturas, áreas plantadas, previsão de colheita, custos e estágio produtivo.',
  },
  {
    icon: UsersRound,
    title: 'Criações',
    description: 'Organize lotes, rebanhos, alimentação, vacinação e produção animal.',
  },
  {
    icon: PackageCheck,
    title: 'Estoque',
    description: 'Monitore insumos, quantidades mínimas, validade, localização e itens em baixa.',
  },
  {
    icon: CalendarDays,
    title: 'Calendário',
    description: 'Planeje atividades de campo, manutenção, vacinação, irrigação e colheita.',
  },
  {
    icon: Bell,
    title: 'Alertas',
    description: 'Receba avisos importantes sobre estoque, tarefas próximas e pontos de atenção.',
  },
];

const partners = [
  {
    name: 'Cooperativas rurais',
    description: 'Apoio para produtores que trabalham em rede, compartilham insumos e acompanham resultados por propriedade.',
  },
  {
    name: 'Assistência técnica',
    description: 'Profissionais e consultorias que usam dados de campo para orientar manejo, estoque e planejamento.',
  },
  {
    name: 'Fornecedores de insumos',
    description: 'Empresas parceiras para conectar controle de estoque, compras e reposição de produtos essenciais.',
  },
];

export function About() {
  return (
    <div className={styles.aboutPage}>
      <header className={styles.topbar}>
        <Link to="/sobre" className={styles.brand}>
          <BrandLogo className={styles.logoImage} />
        </Link>
        <nav className={styles.nav}>
          {DEMO_MODE ? <Link to="/dashboard">Acessar demonstração</Link> : <><Link to="/login">Login</Link><Link to="/registrar">Cadastrar</Link></>}
        </nav>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h1>Gestão rural simples para controlar sua propriedade em um só lugar</h1>
            <p>
              O IAgroTech reúne financeiro, plantações, criações, estoque, calendário e informações agrícolas.
              Nesta versão de portfólio, você pode explorar os fluxos sem cadastro, usando dados fictícios salvos apenas no navegador.
            </p>
            <div className={styles.heroActions}>
              <Link to={DEMO_MODE ? "/dashboard" : "/registrar"}>
                <Button icon={<ChevronRight size={18} />}>{DEMO_MODE ? 'Explorar demonstração' : 'Criar cadastro'}</Button>
              </Link>
              {!DEMO_MODE && <Link to="/login"><Button variant="outline">Já tenho conta</Button></Link>}
            </div>
          </div>
          <div className={styles.heroPanel}>
            <div>
              <small>Resultado do mês</small>
              <strong>R$ 7.957,00</strong>
            </div>
            <div>
              <small>Itens monitorados</small>
              <strong>Estoque, safra e agenda</strong>
            </div>
            <div>
              <small>{DEMO_MODE ? 'Acesso' : 'Plano inicial'}</small>
              <strong>{DEMO_MODE ? 'Sem cadastro · Demo' : 'Free por 30 dias'}</strong>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Funcionalidades</h2>
            <p>Recursos pensados para o dia a dia de quem precisa registrar, consultar e decidir rápido.</p>
          </div>
          <div className={styles.featureGrid}>
            {features.map((feature) => (
              <article className={styles.featureCard} key={feature.title}>
                <feature.icon size={22} />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>{DEMO_MODE ? 'Sobre esta demonstração' : 'Planos'}</h2>
            <p>{DEMO_MODE ? 'Autenticação, assinaturas e pagamentos não estão habilitados nesta versão de portfólio.' : 'Escolha começar testando ou já liberar acesso contínuo aos módulos do sistema.'}</p>
          </div>
          {DEMO_MODE ? (
            <div className={styles.planGrid}>
              <article className={styles.planCard}>
                <div className={styles.planTitle}><h3>Dados fictícios</h3><span>Local</span></div>
                <strong>Sem conta</strong>
                <ul>
                  <li><Check size={16} /> Acesso direto ao dashboard</li>
                  <li><Check size={16} /> Operações simuladas nos módulos</li>
                  <li><Check size={16} /> Alterações salvas neste navegador</li>
                </ul>
                <Link to="/dashboard"><Button variant="outline" fullWidth>Entrar na demonstração</Button></Link>
              </article>
              <article className={`${styles.planCard} ${styles.planCardFeatured}`}>
                <div className={styles.planTitle}><h3>Recursos desativados</h3><span>Transparência</span></div>
                <strong>Sem cobrança</strong>
                <ul>
                  <li><Check size={16} /> Sem autenticação real</li>
                  <li><Check size={16} /> Sem banco de dados ou sincronização</li>
                  <li><Check size={16} /> Sem assinatura ou pagamento</li>
                </ul>
                <Link to="/dashboard"><Button fullWidth>Conhecer o sistema</Button></Link>
              </article>
            </div>
          ) : (
            <div className={styles.planGrid}>
              <article className={styles.planCard}>
                <div className={styles.planTitle}><h3>Free</h3><span>30 dias</span></div>
                <strong>R$ 0,00</strong>
                <ul><li><Check size={16} /> Teste do sistema por um mês</li><li><Check size={16} /> Acesso aos módulos principais</li><li><Check size={16} /> Cadastro de propriedade e operações</li></ul>
                <Link to="/registrar"><Button variant="outline" fullWidth>Começar grátis</Button></Link>
              </article>
              <article className={`${styles.planCard} ${styles.planCardFeatured}`}>
                <div className={styles.planTitle}><h3>Premium</h3><span>Completo</span></div>
                <strong>R$ 49,90/mês</strong>
                <ul><li><Check size={16} /> Uso contínuo do sistema</li><li><Check size={16} /> Todos os módulos liberados</li><li><Check size={16} /> Alertas, calendário e gestão completa</li></ul>
                <Link to="/registrar"><Button icon={<CreditCard size={18} />} fullWidth>Assinar Premium</Button></Link>
              </article>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>{DEMO_MODE ? 'Ecossistema previsto' : 'Empresas parceiras'}</h2>
            <p>{DEMO_MODE ? 'Exemplos de perfis que a proposta original do produto considera; não representam parcerias comerciais ativas.' : 'Trabalhamos para aproximar produtores de parceiros que fortalecem a gestão e a rotina no campo.'}</p>
          </div>
          <div className={styles.partnerGrid}>
            {partners.map((partner) => (
              <article className={styles.partnerCard} key={partner.name}>
                <Handshake size={22} />
                <h3>{partner.name}</h3>
                <p>{partner.description}</p>
              </article>
            ))}
          </div>
        </section>

        {DEMO_MODE ? (
          <section className={styles.contactSection}>
            <div>
              <h2>Projeto de hackathon</h2>
              <p>O IAgroTech nasceu como um projeto colaborativo. Esta versão independente foi preparada para demonstrar os fluxos do frontend com dados fictícios e sem infraestrutura de produção.</p>
            </div>
          </section>
        ) : (
          <section className={styles.contactSection}>
            <div><h2>Entre em contato</h2><p>Fale com a equipe IAgroTech para tirar dúvidas, conhecer planos ou conversar sobre parcerias.</p></div>
            <div className={styles.contactGrid}>
              <a href="mailto:contato@iagrotech.com.br"><Mail size={20} /><span>contato@iagrotech.com.br</span></a>
              <a href="tel:+5516999990000"><Phone size={20} /><span>(16) 99999-0000</span></a>
              <div><MapPin size={20} /><span>Atendimento online para produtores rurais</span></div>
            </div>
          </section>
        )}

        <section className={styles.cta}>
          <ShieldCheck size={24} />
          <div>
            <h2>{DEMO_MODE ? 'Conheça o IAgroTech' : 'Pronto para organizar sua propriedade?'}</h2>
            <p>{DEMO_MODE ? 'Explore os módulos sem criar uma conta. Todos os dados desta versão são fictícios.' : 'Crie sua conta e escolha o plano que combina com sua rotina.'}</p>
          </div>
          <Link to={DEMO_MODE ? "/dashboard" : "/registrar"}>
            <Button>{DEMO_MODE ? 'Acessar demonstração' : 'Cadastrar agora'}</Button>
          </Link>
        </section>
      </main>
    </div>
  );
}
