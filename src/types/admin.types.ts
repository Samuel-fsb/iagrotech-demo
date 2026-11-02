import type { AccountStatus, BillingCycle, PaymentMethodOption, Plan, UserRole } from './auth.types';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  plan: Plan;
  role: UserRole;
  accountStatus: AccountStatus;
  propertyName?: string;
  city?: string;
  state?: string;
  totalArea?: number;
  subscriptionStatus?: string;
  planName?: string;
  billingCycle?: BillingCycle;
  trialEndsAt?: string;
  currentPeriodEndsAt?: string;
  plantationsCount: number;
  livestockCount: number;
  inventoryCount: number;
  expensesTotal: number;
  revenuesTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSummary {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  blockedUsers: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  summary: AdminSummary;
}

export interface AdminUserUpdate {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  plan: Plan;
  billingCycle?: BillingCycle;
  paymentMethod?: PaymentMethodOption;
}
