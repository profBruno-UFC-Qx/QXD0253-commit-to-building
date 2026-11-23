/** Tipos que espelham as coleções do backend (Strapi). */

export type Papel = 'public' | 'administrador' | 'empresa' | 'candidato';
export type CategoriaCnh = 'nenhuma' | 'B' | 'C' | 'D' | 'E';
export type SituacaoEmpresa = 'pendente' | 'aprovada' | 'recusada';
export type SituacaoVaga = 'aberta' | 'encerrada';
export type TipoVaga = 'motorista' | 'operador';
export type SituacaoCandidatura = 'enviada' | 'em_analise' | 'aprovada' | 'recusada';

interface Registro {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Empresa extends Registro {
  nome: string;
  cnpj: string;
  cidade: string;
  telefone: string;
  descricao: string | null;
  situacao: SituacaoEmpresa;
  vagas?: Vaga[];
}

export interface Vaga extends Registro {
  titulo: string;
  descricao: string;
  cidade: string;
  tipo: TipoVaga;
  cnhExigida: CategoriaCnh;
  equipamento: string | null;
  salario: number | null;
  situacao: SituacaoVaga;
  empresa?: Empresa;
  candidaturas?: Candidatura[];
  /** Só vem em GET /vagas/minhas */
  totalCandidaturas?: number;
}

export interface Curriculo extends Registro {
  nome: string;
  cidade: string;
  telefone: string;
  cnh: CategoriaCnh;
  anosExperiencia: number;
  equipamentos: string | null;
  resumo: string | null;
}

export interface Candidatura extends Registro {
  situacao: SituacaoCandidatura;
  vaga?: Vaga;
  curriculo?: Curriculo;
}

export interface Perfil {
  id: number;
  documentId: string;
  username: string;
  email: string;
  papel: Papel;
  empresa: Empresa | null;
  curriculo: Curriculo | null;
}

export interface Paginacao {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface RespostaLista<T> {
  data: T[];
  meta: { pagination: Paginacao };
}

export interface RespostaItem<T> {
  data: T;
}
