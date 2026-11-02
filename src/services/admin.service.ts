import { api } from './api';
import type { AdminUser, AdminUsersResponse, AdminUserUpdate } from '../types';

export const adminService = {
  async listUsers(): Promise<AdminUsersResponse> {
    const response = await api.get<AdminUsersResponse>('/admin/users');
    return response.data;
  },

  async updateUser(id: string, data: AdminUserUpdate): Promise<AdminUser> {
    const response = await api.put<AdminUser>(`/admin/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },
};
