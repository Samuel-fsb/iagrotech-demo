import type {
  Alert,
  CalendarEvent,
  DashboardData,
  Expense,
  InfoArticle,
  InventoryItem,
  Livestock,
  Plantation,
  Revenue,
  User,
} from '../../types';
import {
  alerts as seedAlerts,
  articles as seedArticles,
  events as seedEvents,
  expenses as seedExpenses,
  inventory as seedInventory,
  livestock as seedLivestock,
  plantations as seedPlantations,
  revenues as seedRevenues,
} from '../../pages/Operations/operations.mock';
import { DEMO_STORAGE_KEY } from '../../config/demo';

export interface DemoPropertySettings {
  propertyName: string;
  totalArea: number;
  city: string;
  state: string;
  notificationLevel: 'all' | 'critical' | 'none';
}

export interface DemoStoreState {
  version: 1;
  revenues: Revenue[];
  expenses: Expense[];
  plantations: Plantation[];
  livestock: Livestock[];
  inventory: InventoryItem[];
  events: CalendarEvent[];
  articles: InfoArticle[];
  alerts: Alert[];
  settings: DemoPropertySettings;
  profile: Pick<User, 'name' | 'email' | 'phone' | 'propertyName'>;
}

export type DemoCollection = Exclude<keyof DemoStoreState, 'version' | 'settings' | 'profile'>;

const defaultProfile: DemoStoreState['profile'] = {
  name: 'Produtor',
  email: 'demo@iagrotech.app',
  phone: '(11) 99999-0000',
  propertyName: 'Sítio Boa Esperança',
};

function createInitialState(): DemoStoreState {
  return {
    version: 1,
    revenues: seedRevenues,
    expenses: seedExpenses,
    plantations: seedPlantations,
    livestock: seedLivestock,
    inventory: seedInventory,
    events: seedEvents,
    articles: seedArticles,
    alerts: seedAlerts,
    settings: {
      propertyName: 'Sítio Boa Esperança',
      totalArea: 12.5,
      city: 'Ribeirão Preto',
      state: 'SP',
      notificationLevel: 'all',
    },
    profile: defaultProfile,
  };
}

function clone<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecordArray(value: unknown): value is Array<{ id: string }> {
  return Array.isArray(value) && value.every((item) => item && typeof item === 'object' && typeof item.id === 'string');
}

function loadState(): DemoStoreState {
  const fallback = createInitialState();

  try {
    const stored = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!stored) {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fallback));
      return clone(fallback);
    }

    const parsed = JSON.parse(stored) as Partial<DemoStoreState>;
    const collections: DemoCollection[] = [
      'revenues', 'expenses', 'plantations', 'livestock', 'inventory',
      'events', 'articles', 'alerts',
    ];

    if (parsed.version !== 1 || collections.some((key) => !isRecordArray(parsed[key]))) {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fallback));
      return clone(fallback);
    }

    return {
      ...fallback,
      ...parsed,
      settings: { ...fallback.settings, ...(parsed.settings ?? {}) },
      profile: { ...fallback.profile, ...(parsed.profile ?? {}) },
    } as DemoStoreState;
  } catch {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fallback));
    return clone(fallback);
  }
}

function persist(state: DemoStoreState): void {
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
}

function updateState<T>(updater: (state: DemoStoreState) => { state: DemoStoreState; result: T }): T {
  const current = loadState();
  const updated = updater(current);
  persist(updated.state);
  return clone(updated.result);
}

export function getDemoState(): DemoStoreState {
  return clone(loadState());
}

export function resetDemoState(): void {
  window.localStorage.removeItem(DEMO_STORAGE_KEY);
  window.localStorage.removeItem('iagrotech-demo-profile');
  persist(createInitialState());
}

export function getDemoUser(): User {
  const { profile } = loadState();
  return {
    id: 'demo-user',
    ...profile,
    plan: 'FREE',
    role: 'USER',
    accountStatus: 'active',
    subscriptionStatus: 'Ambiente demonstrativo',
  };
}

export function saveDemoProfile(
  profile: Pick<User, 'name' | 'email' | 'phone' | 'propertyName'>,
): User {
  updateState((state) => ({
    state: {
      ...state,
      profile: { ...profile },
      settings: { ...state.settings, propertyName: profile.propertyName ?? state.settings.propertyName },
    },
    result: profile,
  }));
  return getDemoUser();
}

export function exportDemoData(): DemoStoreState {
  return getDemoState();
}

export function listDemoRecords<K extends DemoCollection>(collection: K): DemoStoreState[K] {
  return clone(loadState()[collection]);
}

export function saveDemoRecord<K extends DemoCollection>(
  collection: K,
  data: Partial<DemoStoreState[K][number]>,
  id?: string,
): DemoStoreState[K][number] {
  return updateState((state) => {
    const records = state[collection] as Array<{ id: string; createdAt?: string; updatedAt?: string }>;
    const recordId = id ?? (data as { id?: string }).id ?? `demo-${collection}-${Date.now()}`;
    const existing = records.find((record) => record.id === recordId);
    const timestamp = new Date().toISOString();
    const saved = {
      ...existing,
      ...data,
      id: recordId,
      createdAt: existing?.createdAt ?? (data as { createdAt?: string }).createdAt ?? timestamp,
      updatedAt: timestamp,
    } as { id: string; createdAt?: string; updatedAt?: string };

    if (collection === 'inventory') {
      const item = saved as InventoryItem;
      item.status = item.quantity <= 0
        ? 'esgotado'
        : item.quantity <= item.minimumStock
          ? 'estoque_baixo'
          : 'normal';
    }

    const nextRecords = existing
      ? records.map((record) => record.id === recordId ? saved : record)
      : [saved, ...records];

    return {
      state: { ...state, [collection]: nextRecords } as DemoStoreState,
      result: saved as DemoStoreState[K][number],
    };
  });
}

export function deleteDemoRecord<K extends DemoCollection>(collection: K, id: string): void {
  updateState((state) => ({
    state: {
      ...state,
      [collection]: (state[collection] as Array<{ id: string }>).filter((item) => item.id !== id),
    } as DemoStoreState,
    result: undefined,
  }));
}

export function getDemoSettings(): DemoPropertySettings {
  return clone(loadState().settings);
}

export function saveDemoSettings(settings: DemoPropertySettings): DemoPropertySettings {
  return updateState((state) => ({
    state: {
      ...state,
      settings,
      profile: { ...state.profile, propertyName: settings.propertyName },
    },
    result: settings,
  }));
}

export function getDemoDashboard(): DashboardData {
  const state = loadState();
  const revenue = state.revenues.reduce((sum, item) => sum + item.totalAmount, 0);
  const expenses = state.expenses.reduce((sum, item) => sum + item.amount, 0);
  const result = revenue - expenses;
  const financialChart = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '');
    const monthRevenue = state.revenues
      .filter((item) => item.date.startsWith(key))
      .reduce((sum, item) => sum + item.totalAmount, 0);
    const monthExpenses = state.expenses
      .filter((item) => item.date.startsWith(key))
      .reduce((sum, item) => sum + item.amount, 0);
    return {
      month: monthLabel,
      revenue: monthRevenue,
      expenses: monthExpenses,
      result: monthRevenue - monthExpenses,
    };
  });

  const progressByStatus: Record<Plantation['status'], number> = {
    planejada: 10,
    plantada: 25,
    em_desenvolvimento: 68,
    pronta_colheita: 95,
    colhida: 100,
    finalizada: 100,
  };

  const productions = state.plantations.map((item) => ({
    id: item.id,
    culture: item.culture,
    area: item.plantedArea,
    status: item.status.replaceAll('_', ' '),
    plantingDate: item.plantingDate,
    expectedHarvestDate: item.expectedHarvestDate ?? '',
    progress: progressByStatus[item.status],
  }));

  const upcomingActivities = state.events
    .filter((item) => !['concluida', 'cancelada'].includes(item.status))
    .sort((first, second) => first.date.localeCompare(second.date))
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      date: item.date,
      status: item.status === 'cancelada' ? 'pendente' as const : item.status,
      priority: item.priority,
    }));

  const alerts = state.alerts.map((item) => ({
    id: item.id,
    type: item.type === 'ia' ? 'sistema' as const : item.type,
    title: item.title,
    message: item.message,
    priority: item.priority,
    read: item.read,
    createdAt: item.createdAt,
  }));

  return {
    financial: {
      revenue,
      expenses,
      result,
      profitMargin: revenue > 0 ? result / revenue : 0,
    },
    financialChart,
    productions,
    productionsCount: state.plantations.length,
    stockAlerts: state.inventory.filter((item) => item.status !== 'normal').length,
    upcomingActivities,
    alerts,
  };
}

export function getDemoInventoryAnalytics(period: 'monthly' | 'yearly') {
  const expenses = loadState().expenses.filter((item) =>
    ['sementes', 'mudas', 'fertilizantes', 'defensivos', 'racao', 'medicamentos', 'outros'].includes(item.category),
  );
  const now = new Date();
  const monthCount = period === 'monthly' ? 6 : 12;
  const firstMonthOffset = monthCount - 1;

  return Array.from({ length: monthCount }, (_, index) => {
    const date = period === 'yearly'
      ? new Date(now.getFullYear(), index, 1)
      : new Date(now.getFullYear(), now.getMonth() - (firstMonthOffset - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthExpenses = expenses.filter((item) => item.date.startsWith(key));

    return {
      label: new Intl.DateTimeFormat('pt-BR', { month: 'short', ...(period === 'yearly' ? {} : {}) })
        .format(date)
        .replace('.', ''),
      purchases: monthExpenses.length,
      amount: monthExpenses.reduce((sum, item) => sum + item.amount, 0),
    };
  });
}

export function getDemoRecommendation(prompt: string): string[] {
  const normalized = prompt.toLocaleLowerCase('pt-BR');
  const state = loadState();
  const lowStock = state.inventory.filter((item) => item.status !== 'normal');
  const nextEvent = state.events
    .filter((event) => !['concluida', 'cancelada'].includes(event.status))
    .sort((first, second) => first.date.localeCompare(second.date))[0];

  const recommendations = [
    lowStock.length
      ? `Revise o estoque de ${lowStock.map((item) => item.name).slice(0, 2).join(' e ')}. Há ${lowStock.length} item(ns) abaixo do nível normal.`
      : 'O estoque cadastrado está dentro dos níveis mínimos definidos.',
    nextEvent
      ? `Confira a atividade "${nextEvent.title}", prevista para ${new Date(`${nextEvent.date}T12:00:00`).toLocaleDateString('pt-BR')}.`
      : 'Não há atividades pendentes no calendário neste momento.',
    normalized.includes('finance') || normalized.includes('custo') || normalized.includes('despesa')
      ? `O resultado financeiro demonstrativo atual é de R$ ${(state.revenues.reduce((sum, item) => sum + item.totalAmount, 0) - state.expenses.reduce((sum, item) => sum + item.amount, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Confira os lançamentos antes de tomar decisões.`
      : 'Mantenha os registros de produção e movimentações atualizados para facilitar o acompanhamento da propriedade.',
  ];

  return recommendations;
}
