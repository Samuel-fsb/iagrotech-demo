// ============================================
// Auth Service
// ============================================

import { api } from './api';
import type { BillingCycle, LoginRequest, LoginResponse, PaymentMethodOption, Plan, RegisterRequest, User } from '../types';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/register', data);
    return response.data;
  },

  async getProfile(_userId: string): Promise<User> {
    const response = await api.get<User>('/user/profile');
    return response.data;
  },

  async updateProfile(data: Pick<User, 'name' | 'email' | 'phone' | 'propertyName'>): Promise<User> {
    const response = await api.put<User>('/user/profile', data);
    return response.data;
  },

  async requestPasswordReset(email: string): Promise<{ message: string; devResetToken?: string }> {
    const response = await api.post<{ message: string; devResetToken?: string }>('/auth/request-password-reset', { email });
    return response.data;
  },

  async resetPassword(data: { email: string; token: string; password: string }): Promise<void> {
    await api.post('/auth/reset-password', data);
  },

  async updatePlan(data: {
    plan: Plan;
    billingCycle?: BillingCycle;
    paymentMethod?: PaymentMethodOption;
    promoCode?: string;
  }): Promise<User> {
    const response = await api.put<User>('/user/plan', data);
    return response.data;
  },

  async exportPrivacyData(): Promise<unknown> {
    const response = await api.get('/user/privacy/export');
    return response.data;
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/user/account');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getStoredToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  setAuth(token: string, user: User): void {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },
};
