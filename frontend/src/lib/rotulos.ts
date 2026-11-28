import { html } from './html';
import type { CategoriaCnh, SituacaoCandidatura, SituacaoEmpresa, SituacaoVaga, TipoVaga } from './tipos';

/** Textos amigáveis e cores (classes do Bootstrap) para os valores do banco. */
interface Rotulo {
  texto: string;
  classe: string;
  icone: string;
}

export const SITUACAO_CANDIDATURA: Record<SituacaoCandidatura, Rotulo> = {
  enviada: { texto: 'Enviada', classe: 'text-bg-secondary', icone: 'bi-send' },
  em_analise: { texto: 'Em análise', classe: 'text-bg-info', icone: 'bi-hourglass-split' },
  aprovada: { texto: 'Aprovada', classe: 'text-bg-success', icone: 'bi-check-circle' },
  recusada: { texto: 'Recusada', classe: 'text-bg-danger', icone: 'bi-x-circle' },
};

export const SITUACAO_EMPRESA: Record<SituacaoEmpresa, Rotulo> = {
  pendente: { texto: 'Pendente', classe: 'text-bg-warning', icone: 'bi-clock' },
  aprovada: { texto: 'Aprovada', classe: 'text-bg-success', icone: 'bi-patch-check' },
  recusada: { texto: 'Recusada', classe: 'text-bg-danger', icone: 'bi-x-octagon' },
};

export const SITUACAO_VAGA: Record<SituacaoVaga, Rotulo> = {
  aberta: { texto: 'Aberta', classe: 'text-bg-success', icone: 'bi-unlock' },
  encerrada: { texto: 'Encerrada', classe: 'text-bg-secondary', icone: 'bi-lock' },
};

export const TIPO_VAGA: Record<TipoVaga, { texto: string; icone: string }> = {
  motorista: { texto: 'Motorista', icone: 'bi-truck' },
  operador: { texto: 'Operador de máquinas', icone: 'bi-cone-striped' },
};

export const CATEGORIAS_CNH: CategoriaCnh[] = ['nenhuma', 'B', 'C', 'D', 'E'];

export function textoCnh(cnh: CategoriaCnh, contexto: 'vaga' | 'candidato' = 'vaga'): string {
  if (cnh === 'nenhuma') return contexto === 'vaga' ? 'Não exige CNH' : 'Sem CNH';
  return contexto === 'vaga' ? `CNH ${cnh} ou superior` : `CNH ${cnh}`;
}

export function selo(rotulo: Rotulo) {
  return html`<span class="badge ${rotulo.classe}"><i class="bi ${rotulo.icone} me-1" aria-hidden="true"></i>${rotulo.texto}</span>`;
}

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const data = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

export function formatarSalario(valor: number | null): string {
  return valor === null || valor === undefined ? 'A combinar' : moeda.format(Number(valor));
}

export function formatarData(iso: string): string {
  return data.format(new Date(iso));
}

export function formatarCnpj(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
