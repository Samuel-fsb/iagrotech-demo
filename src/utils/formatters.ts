// ============================================
// Utilitários de Formatação
// ============================================

/**
 * Formata valor em moeda BRL
 * formatCurrency(2500) → "R$ 2.500,00"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata data no padrão brasileiro
 * formatDate('2026-08-15') → "15/08/2026"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

/**
 * Formata data com hora
 * formatDateTime('2026-08-15T14:30:00') → "15/08/2026 14:30"
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formata data relativa (ex: "há 2 dias", "em 3 dias")
 */
export function formatRelativeDate(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Amanhã';
  if (diffDays === -1) return 'Ontem';
  if (diffDays > 0) return `Em ${diffDays} dias`;
  return `Há ${Math.abs(diffDays)} dias`;
}

/**
 * Formata percentual
 * formatPercentage(0.156) → "15,6%"
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Formata número com separador de milhares
 * formatNumber(15000) → "15.000"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formata quantidade com unidade
 * formatQuantity(1500, 'kg') → "1.500 kg"
 */
export function formatQuantity(value: number, unit: string): string {
  return `${formatNumber(value)} ${unit}`;
}

/**
 * Formata área
 * formatArea(2.5) → "2,5 ha"
 */
export function formatArea(hectares: number): string {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(hectares)} ha`;
}
