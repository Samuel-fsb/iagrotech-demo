import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  CircleDollarSign,
  CheckCircle2,
  Circle,
  ClipboardList,
  CloudSun,
  Download,
  Droplets,
  Egg,
  Leaf,
  PackageCheck,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sprout,
  Tractor,
  TrendingDown,
  TrendingUp,
  Trash2,
  UserCheck,
  UserRound,
  UsersRound,
  UserX,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card/Card';
import { StatCard } from '../../components/ui/StatCard/StatCard';
import { useAuth } from '../../hooks/useAuth';
import { DEMO_MODE } from '../../config/demo';
import { adminService } from '../../services/admin.service';
import { operationsService, type InventoryAnalyticsItem, type InventoryAnalyticsPeriod, type PropertySettings } from '../../services/operations.service';
import {
  type AccountStatus,
  type AdminUser,
  type Alert,
  type BillingCycle,
  type CalendarEvent,
  EVENT_CATEGORY_LABELS,
  type Expense,
  EXPENSE_CATEGORY_LABELS,
  type InfoArticle,
  type InventoryItem,
  INVENTORY_CATEGORY_LABELS,
  type Livestock,
  PAYMENT_METHOD_LABELS,
  type PaymentMethodOption,
  type Plan,
  type Plantation,
  PLANTATION_STATUS_LABELS,
  type Revenue,
  type UserRole,
} from '../../types';
import { formatCurrency } from '../../utils/formatters';
import styles from './Operations.module.scss';

const badgeByStatus: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary'> = {
  planejada: 'neutral',
  plantada: 'info',
  em_desenvolvimento: 'primary',
  pronta_colheita: 'warning',
  colhida: 'success',
  finalizada: 'neutral',
  normal: 'success',
  estoque_baixo: 'warning',
  esgotado: 'danger',
  pendente: 'warning',
  em_andamento: 'info',
  concluida: 'success',
  atrasada: 'danger',
  cancelada: 'neutral',
  pago: 'success',
  atrasado: 'danger',
  critical: 'danger',
  info: 'info',
  warning: 'warning',
};

function PageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  onExport,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  onExport?: () => void;
}) {
  return (
    <header className={styles.header}>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actionLabel && (
        <div className={styles.actions}>
          <Button icon={<Plus size={18} />} onClick={onAction}>{actionLabel}</Button>
          <Button variant="outline" icon={<Download size={18} />} onClick={onExport}>Exportar</Button>
        </div>
      )}
    </header>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className={styles.modalOverlay} role="presentation" onClick={onClose}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 id="modal-title">{title}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fechar">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function downloadCsv(fileName: string, rows: Array<Record<string, string | number | undefined>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number | undefined) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={styles.rowActions}>
      {onEdit && (
        <button type="button" className={styles.iconAction} onClick={onEdit} aria-label="Editar" title="Editar">
          <Pencil />
        </button>
      )}
      <button type="button" className={`${styles.iconAction} ${styles.iconActionDanger}`} onClick={onDelete} aria-label="Apagar" title="Apagar">
        <Trash2 />
      </button>
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
}

function monthDay(date: string) {
  const value = new Date(date);
  return {
    day: String(value.getDate()).padStart(2, '0'),
    month: value.toLocaleString('pt-BR', { month: 'short' }),
  };
}

function formatDateTime(date?: string) {
  if (!date) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function plantationProgress(status: string) {
  return {
    planejada: 10,
    plantada: 25,
    em_desenvolvimento: 68,
    pronta_colheita: 95,
    colhida: 100,
    finalizada: 100,
  }[status] ?? 0;
}

function buildFinancialChart(revenueItems: Revenue[], expenseItems: Expense[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return {
      key,
      month: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', ''),
      receita: 0,
      despesa: 0,
    };
  });

  revenueItems.forEach((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const target = months.find((month) => month.key === key);
    if (target) target.receita += item.totalAmount;
  });

  expenseItems.forEach((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const target = months.find((month) => month.key === key);
    if (target) target.despesa += item.amount;
  });

  return months.map(({ key: _key, ...month }) => month);
}

function summarizeLivestockProduction(items: Livestock[]) {
  const productions = items
    .map((item) => item.production?.trim())
    .filter(Boolean);

  if (!productions.length) return 'Sem registro';
  return productions.slice(0, 2).join(' + ');
}

function countPendingVaccinations(items: Livestock[]) {
  return items.filter((item) => {
    const vaccination = item.vaccination?.trim().toLowerCase();
    return !vaccination || vaccination.includes('pendente') || vaccination.includes('atrasad') || vaccination.includes('vencer');
  }).length;
}

function PlantationDetails({ plantation }: { plantation: Plantation }) {
  return (
    <div className={styles.detailGrid}>
      <div><strong>Cultura</strong><span>{plantation.culture}</span></div>
      <div><strong>Variedade</strong><span>{plantation.variety || 'Sem registro'}</span></div>
      <div><strong>Área plantada</strong><span>{plantation.plantedArea} ha</span></div>
      <div><strong>Status</strong><span>{PLANTATION_STATUS_LABELS[plantation.status]}</span></div>
      <div><strong>Data de plantio</strong><span>{formatDate(plantation.plantingDate)}</span></div>
      <div><strong>Colheita prevista</strong><span>{plantation.expectedHarvestDate ? formatDate(plantation.expectedHarvestDate) : 'Sem previsão'}</span></div>
      <div><strong>Produção estimada</strong><span>{(plantation.estimatedProduction ?? 0).toLocaleString('pt-BR')} kg</span></div>
      <div><strong>Produção real</strong><span>{(plantation.actualProduction ?? 0).toLocaleString('pt-BR')} kg</span></div>
      <div><strong>Sementes</strong><span>{plantation.seedQuantity ? `${plantation.seedQuantity} kg` : 'Sem registro'}</span></div>
      <div><strong>Custos</strong><span>{formatCurrency(plantation.costs ?? 0)}</span></div>
      <div><strong>Fertilização</strong><span>{plantation.fertilization || 'Sem registro'}</span></div>
      <div><strong>Aplicações</strong><span>{plantation.applications || 'Sem registro'}</span></div>
      <div><strong>Criado em</strong><span>{formatDateTime(plantation.createdAt)}</span></div>
      <div><strong>Atualizado em</strong><span>{formatDateTime(plantation.updatedAt)}</span></div>
    </div>
  );
}

function LivestockDetails({ item }: { item: Livestock }) {
  return (
    <div className={styles.detailGrid}>
      <div><strong>Tipo</strong><span>{item.type}</span></div>
      <div><strong>Raça</strong><span>{item.breed || 'Sem registro'}</span></div>
      <div><strong>Quantidade</strong><span>{item.quantity}</span></div>
      <div><strong>Data de entrada</strong><span>{formatDate(item.date)}</span></div>
      <div><strong>Alimentação</strong><span>{item.feeding || 'Sem registro'}</span></div>
      <div><strong>Vacinação</strong><span>{item.vaccination || 'Sem registro'}</span></div>
      <div><strong>Pesagem</strong><span>{item.weighing || 'Sem registro'}</span></div>
      <div><strong>Produção</strong><span>{item.production || 'Sem registro'}</span></div>
      <div><strong>Observações</strong><span>{item.notes || 'Sem registro'}</span></div>
      <div><strong>Criado em</strong><span>{formatDateTime(item.createdAt)}</span></div>
      <div><strong>Atualizado em</strong><span>{formatDateTime(item.updatedAt)}</span></div>
    </div>
  );
}

export function FinancialPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<{ type: 'receita' | 'despesa'; id: string } | null>(null);
  const [localRevenues, setLocalRevenues] = useState<Revenue[]>([]);
  const [localExpenses, setLocalExpenses] = useState<Expense[]>([]);
  const financialChartData = buildFinancialChart(localRevenues, localExpenses);
  const totalRevenue = localRevenues.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalExpenses = localExpenses.reduce((sum, item) => sum + item.amount, 0);
  const result = totalRevenue - totalExpenses;
  const editingRevenue = editingMovement?.type === 'receita'
    ? localRevenues.find((item) => item.id === editingMovement.id)
    : undefined;
  const editingExpense = editingMovement?.type === 'despesa'
    ? localExpenses.find((item) => item.id === editingMovement.id)
    : undefined;

  useEffect(() => {
    if (!user?.id) return;

    operationsService.getFinancial(user.id)
      .then((data) => {
        setLocalRevenues(data.revenues);
        setLocalExpenses(data.expenses);
      })
      .catch(() => {
        setLocalRevenues([]);
        setLocalExpenses([]);
      });
  }, [user?.id]);

  const openNewMovement = () => {
    setEditingMovement(null);
    setModalOpen(true);
  };

  const openEditMovement = (type: 'receita' | 'despesa', id: string) => {
    setEditingMovement({ type, id });
    setModalOpen(true);
  };

  const closeMovementModal = () => {
    setEditingMovement(null);
    setModalOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = String(form.get('type'));
    const amount = Number(form.get('amount'));
    const today = new Date().toISOString();

    if (type === 'receita') {
      const nextRevenue = {
        id: editingRevenue?.id ?? `rev-${Date.now()}`,
        product: String(form.get('description')),
        quantity: 1,
        unit: 'un',
        unitPrice: amount,
        totalAmount: amount,
        buyer: String(form.get('person') || 'Cliente não informado'),
        date: String(form.get('date')),
        paymentMethod: 'pix' as const,
        paymentStatus: 'pago' as const,
        createdAt: editingRevenue?.createdAt ?? today,
        updatedAt: today,
      };

      if (user?.id) {
        const savedRevenue = await operationsService.saveRevenue(user.id, nextRevenue, editingRevenue?.id);
        setLocalRevenues((current) => editingRevenue
          ? current.map((item) => (item.id === editingRevenue.id ? savedRevenue : item))
          : [savedRevenue, ...current]);
        if (editingExpense) {
          await operationsService.deleteExpense(user.id, editingExpense.id);
          setLocalExpenses((current) => current.filter((item) => item.id !== editingExpense.id));
        }
        closeMovementModal();
        return;
      }

      setLocalRevenues((current) => editingRevenue
        ? current.map((item) => (item.id === editingRevenue.id ? nextRevenue : item))
        : [nextRevenue, ...current]);
      if (editingExpense) {
        setLocalExpenses((current) => current.filter((item) => item.id !== editingExpense.id));
      }
    } else {
      const nextExpense = {
        id: editingExpense?.id ?? `exp-${Date.now()}`,
        description: String(form.get('description')),
        category: 'outros' as const,
        amount,
        date: String(form.get('date')),
        paymentMethod: 'pix' as const,
        createdAt: editingExpense?.createdAt ?? today,
        updatedAt: today,
      };

      if (user?.id) {
        const savedExpense = await operationsService.saveExpense(user.id, nextExpense, editingExpense?.id);
        setLocalExpenses((current) => editingExpense
          ? current.map((item) => (item.id === editingExpense.id ? savedExpense : item))
          : [savedExpense, ...current]);
        if (editingRevenue) {
          await operationsService.deleteRevenue(user.id, editingRevenue.id);
          setLocalRevenues((current) => current.filter((item) => item.id !== editingRevenue.id));
        }
        closeMovementModal();
        return;
      }

      setLocalExpenses((current) => editingExpense
        ? current.map((item) => (item.id === editingExpense.id ? nextExpense : item))
        : [nextExpense, ...current]);
      if (editingRevenue) {
        setLocalRevenues((current) => current.filter((item) => item.id !== editingRevenue.id));
      }
    }

    closeMovementModal();
  };

  const deleteMovement = async (type: 'receita' | 'despesa', id: string) => {
    if (user?.id) {
      if (type === 'receita') {
        await operationsService.deleteRevenue(user.id, id);
        setLocalRevenues((current) => current.filter((item) => item.id !== id));
      } else {
        await operationsService.deleteExpense(user.id, id);
        setLocalExpenses((current) => current.filter((item) => item.id !== id));
      }
      return;
    }

    if (type === 'receita') {
      setLocalRevenues((current) => current.filter((item) => item.id !== id));
    } else {
      setLocalExpenses((current) => current.filter((item) => item.id !== id));
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Financeiro"
        subtitle="Controle receitas, despesas, margens e pagamentos da propriedade."
        actionLabel="Nova movimentação"
        onAction={openNewMovement}
        onExport={() => downloadCsv('financeiro.csv', [
          ...localRevenues.map((item) => ({ tipo: 'receita', descricao: item.product, data: item.date, valor: item.totalAmount })),
          ...localExpenses.map((item) => ({ tipo: 'despesa', descricao: item.description, data: item.date, valor: item.amount })),
        ])}
      />
      <section className={styles.statsGrid}>
        <StatCard label="Receitas" value={formatCurrency(totalRevenue)} icon={<TrendingUp />} color="blue" />
        <StatCard label="Despesas" value={formatCurrency(totalExpenses)} icon={<TrendingDown />} color="orange" />
        <StatCard label="Resultado" value={formatCurrency(result)} icon={<CircleDollarSign />} color={result >= 0 ? 'green' : 'red'} />
        <StatCard label="Pagamentos pagos" value={`${localRevenues.filter((item) => item.paymentStatus === 'pago').length}/${localRevenues.length}`} icon={<PackageCheck />} color="purple" />
      </section>
      <div className={styles.contentGrid}>
        <Card>
          <CardHeader title="Fluxo dos últimos meses" />
          <CardBody>
            <div className={styles.chart}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$ ${Number(value) / 1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                  <Legend />
                  <Bar dataKey="receita" name="Receita" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesa" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Receitas recentes" />
          <CardBody className={styles.list}>
            {localRevenues.map((revenue) => (
              <div className={styles.listItem} key={revenue.id}>
                <div>
                  <h4>{revenue.product}</h4>
                  <p>{revenue.quantity} {revenue.unit} para {revenue.buyer}</p>
                </div>
                <div className={styles.itemActions}>
                  <strong>{formatCurrency(revenue.totalAmount)}</strong>
                  <RowActions
                    onEdit={() => openEditMovement('receita', revenue.id)}
                    onDelete={() => deleteMovement('receita', revenue.id)}
                  />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader title="Despesas lançadas" />
        <CardBody>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th>Pagamento</th>
                  <th>Valor</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {localExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td><strong>{expense.description}</strong></td>
                    <td>{EXPENSE_CATEGORY_LABELS[expense.category]}</td>
                    <td>{formatDate(expense.date)}</td>
                    <td>{PAYMENT_METHOD_LABELS[expense.paymentMethod]}</td>
                    <td>{formatCurrency(expense.amount)}</td>
                    <td>
                      <RowActions
                        onEdit={() => openEditMovement('despesa', expense.id)}
                        onDelete={() => deleteMovement('despesa', expense.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      {modalOpen && (
        <Modal title={editingMovement ? 'Editar movimentação' : 'Nova movimentação'} onClose={closeMovementModal}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="financial-type">Tipo</label>
              <select id="financial-type" name="type" defaultValue={editingMovement?.type ?? 'receita'}>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="financial-description">Descrição</label>
              <input id="financial-description" name="description" required placeholder="Ex.: Venda de leite" defaultValue={editingRevenue?.product ?? editingExpense?.description ?? ''} />
            </div>
            <div className={styles.field}>
              <label htmlFor="financial-person">Cliente ou fornecedor</label>
              <input id="financial-person" name="person" placeholder="Ex.: Mercado Central" defaultValue={editingRevenue?.buyer ?? ''} />
            </div>
            <div className={styles.field}>
              <label htmlFor="financial-amount">Valor</label>
              <input id="financial-amount" name="amount" type="number" min="0" step="0.01" required defaultValue={editingRevenue?.totalAmount ?? editingExpense?.amount ?? ''} />
            </div>
            <div className={styles.field}>
              <label htmlFor="financial-date">Data</label>
              <input id="financial-date" name="date" type="date" required defaultValue={editingRevenue?.date ?? editingExpense?.date ?? new Date().toISOString().slice(0, 10)} />
            </div>
            <div className={styles.formActions}>
              <Button type="button" variant="outline" onClick={closeMovementModal}>Cancelar</Button>
              <Button type="submit" icon={<Save size={18} />}>Salvar</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function PlantationsPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Plantation | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [items, setItems] = useState<Plantation[]>([]);
  const totalArea = items.reduce((sum, item) => sum + item.plantedArea, 0);
  const estimatedProduction = items.reduce((sum, item) => sum + (item.estimatedProduction ?? 0), 0);
  const editingItem = editingId ? items.find((item) => item.id === editingId) : undefined;

  useEffect(() => {
    if (!user?.id) return;

    operationsService.listPlantations(user.id)
      .then(setItems)
      .catch(() => setItems([]));
  }, [user?.id]);

  const openNew = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingId(null);
    setModalOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const today = new Date().toISOString();
    const nextItem = {
      id: editingItem?.id ?? `plant-${Date.now()}`,
      culture: String(form.get('culture')),
      variety: String(form.get('variety') || ''),
      plantedArea: Number(form.get('area')),
      plantingDate: String(form.get('plantingDate')),
      expectedHarvestDate: String(form.get('harvestDate') || ''),
      status: editingItem?.status ?? 'plantada' as const,
      estimatedProduction: Number(form.get('estimatedProduction') || 0),
      costs: Number(form.get('costs') || 0),
      createdAt: editingItem?.createdAt ?? today,
      updatedAt: today,
    };

    if (user?.id) {
      const savedItem = await operationsService.savePlantation(user.id, nextItem, editingItem?.id);
      setItems((current) => editingItem
        ? current.map((item) => (item.id === editingItem.id ? savedItem : item))
        : [savedItem, ...current]);
      closeModal();
      return;
    }

    setItems((current) => editingItem
      ? current.map((item) => (item.id === editingItem.id ? nextItem : item))
      : [nextItem, ...current]);
    closeModal();
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Plantações"
        subtitle="Acompanhe culturas, áreas, aplicações e previsão de colheita."
        actionLabel="Nova plantação"
        onAction={openNew}
        onExport={() => downloadCsv('plantacoes.csv', items.map((item) => ({ cultura: item.culture, variedade: item.variety, area: item.plantedArea, status: item.status })))}
      />
      <section className={styles.statsGrid}>
        <StatCard label="Área plantada" value={`${totalArea.toFixed(1)} ha`} icon={<Sprout />} color="green" />
        <StatCard label="Culturas ativas" value={String(items.length)} icon={<Leaf />} color="blue" />
        <StatCard label="Produção estimada" value={`${estimatedProduction.toLocaleString('pt-BR')} kg`} icon={<Tractor />} color="orange" />
        <StatCard label="Prontas para colher" value={String(items.filter((item) => item.status === 'pronta_colheita').length)} icon={<ClipboardList />} color="purple" />
      </section>
      <Card>
        <CardHeader title="Talhões e culturas" />
        <CardBody>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cultura</th>
                  <th>Área</th>
                  <th>Plantio</th>
                  <th>Colheita prevista</th>
                  <th>Status</th>
                  <th>Progresso</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((plantation) => (
                  <tr
                    key={plantation.id}
                    className={styles.clickableRow}
                    onClick={() => setDetailItem(plantation)}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') setDetailItem(plantation);
                    }}
                  >
                    <td><strong>{plantation.culture}</strong><small>{plantation.variety}</small></td>
                    <td>{plantation.plantedArea} ha</td>
                    <td>{formatDate(plantation.plantingDate)}</td>
                    <td>{plantation.expectedHarvestDate ? formatDate(plantation.expectedHarvestDate) : 'Sem previsão'}</td>
                    <td><Badge variant={badgeByStatus[plantation.status]} dot>{PLANTATION_STATUS_LABELS[plantation.status]}</Badge></td>
                    <td><div className={styles.progress}><span style={{ width: `${plantationProgress(plantation.status)}%` }} /></div></td>
                    <td>
                      <div onClick={(event) => event.stopPropagation()}>
                        <RowActions
                        onEdit={() => openEdit(plantation.id)}
                        onDelete={async () => {
                          if (user?.id) await operationsService.deletePlantation(user.id, plantation.id);
                          setItems((current) => current.filter((item) => item.id !== plantation.id));
                        }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      {modalOpen && (
        <Modal title={editingItem ? 'Editar plantação' : 'Nova plantação'} onClose={closeModal}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}><label htmlFor="culture">Cultura</label><input id="culture" name="culture" required defaultValue={editingItem?.culture ?? ''} /></div>
            <div className={styles.field}><label htmlFor="variety">Variedade</label><input id="variety" name="variety" defaultValue={editingItem?.variety ?? ''} /></div>
            <div className={styles.field}><label htmlFor="area">Área plantada (ha)</label><input id="area" name="area" type="number" min="0" step="0.01" required defaultValue={editingItem?.plantedArea ?? ''} /></div>
            <div className={styles.field}><label htmlFor="plantingDate">Data de plantio</label><input id="plantingDate" name="plantingDate" type="date" required defaultValue={editingItem?.plantingDate ?? new Date().toISOString().slice(0, 10)} /></div>
            <div className={styles.field}><label htmlFor="harvestDate">Colheita prevista</label><input id="harvestDate" name="harvestDate" type="date" defaultValue={editingItem?.expectedHarvestDate ?? ''} /></div>
            <div className={styles.field}><label htmlFor="estimatedProduction">Produção estimada (kg)</label><input id="estimatedProduction" name="estimatedProduction" type="number" min="0" step="0.01" defaultValue={editingItem?.estimatedProduction ?? ''} /></div>
            <div className={styles.field}><label htmlFor="costs">Custo previsto</label><input id="costs" name="costs" type="number" min="0" step="0.01" defaultValue={editingItem?.costs ?? ''} /></div>
            <div className={styles.formActions}><Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button><Button type="submit" icon={<Save size={18} />}>Salvar</Button></div>
          </form>
        </Modal>
      )}
      {detailItem && (
        <Modal title={`Plantação: ${detailItem.culture}`} onClose={() => setDetailItem(null)}>
          <PlantationDetails plantation={detailItem} />
        </Modal>
      )}
    </div>
  );
}

export function LivestockPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Livestock | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [items, setItems] = useState<Livestock[]>([]);
  const totalAnimals = items.reduce((sum, item) => sum + item.quantity, 0);
  const productionSummary = summarizeLivestockProduction(items);
  const pendingVaccinations = countPendingVaccinations(items);
  const editingItem = editingId ? items.find((item) => item.id === editingId) : undefined;

  useEffect(() => {
    if (!user?.id) return;

    operationsService.listLivestock(user.id)
      .then(setItems)
      .catch(() => setItems([]));
  }, [user?.id]);

  const openNew = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingId(null);
    setModalOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const today = new Date().toISOString();
    const nextItem = {
      id: editingItem?.id ?? `live-${Date.now()}`,
      type: String(form.get('type')),
      breed: String(form.get('breed') || ''),
      quantity: Number(form.get('quantity')),
      date: String(form.get('date')),
      feeding: String(form.get('feeding') || ''),
      vaccination: String(form.get('vaccination') || ''),
      weighing: String(form.get('weighing') || ''),
      production: String(form.get('production') || ''),
      notes: String(form.get('notes') || ''),
      createdAt: editingItem?.createdAt ?? today,
      updatedAt: today,
    };

    if (user?.id) {
      const savedItem = await operationsService.saveLivestock(user.id, nextItem, editingItem?.id);
      setItems((current) => editingItem
        ? current.map((item) => (item.id === editingItem.id ? savedItem : item))
        : [savedItem, ...current]);
      closeModal();
      return;
    }

    setItems((current) => editingItem
      ? current.map((item) => (item.id === editingItem.id ? nextItem : item))
      : [nextItem, ...current]);
    closeModal();
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Criações"
        subtitle="Gerencie rebanhos, alimentação, vacinação e produção animal."
        actionLabel="Nova criação"
        onAction={openNew}
        onExport={() => downloadCsv('criacoes.csv', items.map((item) => ({ tipo: item.type, raca: item.breed, quantidade: item.quantity, producao: item.production })))}
      />
      <section className={styles.statsGrid}>
        <StatCard label="Animais cadastrados" value={String(totalAnimals)} icon={<Egg />} color="green" />
        <StatCard label="Lotes ativos" value={String(items.length)} icon={<Activity />} color="blue" />
        <StatCard label="Produção registrada" value={productionSummary} icon={<TrendingUp />} color="orange" />
        <StatCard label="Vacinas pendentes" value={String(pendingVaccinations)} icon={<AlertTriangle />} color="red" />
      </section>
      <div className={styles.wideGrid}>
        {items.map((item) => (
          <Card key={item.id}>
            <div
              className={styles.clickableCard}
              role="button"
              tabIndex={0}
              onClick={() => setDetailItem(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setDetailItem(item);
              }}
            >
              <CardHeader
                title={item.type}
                action={(
                  <div className={styles.cardActions} onClick={(event) => event.stopPropagation()}>
                    <Badge variant="primary">{item.quantity} cabeças</Badge>
                    <RowActions
                      onEdit={() => openEdit(item.id)}
                      onDelete={async () => {
                        if (user?.id) await operationsService.deleteLivestock(user.id, item.id);
                        setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
                      }}
                    />
                  </div>
                )}
              />
              <CardBody className={styles.list}>
                <div className={styles.statusLine}><strong>Raça:</strong> <span>{item.breed}</span></div>
                <div className={styles.statusLine}><strong>Alimentação:</strong> <span>{item.feeding}</span></div>
                <div className={styles.statusLine}><strong>Sanidade:</strong> <span>{item.vaccination ?? 'Sem registro'}</span></div>
                <div className={styles.statusLine}><strong>Pesagem:</strong> <span>{item.weighing ?? 'Sem registro'}</span></div>
                <div className={styles.statusLine}><strong>Produção:</strong> <span>{item.production}</span></div>
                <div className={styles.statusLine}><strong>Observações:</strong> <span>{item.notes ?? 'Sem registro'}</span></div>
              </CardBody>
            </div>
          </Card>
        ))}
      </div>
      {modalOpen && (
        <Modal title={editingItem ? 'Editar criação' : 'Nova criação'} onClose={closeModal}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}><label htmlFor="type">Tipo</label><input id="type" name="type" required placeholder="Ex.: Bovinos de corte" defaultValue={editingItem?.type ?? ''} /></div>
            <div className={styles.field}><label htmlFor="breed">Raça</label><input id="breed" name="breed" defaultValue={editingItem?.breed ?? ''} /></div>
            <div className={styles.field}><label htmlFor="quantity">Quantidade</label><input id="quantity" name="quantity" type="number" min="0" required defaultValue={editingItem?.quantity ?? ''} /></div>
            <div className={styles.field}><label htmlFor="date">Data de entrada</label><input id="date" name="date" type="date" required defaultValue={editingItem?.date ?? new Date().toISOString().slice(0, 10)} /></div>
            <div className={styles.field}><label htmlFor="feeding">Alimentação</label><input id="feeding" name="feeding" defaultValue={editingItem?.feeding ?? ''} /></div>
            <div className={styles.field}><label htmlFor="vaccination">Vacinação</label><input id="vaccination" name="vaccination" defaultValue={editingItem?.vaccination ?? ''} /></div>
            <div className={styles.field}><label htmlFor="weighing">Pesagem</label><input id="weighing" name="weighing" defaultValue={editingItem?.weighing ?? ''} /></div>
            <div className={styles.field}><label htmlFor="production">Produção</label><input id="production" name="production" defaultValue={editingItem?.production ?? ''} /></div>
            <div className={styles.fieldWide}><label htmlFor="notes">Observações</label><textarea id="notes" name="notes" defaultValue={editingItem?.notes ?? ''} /></div>
            <div className={styles.formActions}><Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button><Button type="submit" icon={<Save size={18} />}>Salvar</Button></div>
          </form>
        </Modal>
      )}
      {detailItem && (
        <Modal title={`Criação: ${detailItem.type}`} onClose={() => setDetailItem(null)}>
          <LivestockDetails item={detailItem} />
        </Modal>
      )}
    </div>
  );
}

export function InventoryPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<InventoryAnalyticsPeriod>('monthly');
  const [analytics, setAnalytics] = useState<InventoryAnalyticsItem[]>([]);
  const editingItem = editingId ? items.find((item) => item.id === editingId) : undefined;

  useEffect(() => {
    if (!user?.id) return;

    operationsService.listInventory(user.id)
      .then(setItems)
      .catch(() => setItems([]));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    operationsService.getInventoryAnalytics(user.id, analyticsPeriod)
      .then(setAnalytics)
      .catch(() => setAnalytics([]));
  }, [analyticsPeriod, user?.id]);

  const openNew = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingId(null);
    setModalOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const quantity = Number(form.get('quantity'));
    const minimumStock = Number(form.get('minimumStock'));
    const today = new Date().toISOString();
    const nextItem = {
      id: editingItem?.id ?? `inv-${Date.now()}`,
      name: String(form.get('name')),
      category: String(form.get('category')) as InventoryItem['category'],
      quantity,
      unit: String(form.get('unit')),
      minimumStock,
      location: String(form.get('location') || ''),
      expirationDate: String(form.get('expirationDate') || ''),
      status: quantity <= 0 ? 'esgotado' as const : quantity <= minimumStock ? 'estoque_baixo' as const : 'normal' as const,
      createdAt: editingItem?.createdAt ?? today,
      updatedAt: today,
    };

    if (user?.id) {
      const savedItem = await operationsService.saveInventoryItem(user.id, nextItem, editingItem?.id);
      setItems((current) => editingItem
        ? current.map((item) => (item.id === editingItem.id ? savedItem : item))
        : [savedItem, ...current]);
      closeModal();
      return;
    }

    setItems((current) => editingItem
      ? current.map((item) => (item.id === editingItem.id ? nextItem : item))
      : [nextItem, ...current]);
    closeModal();
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Estoque"
        subtitle="Monitore insumos, validade, localização e níveis mínimos."
        actionLabel="Novo item"
        onAction={openNew}
        onExport={() => downloadCsv('estoque.csv', items.map((item) => ({ item: item.name, categoria: item.category, quantidade: item.quantity, unidade: item.unit, status: item.status })))}
      />
      <section className={styles.statsGrid}>
        <StatCard label="Itens cadastrados" value={String(items.length)} icon={<PackageCheck />} color="green" />
        <StatCard label="Estoque baixo" value={String(items.filter((item) => item.status === 'estoque_baixo').length)} icon={<AlertTriangle />} color="orange" />
        <StatCard label="Esgotados" value={String(items.filter((item) => item.status === 'esgotado').length)} icon={<Bell />} color="red" />
        <StatCard label="Categorias" value={String(new Set(items.map((item) => item.category)).size)} icon={<ClipboardList />} color="blue" />
      </section>
      <Card>
        <CardHeader
          title="Compras e gastos com insumos"
          action={(
            <select
              className={styles.compactSelect}
              value={analyticsPeriod}
              onChange={(event) => setAnalyticsPeriod(event.target.value as InventoryAnalyticsPeriod)}
              aria-label="Período do gráfico"
            >
              <option value="monthly">Por mês</option>
              <option value="yearly">Por ano</option>
            </select>
          )}
        />
        <CardBody>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis yAxisId="amount" tickFormatter={(value) => `R$ ${Number(value) / 1000}k`} />
                <YAxis yAxisId="purchases" orientation="right" allowDecimals={false} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'Gastos' ? formatCurrency(Number(value ?? 0)) : Number(value ?? 0),
                    name,
                  ]}
                />
                <Legend />
                <Bar yAxisId="amount" dataKey="amount" name="Gastos" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="purchases" dataKey="purchases" name="Compras" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Inventário" />
        <CardBody>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Categoria</th>
                  <th>Quantidade</th>
                  <th>Mínimo</th>
                  <th>Local</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong><small>{item.expirationDate ? `Validade ${formatDate(item.expirationDate)}` : 'Sem validade registrada'}</small></td>
                    <td>{INVENTORY_CATEGORY_LABELS[item.category]}</td>
                    <td>{item.quantity} {item.unit}</td>
                    <td>{item.minimumStock} {item.unit}</td>
                    <td>{item.location}</td>
                    <td><Badge variant={badgeByStatus[item.status]} dot>{item.status.replace('_', ' ')}</Badge></td>
                    <td>
                      <RowActions
                        onEdit={() => openEdit(item.id)}
                        onDelete={async () => {
                          if (user?.id) await operationsService.deleteInventoryItem(user.id, item.id);
                          setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      {modalOpen && (
        <Modal title={editingItem ? 'Editar item de estoque' : 'Novo item de estoque'} onClose={closeModal}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}><label htmlFor="name">Nome</label><input id="name" name="name" required defaultValue={editingItem?.name ?? ''} /></div>
            <div className={styles.field}><label htmlFor="category">Categoria</label><select id="category" name="category" defaultValue={editingItem?.category ?? 'outros'}>{Object.entries(INVENTORY_CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div className={styles.field}><label htmlFor="quantity">Quantidade</label><input id="quantity" name="quantity" type="number" min="0" step="0.001" required defaultValue={editingItem?.quantity ?? ''} /></div>
            <div className={styles.field}><label htmlFor="unit">Unidade</label><input id="unit" name="unit" required placeholder="kg, L, un" defaultValue={editingItem?.unit ?? ''} /></div>
            <div className={styles.field}><label htmlFor="minimumStock">Estoque mínimo</label><input id="minimumStock" name="minimumStock" type="number" min="0" step="0.001" required defaultValue={editingItem?.minimumStock ?? ''} /></div>
            <div className={styles.field}><label htmlFor="location">Local</label><input id="location" name="location" defaultValue={editingItem?.location ?? ''} /></div>
            <div className={styles.field}><label htmlFor="expirationDate">Validade</label><input id="expirationDate" name="expirationDate" type="date" defaultValue={editingItem?.expirationDate ?? ''} /></div>
            <div className={styles.formActions}><Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button><Button type="submit" icon={<Save size={18} />}>Salvar</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function CalendarPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [items, setItems] = useState<CalendarEvent[]>([]);
  const editingItem = editingId ? items.find((item) => item.id === editingId) : undefined;

  useEffect(() => {
    if (!user?.id) return;

    operationsService.listEvents(user.id)
      .then(setItems)
      .catch(() => setItems([]));
  }, [user?.id]);

  const openNew = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingId(null);
    setModalOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const today = new Date().toISOString();
    const nextItem = {
      id: editingItem?.id ?? `evt-${Date.now()}`,
      title: String(form.get('title')),
      category: String(form.get('category')) as CalendarEvent['category'],
      date: String(form.get('date')),
      time: String(form.get('time') || ''),
      priority: String(form.get('priority')) as CalendarEvent['priority'],
      status: editingItem?.status ?? 'pendente' as const,
      notes: String(form.get('notes') || ''),
      createdAt: editingItem?.createdAt ?? today,
      updatedAt: today,
    };

    if (user?.id) {
      const savedItem = await operationsService.saveEvent(user.id, nextItem, editingItem?.id);
      setItems((current) => editingItem
        ? current.map((item) => (item.id === editingItem.id ? savedItem : item))
        : [savedItem, ...current]);
      closeModal();
      return;
    }

    setItems((current) => editingItem
      ? current.map((item) => (item.id === editingItem.id ? nextItem : item))
      : [nextItem, ...current]);
    closeModal();
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Calendário"
        subtitle="Planeje atividades fictícias de campo, sanidade, colheita e manutenção nesta demonstração."
        actionLabel="Novo evento"
        onAction={openNew}
        onExport={() => downloadCsv('calendario.csv', items.map((item) => ({ titulo: item.title, categoria: item.category, data: item.date, hora: item.time, prioridade: item.priority })))}
      />
      <section className={styles.wideGrid}>
        {items.map((event) => {
          const date = monthDay(event.date);
          return (
            <Card key={event.id}>
              <CardBody>
                <div className={styles.listItem}>
                  <div className={styles.eventDate}><span>{date.day}</span><span>{date.month}</span></div>
                  <div>
                    <h4>{event.title}</h4>
                    <p>{EVENT_CATEGORY_LABELS[event.category]} às {event.time}</p>
                    <Badge variant={badgeByStatus[event.status]} dot>{event.priority}</Badge>
                  </div>
                  <RowActions
                    onEdit={() => openEdit(event.id)}
                    onDelete={async () => {
                      if (user?.id) await operationsService.deleteEvent(user.id, event.id);
                      setItems((current) => current.filter((item) => item.id !== event.id));
                    }}
                  />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </section>
      {modalOpen && (
        <Modal title={editingItem ? 'Editar evento' : 'Novo evento'} onClose={closeModal}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}><label htmlFor="title">Título</label><input id="title" name="title" required defaultValue={editingItem?.title ?? ''} /></div>
            <div className={styles.field}><label htmlFor="category">Categoria</label><select id="category" name="category" defaultValue={editingItem?.category ?? 'outros'}>{Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div className={styles.field}><label htmlFor="date">Data</label><input id="date" name="date" type="date" required defaultValue={editingItem?.date ?? new Date().toISOString().slice(0, 10)} /></div>
            <div className={styles.field}><label htmlFor="time">Hora</label><input id="time" name="time" type="time" defaultValue={editingItem?.time ?? ''} /></div>
            <div className={styles.field}><label htmlFor="priority">Prioridade</label><select id="priority" name="priority" defaultValue={editingItem?.priority ?? 'media'}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></div>
            <div className={styles.field}><label htmlFor="notes">Observações</label><input id="notes" name="notes" defaultValue={editingItem?.notes ?? ''} /></div>
            <div className={styles.formActions}><Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button><Button type="submit" icon={<Save size={18} />}>Salvar</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function InformationPage() {
  const [items, setItems] = useState<InfoArticle[]>([]);

  useEffect(() => {
    operationsService.listArticles()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Informações"
        subtitle="Conteúdos de cultivo, mercado, clima e tecnologia para consulta."
      />
      <section className={styles.wideGrid}>
        {items.map((article) => (
          <Card key={article.id}>
            <CardHeader title={article.title} action={<Badge variant="info">{article.category}</Badge>} />
            <CardBody className={styles.list}>
              <p>{article.summary}</p>
              <p className={styles.muted}>{article.source} · {formatDate(article.publishedAt)}</p>
            </CardBody>
          </Card>
        ))}
      </section>
    </div>
  );
}

export function AdminArticlesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [items, setItems] = useState<InfoArticle[]>([]);
  const editingArticle = items.find((item) => item.id === editingId);

  useEffect(() => {
    operationsService.listArticles()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const closeModal = () => {
    setEditingId(null);
    setModalOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const savedArticle = await operationsService.saveArticle({
      title: String(form.get('title')),
      summary: String(form.get('summary')),
      content: String(form.get('content')),
      category: String(form.get('category')) as InfoArticle['category'],
      source: String(form.get('source') || 'IAgroTech Conteúdo'),
      imageUrl: String(form.get('imageUrl') || ''),
    }, editingArticle?.id);

    setItems((current) => editingArticle
      ? current.map((item) => (item.id === editingArticle.id ? savedArticle : item))
      : [savedArticle, ...current]);
    closeModal();
  };

  const deleteArticle = async (article: InfoArticle) => {
    const confirmed = window.confirm(`Apagar o artigo "${article.title}"?`);
    if (!confirmed) return;

    await operationsService.deleteArticle(article.id);
    setItems((current) => current.filter((item) => item.id !== article.id));
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Artigos"
        subtitle="Gerencie os conteúdos exibidos para os usuários do sistema."
        actionLabel="Novo artigo"
        onAction={() => setModalOpen(true)}
        onExport={() => downloadCsv('artigos.csv', items.map((item) => ({ titulo: item.title, categoria: item.category, fonte: item.source, publicado_em: item.publishedAt })))}
      />
      <section className={styles.wideGrid}>
        {items.map((article) => (
          <Card key={article.id}>
            <CardHeader title={article.title} action={<Badge variant="info">{article.category}</Badge>} />
            <CardBody className={styles.list}>
              <p>{article.summary}</p>
              <p className={styles.muted}>{article.source} · {formatDate(article.publishedAt)}</p>
              <RowActions
                onEdit={() => {
                  setEditingId(article.id);
                  setModalOpen(true);
                }}
                onDelete={() => deleteArticle(article)}
              />
            </CardBody>
          </Card>
        ))}
      </section>
      {modalOpen && (
        <Modal title={editingArticle ? 'Editar artigo' : 'Novo artigo'} onClose={closeModal}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}><label htmlFor="title">Título</label><input id="title" name="title" required defaultValue={editingArticle?.title ?? ''} /></div>
            <div className={styles.field}><label htmlFor="category">Categoria</label><select id="category" name="category" defaultValue={editingArticle?.category ?? 'educativo'}><option value="noticias">Notícias</option><option value="cultivo">Cultivo</option><option value="manejo">Manejo</option><option value="clima">Clima</option><option value="mercado">Mercado</option><option value="pragas">Pragas</option><option value="sustentabilidade">Sustentabilidade</option><option value="pecuaria">Pecuária</option><option value="tecnologia">Tecnologia</option><option value="educativo">Educativo</option></select></div>
            <div className={styles.field}><label htmlFor="summary">Resumo</label><input id="summary" name="summary" required defaultValue={editingArticle?.summary ?? ''} /></div>
            <div className={styles.field}><label htmlFor="source">Fonte</label><input id="source" name="source" defaultValue={editingArticle?.source ?? ''} /></div>
            <div className={styles.fieldWide}><label htmlFor="imageUrl">Imagem</label><input id="imageUrl" name="imageUrl" defaultValue={editingArticle?.imageUrl ?? ''} placeholder="URL da imagem" /></div>
            <div className={styles.fieldWide}><label htmlFor="content">Conteúdo</label><textarea id="content" name="content" required defaultValue={editingArticle?.content ?? ''} /></div>
            <div className={styles.formActions}><Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button><Button type="submit" icon={<Save size={18} />}>Salvar</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function AlertsPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [items, setItems] = useState<Alert[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    operationsService.listAlerts(user.id)
      .then(setItems)
      .catch(() => setItems([]));
  }, [user?.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) return;

    const form = new FormData(event.currentTarget);
    const savedAlert = await operationsService.saveAlert(user.id, {
      type: String(form.get('type')) as Alert['type'],
      title: String(form.get('title')),
      message: String(form.get('message')),
      priority: String(form.get('priority')) as Alert['priority'],
      read: false,
    });
    setItems((current) => [savedAlert, ...current]);
    setModalOpen(false);
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Alertas"
        subtitle="Priorize avisos críticos gerados por estoque, agenda, produção e IA."
        actionLabel="Novo alerta"
        onAction={() => setModalOpen(true)}
        onExport={() => downloadCsv('alertas.csv', items.map((item) => ({ tipo: item.type, titulo: item.title, prioridade: item.priority, lido: item.read ? 'sim' : 'não' })))}
      />
      <section className={styles.statsGrid}>
        <StatCard label="Não lidos" value={String(items.filter((alert) => !alert.read).length)} icon={<Bell />} color="orange" />
        <StatCard label="Críticos" value={String(items.filter((alert) => alert.priority === 'critical').length)} icon={<AlertTriangle />} color="red" />
        <StatCard label="Sugestões IA" value={String(items.filter((alert) => alert.type === 'ia').length)} icon={<Bot />} color="purple" />
      </section>
      <Card>
        <CardHeader title="Central de alertas" />
        <CardBody className={styles.list}>
          {items.map((alert) => (
            <div className={styles.listItem} key={alert.id}>
              <div>
                <h4>{alert.title}</h4>
                <p>{alert.message}</p>
              </div>
              <div className={styles.itemActions}>
                <Badge variant={badgeByStatus[alert.priority]} dot>{alert.read ? 'lido' : 'novo'}</Badge>
                <button
                  type="button"
                  className={styles.iconAction}
                  aria-label={alert.read ? 'Marcar como não lido' : 'Marcar como lido'}
                  title={alert.read ? 'Marcar como não lido' : 'Marcar como lido'}
                  onClick={async () => {
                    if (!user?.id) return;
                    const updated = await operationsService.saveAlert(
                      user.id,
                      { ...alert, read: !alert.read },
                      alert.id,
                    );
                    setItems((current) => current.map((item) => item.id === alert.id ? updated : item));
                  }}
                >
                  {alert.read ? <Circle size={16} /> : <CheckCircle2 size={16} />}
                </button>
                <RowActions
                  onDelete={async () => {
                    if (!user?.id) return;
                    await operationsService.deleteAlert(user.id, alert.id);
                    setItems((current) => current.filter((item) => item.id !== alert.id));
                  }}
                />
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
      {modalOpen && (
        <Modal title="Novo alerta" onClose={() => setModalOpen(false)}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}><label htmlFor="title">Título</label><input id="title" name="title" required /></div>
            <div className={styles.field}><label htmlFor="type">Tipo</label><select id="type" name="type" defaultValue="sistema"><option value="estoque">Estoque</option><option value="financeiro">Financeiro</option><option value="producao">Produção</option><option value="calendario">Calendário</option><option value="sistema">Sistema</option><option value="ia">IA</option></select></div>
            <div className={styles.field}><label htmlFor="priority">Prioridade</label><select id="priority" name="priority" defaultValue="info"><option value="info">Informativo</option><option value="warning">Atenção</option><option value="critical">Crítico</option></select></div>
            <div className={styles.fieldWide}><label htmlFor="message">Mensagem</label><textarea id="message" name="message" required /></div>
            <div className={styles.formActions}><Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button type="submit" icon={<Save size={18} />}>Salvar</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function AssistantPage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('Analise os alertas, estoque e calendário desta semana. O que devo priorizar?');
  const [recommendation, setRecommendation] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!user?.id) return;

    const response = await operationsService.generateRecommendation(user.id, prompt);
    setRecommendation(response.recommendation);
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Assistente IA" subtitle="Explore respostas de exemplo baseadas nos dados fictícios. Este recurso não utiliza um serviço de IA nesta demonstração." />
      <div className={styles.assistantPanel}>
        <Card>
          <CardHeader title="Consulta operacional" action={<Bot size={18} className={styles.muted} />} />
          <CardBody className={styles.list}>
            <textarea className={styles.promptBox} value={prompt} onChange={(event) => setPrompt(event.target.value)} />
            <Button icon={<Bot size={18} />} onClick={handleGenerate}>Gerar recomendação</Button>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Sugestões simuladas (não é uma IA conectada)" />
          <CardBody className={styles.list}>
            {(recommendation.length ? recommendation : ['Gere uma recomendação para analisar os dados atuais da propriedade.']).map((item, index) => (
              <div className={styles.statusLine} key={item}>
                {index === 0 ? <AlertTriangle size={18} /> : index === 1 ? <Droplets size={18} /> : <CloudSun size={18} />}
                <span>{item}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<PropertySettings>({
    propertyName: '',
    totalArea: 0,
    city: '',
    state: '',
    notificationLevel: 'all',
  });

  useEffect(() => {
    if (!user?.id) return;

    operationsService.getSettings(user.id)
      .then(setSettings)
      .catch(() => {
        setSettings({
          propertyName: '',
          totalArea: 0,
          city: '',
          state: '',
          notificationLevel: 'all',
        });
      });
  }, [user?.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) return;

    const form = new FormData(event.currentTarget);
    const cityState = String(form.get('city') || '');
    const [city, state = settings.state] = cityState.split('-').map((part) => part.trim());
    const savedSettings = await operationsService.saveSettings(user.id, {
      propertyName: String(form.get('property')),
      totalArea: Number(String(form.get('area')).replace(',', '.')) || 0,
      city,
      state,
      notificationLevel: String(form.get('alerts')) as typeof settings.notificationLevel,
    });
    setSettings(savedSettings);
    if (user) {
      await updateProfile({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        propertyName: savedSettings.propertyName,
      });
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Configurações" subtitle="Ajuste os dados fictícios da propriedade e as preferências desta demonstração." />
      <Card>
        <CardHeader title="Propriedade" action={saved ? <Badge variant="success">Salvo</Badge> : null} />
        <CardBody>
          <form className={styles.settingsForm} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="property">Nome da propriedade</label>
              <input id="property" name="property" value={settings.propertyName} onChange={(event) => setSettings((current) => ({ ...current, propertyName: event.target.value }))} />
            </div>
            <div className={styles.field}>
              <label htmlFor="area">Área total</label>
              <input id="area" name="area" value={settings.totalArea} onChange={(event) => setSettings((current) => ({ ...current, totalArea: Number(event.target.value.replace(',', '.')) || 0 }))} />
            </div>
            <div className={styles.field}>
              <label htmlFor="city">Município</label>
              <input id="city" name="city" value={`${settings.city}${settings.state ? ` - ${settings.state}` : ''}`} onChange={(event) => {
                const [city, state = ''] = event.target.value.split('-').map((part) => part.trim());
                setSettings((current) => ({ ...current, city, state }));
              }} />
            </div>
            <div className={styles.field}>
              <label htmlFor="alerts">Notificações</label>
              <select id="alerts" name="alerts" value={settings.notificationLevel} onChange={(event) => setSettings((current) => ({ ...current, notificationLevel: event.target.value as typeof settings.notificationLevel }))}>
                <option value="all">Todos os alertas</option>
                <option value="critical">Somente críticos</option>
                <option value="none">Desativadas</option>
              </select>
            </div>
            <div className={styles.formActions}>
              <Button type="submit" icon={<Save size={16} />}>Salvar configurações</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export function ProfilePage() {
  const { user, updateProfile, updatePlan, exportPrivacyData, deleteAccount } = useAuth();
  const [saved, setSaved] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>(user?.plan ?? 'FREE');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOption>('pix');
  const [promoCode, setPromoCode] = useState('');

  useEffect(() => {
    if (user?.plan === 'PREMIUM') {
      setSelectedPlan('PREMIUM');
    } else {
      setSelectedPlan('FREE');
    }
  }, [user?.plan]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await updateProfile({
      name: String(form.get('name')),
      email: String(form.get('email')),
      phone: String(form.get('phone') || ''),
      propertyName: String(form.get('propertyName') || ''),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const handlePlanSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updatePlan(
      selectedPlan,
      selectedPlan === 'PREMIUM' ? billingCycle : undefined,
      selectedPlan === 'PREMIUM' ? paymentMethod : undefined,
      promoCode.trim() || undefined,
    );
    setPromoCode('');
    setPlanSaved(true);
    window.setTimeout(() => setPlanSaved(false), 2500);
  };

  const handleExportPrivacyData = async () => {
    const data = await exportPrivacyData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'meus-dados-iagrotech.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Deseja excluir sua conta e os dados vinculados? Esta ação não pode ser desfeita.');
    if (!confirmed) return;
    await deleteAccount();
    window.location.href = '/login';
  };

  const planDescription = user?.plan === 'PREMIUM'
    ? 'Premium ativo com acesso completo aos módulos.'
    : 'Free ativo com acesso de teste por 30 dias.';
  const subscriptionEndDate = user?.currentPeriodEndsAt || user?.trialEndsAt;
  const remainingDays = user?.remainingDays ?? 0;
  const remainingLabel = remainingDays === 1 ? '1 dia restante' : `${remainingDays} dias restantes`;
  const submitLabel = user?.plan === 'PREMIUM' ? 'Estender assinatura' : 'Atualizar plano';

  return (
    <div className={styles.page}>
      <PageHeader title="Perfil" subtitle="Dados do usuário, plano e propriedade principal da conta." />
      <section className={styles.statsGrid}>
        <StatCard label={DEMO_MODE ? "Acesso" : "Plano"} value={DEMO_MODE ? "Demo" : user?.plan === 'PREMIUM' ? 'Premium' : 'Free'} icon={<UserRound />} color="purple" />
        <StatCard label="Propriedade" value={user?.propertyName ?? 'Não informada'} icon={<Leaf />} color="green" />
        <StatCard label={DEMO_MODE ? "Ambiente" : "Assinatura"} value={DEMO_MODE ? "Demo" : remainingLabel} icon={<PackageCheck />} color="blue" />
      </section>
      <Card>
        <CardHeader title="Plano e assinatura" action={<Badge variant="neutral">Somente demonstração</Badge>} />
        <CardBody>
          {DEMO_MODE ? (
            <div className={styles.statusLine}>
              <ShieldCheck size={18} />
              <span>O projeto está em modo demonstrativo. Planos, assinaturas e pagamentos não são processados nesta versão.</span>
            </div>
          ) : (
          <form className={styles.planManager} onSubmit={handlePlanSubmit}>
            <div className={styles.currentPlan}>
              <strong>Plano atual: {user?.plan === 'PREMIUM' ? 'Premium' : 'Free'}</strong>
              <span>{planDescription}</span>
              <span>Validade: {formatDateTime(subscriptionEndDate)}</span>
              <span>Status: {user?.subscriptionStatus ?? 'Não informado'} · {remainingLabel}</span>
            </div>

            <div className={styles.planOptions}>
              {user?.plan !== 'PREMIUM' && (
                <button type="button" className={`${styles.planOption} ${selectedPlan === 'FREE' ? styles.planOptionActive : ''}`} onClick={() => setSelectedPlan('FREE')}>
                  <strong>Free</strong>
                  <span>30 dias grátis</span>
                  <small>Ideal para testar a plataforma antes de assinar.</small>
                </button>
              )}
              <button type="button" className={`${styles.planOption} ${selectedPlan === 'PREMIUM' ? styles.planOptionActive : ''}`} onClick={() => setSelectedPlan('PREMIUM')}>
                <strong>{user?.plan === 'PREMIUM' ? 'Estender Premium' : 'Premium'}</strong>
                <span>{billingCycle === 'monthly' ? 'R$ 49,90/mês' : 'R$ 499,00/ano'}</span>
                <small>{user?.plan === 'PREMIUM' ? 'A nova compra soma tempo ao vencimento atual.' : 'Acesso contínuo a todos os módulos e recursos avançados.'}</small>
              </button>
            </div>

            {selectedPlan === 'PREMIUM' && (
              <div className={styles.planPaymentGrid}>
                <div className={styles.field}>
                  <label htmlFor="profile-billing-cycle">Plano Premium</label>
                  <select id="profile-billing-cycle" value={billingCycle} onChange={(event) => setBillingCycle(event.target.value as BillingCycle)}>
                    <option value="monthly">Mensal - R$ 49,90/mês</option>
                    <option value="annual">Anual - R$ 499,00/ano</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="profile-payment-method">Forma de pagamento</label>
                  <select id="profile-payment-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethodOption)}>
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartão de crédito</option>
                    <option value="boleto">Boleto</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="profile-promo-code">Código promocional</label>
                  <input
                    id="profile-promo-code"
                    value={promoCode}
                    onChange={(event) => setPromoCode(event.target.value)}
                    placeholder="Ex.: AGRO10"
                  />
                </div>
              </div>
            )}

            <div className={styles.formActions}>
              <Button type="submit" icon={<Save size={16} />}>{submitLabel}</Button>
            </div>
          </form>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Dados pessoais" action={saved ? <Badge variant="success">Salvo</Badge> : null} />
        <CardBody>
          <form className={styles.settingsForm} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="profile-name">Nome</label>
              <input id="profile-name" name="name" defaultValue={user?.name ?? ''} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="profile-email">E-mail</label>
              <input id="profile-email" name="email" type="email" defaultValue={user?.email ?? ''} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="profile-phone">Telefone</label>
              <input id="profile-phone" name="phone" defaultValue={user?.phone ?? ''} />
            </div>
            <div className={styles.field}>
              <label htmlFor="profile-property">Propriedade principal</label>
              <input id="profile-property" name="propertyName" defaultValue={user?.propertyName ?? ''} />
            </div>
            <div className={styles.formActions}>
              <Button type="submit" icon={<Save size={16} />}>Salvar perfil</Button>
            </div>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Privacidade e LGPD" />
        <CardBody className={styles.list}>
          <div className={styles.statusLine}>
            <ShieldCheck size={18} />
            <span>{DEMO_MODE ? 'Os dados desta demonstração ficam apenas no armazenamento local deste navegador. Não existe uma conta real para excluir.' : 'Você pode exportar seus dados ou solicitar a exclusão da conta e dos dados vinculados.'}</span>
          </div>
          <div className={styles.formActions}>
            <Button type="button" variant="outline" icon={<Download size={16} />} onClick={handleExportPrivacyData}>Exportar dados da demonstração</Button>
            {!DEMO_MODE && <Button type="button" variant="danger" icon={<Trash2 size={16} />} onClick={handleDeleteAccount}>Excluir minha conta</Button>}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    blockedUsers: 0,
  });
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | Plan>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [saved, setSaved] = useState(false);

  const loadUsers = () => {
    adminService.listUsers()
      .then((data) => {
        setUsers(data.users);
        setSummary(data.summary);
      })
      .catch(() => {
        setUsers([]);
      });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((item) => {
    const text = `${item.name} ${item.email} ${item.propertyName ?? ''}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesPlan = planFilter === 'all' || item.plan === planFilter;
    const matchesStatus = statusFilter === 'all' || item.accountStatus === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser) return;

    const form = new FormData(event.currentTarget);
    const plan = String(form.get('plan')) as Plan;
    const updatedUser = await adminService.updateUser(editingUser.id, {
      name: String(form.get('name')),
      email: String(form.get('email')),
      phone: String(form.get('phone') || ''),
      role: String(form.get('role')) as UserRole,
      accountStatus: String(form.get('accountStatus')) as AccountStatus,
      plan,
      billingCycle: plan === 'PREMIUM' ? String(form.get('billingCycle')) as BillingCycle : undefined,
      paymentMethod: plan === 'PREMIUM' ? String(form.get('paymentMethod')) as PaymentMethodOption : undefined,
    });

    setUsers((current) => current.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
    setEditingUser(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
    loadUsers();
  };

  const handleDelete = async (targetUser: AdminUser) => {
    if (targetUser.id === user?.id) {
      window.alert('Você não pode apagar o próprio usuário logado.');
      return;
    }

    const confirmed = window.confirm(`Apagar o usuário ${targetUser.name}? Esta ação remove também os dados vinculados a ele.`);
    if (!confirmed) return;

    await adminService.deleteUser(targetUser.id);
    setUsers((current) => current.filter((item) => item.id !== targetUser.id));
    loadUsers();
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Admin" subtitle="Gerencie usuários, permissões, planos e status das contas do sistema." />

      <section className={styles.statsGrid}>
        <StatCard label="Usuários" value={String(summary.totalUsers)} icon={<UsersRound />} color="blue" />
        <StatCard label="Premium" value={String(summary.premiumUsers)} icon={<ShieldCheck />} color="purple" />
        <StatCard label="Free" value={String(summary.freeUsers)} icon={<UserCheck />} color="green" />
        <StatCard label="Bloqueados" value={String(summary.blockedUsers)} icon={<UserX />} color="red" />
      </section>

      <Card>
        <CardHeader title="Usuários do sistema" action={saved ? <Badge variant="success">Atualizado</Badge> : null} />
        <CardBody>
          <div className={styles.adminToolbar}>
            <div className={styles.searchField}>
              <Search size={18} />
              <input
                aria-label="Buscar usuário"
                placeholder="Buscar por nome, e-mail ou propriedade"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value as 'all' | Plan)} aria-label="Filtrar plano">
              <option value="all">Todos os planos</option>
              <option value="FREE">Free</option>
              <option value="PREMIUM">Premium</option>
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | AccountStatus)} aria-label="Filtrar status">
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="blocked">Bloqueados</option>
            </select>
          </div>

          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${styles.adminTable}`}>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Permissão</th>
                  <th>Plano</th>
                  <th>Status</th>
                  <th>Propriedade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <small>{item.email}</small>
                      <small>{item.phone || 'Sem telefone'}</small>
                    </td>
                    <td>
                      <Badge variant={item.role === 'ADMIN' ? 'primary' : 'neutral'}>
                        {item.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={item.plan === 'PREMIUM' ? 'primary' : 'neutral'}>
                        {item.plan === 'PREMIUM' ? 'Premium' : 'Free'}
                      </Badge>
                      <small>{item.planName || 'Sem assinatura'}</small>
                    </td>
                    <td>
                      <Badge variant={item.accountStatus === 'active' ? 'success' : 'danger'} dot>
                        {item.accountStatus === 'active' ? 'Ativo' : 'Bloqueado'}
                      </Badge>
                      <small>{item.subscriptionStatus || 'sem status'}</small>
                    </td>
                    <td>
                      <strong>{item.propertyName || 'Sem propriedade'}</strong>
                      <small>{[item.city, item.state].filter(Boolean).join(' - ') || 'Local não informado'}</small>
                      <small>{item.totalArea ? `${item.totalArea} ha` : 'Área não informada'}</small>
                    </td>
                    <td>
                      <RowActions
                        onEdit={() => setEditingUser(item)}
                        onDelete={() => handleDelete(item)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {editingUser && (
        <Modal title="Editar usuário" onClose={() => setEditingUser(null)}>
          <form className={styles.form} onSubmit={handleEditSubmit}>
            <div className={styles.field}><label htmlFor="admin-name">Nome</label><input id="admin-name" name="name" required defaultValue={editingUser.name} /></div>
            <div className={styles.field}><label htmlFor="admin-email">E-mail</label><input id="admin-email" name="email" type="email" required defaultValue={editingUser.email} /></div>
            <div className={styles.field}><label htmlFor="admin-phone">Telefone</label><input id="admin-phone" name="phone" defaultValue={editingUser.phone ?? ''} /></div>
            <div className={styles.field}>
              <label htmlFor="admin-role">Permissão</label>
              <select id="admin-role" name="role" defaultValue={editingUser.role}>
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="admin-status">Status</label>
              <select id="admin-status" name="accountStatus" defaultValue={editingUser.accountStatus}>
                <option value="active">Ativo</option>
                <option value="blocked">Bloqueado</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="admin-plan">Plano</label>
              <select id="admin-plan" name="plan" defaultValue={editingUser.plan}>
                <option value="FREE">Free - 30 dias</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="admin-billing">Ciclo Premium</label>
              <select id="admin-billing" name="billingCycle" defaultValue={editingUser.billingCycle ?? 'monthly'}>
                <option value="monthly">Mensal</option>
                <option value="annual">Anual</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="admin-payment">Pagamento</label>
              <select id="admin-payment" name="paymentMethod" defaultValue="pix">
                <option value="pix">PIX</option>
                <option value="cartao_credito">Cartão de crédito</option>
                <option value="boleto">Boleto</option>
              </select>
            </div>
            <div className={styles.formActions}>
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
              <Button type="submit" icon={<Save size={18} />}>Salvar usuário</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
