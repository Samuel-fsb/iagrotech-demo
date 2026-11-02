// Authentication context for the public IAgroTech demo build.

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { BillingCycle, PaymentMethodOption, Plan, RegisterRequest, User } from '../types';
import { DEMO_MODE } from '../config/demo';
import { exportDemoData, getDemoUser, resetDemoState, saveDemoProfile } from '../services/demo/demo.store';
import { authService } from '../services/auth.service';

export interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterRequest) => Promise<void>;
  updateProfile: (data: Pick<User, 'name' | 'email' | 'phone' | 'propertyName'>) => Promise<void>;
  updatePlan: (plan: Plan, billingCycle?: BillingCycle, paymentMethod?: PaymentMethodOption, promoCode?: string) => Promise<void>;
  exportPrivacyData: () => Promise<unknown>;
  deleteAccount: () => Promise<void>;
  logout: () => void;
  resetDemo: () => void;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      setUser(getDemoUser());
      setIsLoading(false);
      return;
    }

    const storedUser = authService.getStoredUser();
    const token = authService.getStoredToken();

    if (storedUser && token) {
      setUser(storedUser);
      authService.getProfile(storedUser.id)
        .then((profile) => {
          authService.setAuth(token, profile);
          setUser(profile);
        })
        .catch(() => setUser(storedUser))
        .finally(() => setIsLoading(false));
      return;
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(async (_email: string, _password: string) => {
    if (DEMO_MODE) return getDemoUser();

    const response = await authService.login({ email: _email, password: _password });
    authService.setAuth(response.accessToken, response.user);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    if (DEMO_MODE) {
      throw new Error('O cadastro real está desativado neste ambiente demonstrativo.');
    }

    const response = await authService.register(data);
    authService.setAuth(response.accessToken, response.user);
    setUser(response.user);
  }, []);

  const updatePlan = useCallback(async (_plan: Plan, _billingCycle?: BillingCycle, _paymentMethod?: PaymentMethodOption, _promoCode?: string) => {
    if (DEMO_MODE) {
      throw new Error('Assinaturas e pagamentos não estão disponíveis no ambiente demonstrativo.');
    }
    if (!user) return;

    const updatedUser = await authService.updatePlan({
      plan: _plan,
      billingCycle: _billingCycle,
      paymentMethod: _paymentMethod,
      promoCode: _promoCode,
    });
    authService.setAuth(authService.getStoredToken() || '', updatedUser);
    setUser(updatedUser);
  }, [user]);

  const updateProfile = useCallback(async (data: Pick<User, 'name' | 'email' | 'phone' | 'propertyName'>) => {
    if (DEMO_MODE) {
      setUser(saveDemoProfile(data));
      return;
    }

    const updatedUser = await authService.updateProfile(data);
    authService.setAuth(authService.getStoredToken() || '', updatedUser);
    setUser(updatedUser);
  }, []);

  const resetDemo = useCallback(() => {
    resetDemoState();
    setUser(getDemoUser());
  }, []);

  const logout = useCallback(() => {
    if (DEMO_MODE) {
      resetDemo();
      return;
    }
    authService.logout();
    setUser(null);
  }, [resetDemo]);

  const exportPrivacyData = useCallback(async () => {
    if (DEMO_MODE) return { user: getDemoUser(), demoData: exportDemoData() };
    return authService.exportPrivacyData();
  }, []);

  const deleteAccount = useCallback(async () => {
    if (DEMO_MODE) {
      resetDemo();
      return;
    }
    await authService.deleteAccount();
    setUser(null);
  }, [resetDemo]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isDemoMode: DEMO_MODE,
        login,
        register,
        updateProfile,
        updatePlan,
        exportPrivacyData,
        deleteAccount,
        logout,
        resetDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
