// ============================================
// Tipos Financeiros
// ============================================

export type ExpenseCategory =
  | 'sementes'
  | 'mudas'
  | 'fertilizantes'
  | 'defensivos'
  | 'racao'
  | 'medicamentos'
  | 'combustivel'
  | 'energia'
  | 'agua'
  | 'manutencao'
  | 'equipamentos'
  | 'mao_de_obra'
  | 'transporte'
  | 'outros';

export type PaymentMethod =
  | 'dinheiro'
  | 'pix'
  | 'cartao_debito'
  | 'cartao_credito'
  | 'boleto'
  | 'transferencia'
  | 'outros';

export type PaymentStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado';

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  plantationId?: string;
  livestockId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Revenue {
  id: string;
  product: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  buyer?: string;
  date: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionCost {
  id: string;
  plantationId: string;
  culture: string;
  totalCost: number;
  costPerUnit: number;
  costPerArea: number;
  relatedRevenue: number;
  estimatedResult: number;
  margin: number;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  sementes: 'Sementes',
  mudas: 'Mudas',
  fertilizantes: 'Fertilizantes',
  defensivos: 'Defensivos',
  racao: 'Ração',
  medicamentos: 'Medicamentos',
  combustivel: 'Combustível',
  energia: 'Energia',
  agua: 'Água',
  manutencao: 'Manutenção',
  equipamentos: 'Equipamentos',
  mao_de_obra: 'Mão de Obra',
  transporte: 'Transporte',
  outros: 'Outros',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_debito: 'Cartão Débito',
  cartao_credito: 'Cartão Crédito',
  boleto: 'Boleto',
  transferencia: 'Transferência',
  outros: 'Outros',
};
