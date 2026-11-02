// ============================================
// Tipos de Autenticação
// ============================================

export type Plan = 'FREE' | 'PREMIUM';
export type BillingCycle = 'monthly' | 'annual';
export type PaymentMethodOption = 'pix' | 'cartao_credito' | 'boleto';
export type UserRole = 'ADMIN' | 'USER';
export type AccountStatus = 'active' | 'blocked';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  plan: Plan;
  role?: UserRole;
  accountStatus?: AccountStatus;
  propertyName?: string;
  subscriptionStatus?: string;
  planName?: string;
  billingCycle?: BillingCycle;
  trialEndsAt?: string;
  currentPeriodEndsAt?: string;
  remainingDays?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  propertyName?: string;
  plan: Plan;
  billingCycle?: BillingCycle;
  paymentMethod?: PaymentMethodOption;
  promoCode?: string;
  privacyAccepted: boolean;
}
