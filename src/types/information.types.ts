// ============================================
// Tipos de Informações Agrícolas
// ============================================

export type InfoCategory =
  | 'noticias'
  | 'cultivo'
  | 'manejo'
  | 'clima'
  | 'mercado'
  | 'pragas'
  | 'sustentabilidade'
  | 'pecuaria'
  | 'tecnologia'
  | 'educativo';

export interface InfoArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: InfoCategory;
  imageUrl?: string;
  publishedAt: string;
  source?: string;
}
