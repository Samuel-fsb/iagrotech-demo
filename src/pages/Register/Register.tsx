import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, CreditCard, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { BrandLogo } from '../../components/common/BrandLogo/BrandLogo';
import { useAuth } from '../../hooks/useAuth';
import type { BillingCycle, PaymentMethodOption, Plan } from '../../types';
import styles from './Register.module.scss';

const premiumPrices: Record<BillingCycle, string> = {
  monthly: 'R$ 49,90/mês',
  annual: 'R$ 499,00/ano',
};

export function Register() {
  const [plan, setPlan] = useState<Plan>('FREE');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOption>('pix');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    const confirmPassword = String(form.get('confirmPassword'));

    if (password !== confirmPassword) {
      setError('As senhas informadas não conferem.');
      setIsLoading(false);
      return;
    }

    try {
      await register({
        name: String(form.get('name')),
        email: String(form.get('email')),
        phone: String(form.get('phone') || ''),
        propertyName: String(form.get('propertyName') || ''),
        password,
        plan,
        billingCycle: plan === 'PREMIUM' ? billingCycle : undefined,
        paymentMethod: plan === 'PREMIUM' ? paymentMethod : undefined,
        promoCode: String(form.get('promoCode') || '').trim(),
        privacyAccepted: form.get('privacyAccepted') === 'on',
      });
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Não foi possível criar sua conta. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerShell}>
        <section className={styles.intro}>
          <div className={styles.logo}>
            <BrandLogo className={styles.logoImage} variant="surface" />
          </div>
          <h2>Crie sua conta</h2>
          <p>Comece pelo plano Free por 30 dias ou escolha Premium para liberar a gestão completa desde o primeiro acesso.</p>
          <div className={styles.benefits}>
            <span><ShieldCheck /> Dados da propriedade protegidos</span>
            <span><Check /> Dashboard, estoque, financeiro e calendário</span>
            <span><CreditCard /> Pagamento simulado para integração futura</span>
          </div>
        </section>

        <form className={styles.formCard} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Nome completo</label>
              <input id="name" name="name" required placeholder="Seu nome" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email">E-mail</label>
              <input id="email" name="email" type="email" required placeholder="seu@email.com" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="phone">Telefone</label>
              <input id="phone" name="phone" placeholder="(00) 00000-0000" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="propertyName">Nome da propriedade</label>
              <input id="propertyName" name="propertyName" placeholder="Sítio, fazenda ou chácara" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password">Senha</label>
              <input id="password" name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirmar senha</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} placeholder="Repita a senha" />
            </div>
          </div>

          <fieldset className={styles.planSection}>
            <legend>Escolha seu plano</legend>
            <div className={styles.planGrid}>
              <button type="button" className={`${styles.planCard} ${plan === 'FREE' ? styles.planCardActive : ''}`} onClick={() => setPlan('FREE')}>
                <strong>Free</strong>
                <span>30 dias grátis</span>
                <small>Acesso ao sistema por um mês para testar os módulos principais.</small>
              </button>
              <button type="button" className={`${styles.planCard} ${plan === 'PREMIUM' ? styles.planCardActive : ''}`} onClick={() => setPlan('PREMIUM')}>
                <strong>Premium</strong>
                <span>{premiumPrices[billingCycle]}</span>
                <small>Uso contínuo com todos os módulos, alertas e assistente IA.</small>
              </button>
            </div>
          </fieldset>

          {plan === 'PREMIUM' && (
            <section className={styles.paymentPanel}>
              <div className={styles.inputGroup}>
                <label htmlFor="billingCycle">Plano Premium</label>
                <select id="billingCycle" value={billingCycle} onChange={(event) => setBillingCycle(event.target.value as BillingCycle)}>
                  <option value="monthly">Mensal - R$ 49,90/mês</option>
                  <option value="annual">Anual - R$ 499,00/ano</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="paymentMethod">Forma de pagamento</label>
                <select id="paymentMethod" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethodOption)}>
                  <option value="pix">PIX</option>
                  <option value="cartao_credito">Cartão de crédito</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
              {paymentMethod === 'cartao_credito' && (
                <>
                  <div className={styles.inputGroup}>
                    <label htmlFor="cardName">Nome no cartão</label>
                    <input id="cardName" name="cardName" placeholder="Como aparece no cartão" />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="cardLastDigits">Final do cartão</label>
                    <input id="cardLastDigits" name="cardLastDigits" inputMode="numeric" maxLength={4} placeholder="0000" />
                  </div>
                </>
              )}
            </section>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="promoCode">Código promocional</label>
            <input id="promoCode" name="promoCode" placeholder="Ex.: AGRO10" />
          </div>

          <label className={styles.consentBox}>
            <input id="privacyAccepted" name="privacyAccepted" type="checkbox" required />
            <span>
              Li e aceito a <Link to="/privacidade">Política de Privacidade</Link> e os <Link to="/termos">Termos de Uso</Link>, autorizando o tratamento dos meus dados para cadastro, assinatura e operação do sistema.
            </span>
          </label>

          <Button type="submit" fullWidth isLoading={isLoading}>
            {plan === 'FREE' ? 'Criar conta Free' : 'Criar conta Premium'}
          </Button>

          <p className={styles.authLink}>
            Já tem conta? <Link to="/login">Entrar</Link>
          </p>
          <p className={styles.authLink}>
            Quer ver os detalhes? <Link to="/sobre">Conhecer o sistema</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
