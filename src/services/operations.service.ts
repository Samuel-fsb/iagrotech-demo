import { api } from './api';
import { DEMO_MODE } from '../config/demo';
import {
  deleteDemoRecord,
  getDemoInventoryAnalytics,
  getDemoRecommendation,
  getDemoSettings,
  listDemoRecords,
  saveDemoRecord,
  saveDemoSettings,
} from './demo/demo.store';
import type {
  Alert,
  CalendarEvent,
  Expense,
  InfoArticle,
  InventoryItem,
  Livestock,
  Plantation,
  Revenue,
} from '../types';

export interface PropertySettings {
  propertyName: string;
  totalArea: number;
  city: string;
  state: string;
  notificationLevel: 'all' | 'critical' | 'none';
}

export interface AssistantRecommendation {
  recommendation: string[];
}

export type InventoryAnalyticsPeriod = 'monthly' | 'yearly';

export interface InventoryAnalyticsItem {
  label: string;
  purchases: number;
  amount: number;
}

function withUser(_userId: string) {
  return {};
}

export const operationsService = {
  async getFinancial(userId: string): Promise<{ revenues: Revenue[]; expenses: Expense[] }> {
    if (DEMO_MODE) return { revenues: listDemoRecords('revenues'), expenses: listDemoRecords('expenses') };
    const response = await api.get('/operations/financial', withUser(userId));
    return response.data;
  },

  async saveRevenue(userId: string, data: Partial<Revenue>, id?: string): Promise<Revenue> {
    if (DEMO_MODE) return saveDemoRecord('revenues', data, id) as Revenue;
    const response = id
      ? await api.put(`/operations/revenues/${id}`, data, withUser(userId))
      : await api.post('/operations/revenues', data, withUser(userId));
    return response.data;
  },

  async deleteRevenue(userId: string, id: string): Promise<void> {
    if (DEMO_MODE) return deleteDemoRecord('revenues', id);
    await api.delete(`/operations/revenues/${id}`, withUser(userId));
  },

  async saveExpense(userId: string, data: Partial<Expense>, id?: string): Promise<Expense> {
    if (DEMO_MODE) return saveDemoRecord('expenses', data, id) as Expense;
    const response = id
      ? await api.put(`/operations/expenses/${id}`, data, withUser(userId))
      : await api.post('/operations/expenses', data, withUser(userId));
    return response.data;
  },

  async deleteExpense(userId: string, id: string): Promise<void> {
    if (DEMO_MODE) return deleteDemoRecord('expenses', id);
    await api.delete(`/operations/expenses/${id}`, withUser(userId));
  },

  async listPlantations(userId: string): Promise<Plantation[]> {
    if (DEMO_MODE) return listDemoRecords('plantations');
    const response = await api.get('/operations/plantations', withUser(userId));
    return response.data;
  },

  async savePlantation(userId: string, data: Partial<Plantation>, id?: string): Promise<Plantation> {
    if (DEMO_MODE) return saveDemoRecord('plantations', data, id) as Plantation;
    const response = id
      ? await api.put(`/operations/plantations/${id}`, data, withUser(userId))
      : await api.post('/operations/plantations', data, withUser(userId));
    return response.data;
  },

  async deletePlantation(userId: string, id: string): Promise<void> {
    if (DEMO_MODE) return deleteDemoRecord('plantations', id);
    await api.delete(`/operations/plantations/${id}`, withUser(userId));
  },

  async listLivestock(userId: string): Promise<Livestock[]> {
    if (DEMO_MODE) return listDemoRecords('livestock');
    const response = await api.get('/operations/livestock', withUser(userId));
    return response.data;
  },

  async saveLivestock(userId: string, data: Partial<Livestock>, id?: string): Promise<Livestock> {
    if (DEMO_MODE) return saveDemoRecord('livestock', data, id) as Livestock;
    const response = id
      ? await api.put(`/operations/livestock/${id}`, data, withUser(userId))
      : await api.post('/operations/livestock', data, withUser(userId));
    return response.data;
  },

  async deleteLivestock(userId: string, id: string): Promise<void> {
    if (DEMO_MODE) return deleteDemoRecord('livestock', id);
    await api.delete(`/operations/livestock/${id}`, withUser(userId));
  },

  async listInventory(userId: string): Promise<InventoryItem[]> {
    if (DEMO_MODE) return listDemoRecords('inventory');
    const response = await api.get('/operations/inventory', withUser(userId));
    return response.data;
  },

  async getInventoryAnalytics(userId: string, period: InventoryAnalyticsPeriod): Promise<InventoryAnalyticsItem[]> {
    if (DEMO_MODE) return getDemoInventoryAnalytics(period);
    const response = await api.get('/operations/inventory/analytics', {
      ...withUser(userId),
      params: { period },
    });
    return response.data;
  },

  async saveInventoryItem(userId: string, data: Partial<InventoryItem>, id?: string): Promise<InventoryItem> {
    if (DEMO_MODE) return saveDemoRecord('inventory', data, id) as InventoryItem;
    const response = id
      ? await api.put(`/operations/inventory/${id}`, data, withUser(userId))
      : await api.post('/operations/inventory', data, withUser(userId));
    return response.data;
  },

  async deleteInventoryItem(userId: string, id: string): Promise<void> {
    if (DEMO_MODE) return deleteDemoRecord('inventory', id);
    await api.delete(`/operations/inventory/${id}`, withUser(userId));
  },

  async listEvents(userId: string): Promise<CalendarEvent[]> {
    if (DEMO_MODE) return listDemoRecords('events');
    const response = await api.get('/operations/calendar', withUser(userId));
    return response.data;
  },

  async saveEvent(userId: string, data: Partial<CalendarEvent>, id?: string): Promise<CalendarEvent> {
    if (DEMO_MODE) return saveDemoRecord('events', data, id) as CalendarEvent;
    const response = id
      ? await api.put(`/operations/calendar/${id}`, data, withUser(userId))
      : await api.post('/operations/calendar', data, withUser(userId));
    return response.data;
  },

  async deleteEvent(userId: string, id: string): Promise<void> {
    if (DEMO_MODE) return deleteDemoRecord('events', id);
    await api.delete(`/operations/calendar/${id}`, withUser(userId));
  },

  async listArticles(): Promise<InfoArticle[]> {
    if (DEMO_MODE) return listDemoRecords('articles');
    const response = await api.get('/operations/articles');
    return response.data;
  },

  async saveArticle(data: Partial<InfoArticle>, id?: string): Promise<InfoArticle> {
    if (DEMO_MODE) return saveDemoRecord('articles', data, id) as InfoArticle;
    const response = id
      ? await api.put(`/operations/articles/${id}`, data)
      : await api.post('/operations/articles', data);
    return response.data;
  },

  async deleteArticle(id: string): Promise<void> {
    if (DEMO_MODE) return deleteDemoRecord('articles', id);
    await api.delete(`/operations/articles/${id}`);
  },

  async listAlerts(userId: string): Promise<Alert[]> {
    if (DEMO_MODE) return listDemoRecords('alerts');
    const response = await api.get('/operations/alerts', withUser(userId));
    return response.data;
  },

  async saveAlert(userId: string, data: Partial<Alert>, id?: string): Promise<Alert> {
    if (DEMO_MODE) return saveDemoRecord('alerts', data, id) as Alert;
    const response = id
      ? await api.put(`/operations/alerts/${id}`, data, withUser(userId))
      : await api.post('/operations/alerts', data, withUser(userId));
    return response.data;
  },

  async deleteAlert(userId: string, id: string): Promise<void> {
    if (DEMO_MODE) return deleteDemoRecord('alerts', id);
    await api.delete(`/operations/alerts/${id}`, withUser(userId));
  },

  async generateRecommendation(userId: string, prompt: string): Promise<AssistantRecommendation> {
    if (DEMO_MODE) return { recommendation: getDemoRecommendation(prompt) };
    const response = await api.post('/operations/assistant/recommendation', { prompt }, withUser(userId));
    return response.data;
  },

  async getSettings(userId: string): Promise<PropertySettings> {
    if (DEMO_MODE) return getDemoSettings();
    const response = await api.get('/operations/settings', withUser(userId));
    return response.data;
  },

  async saveSettings(userId: string, data: PropertySettings): Promise<PropertySettings> {
    if (DEMO_MODE) return saveDemoSettings(data);
    const response = await api.put('/operations/settings', data, withUser(userId));
    return response.data;
  },
};
