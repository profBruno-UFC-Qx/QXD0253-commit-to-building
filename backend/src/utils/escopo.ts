import type { Core } from '@strapi/strapi';

type Filtros = Record<string, unknown>;

/**
 * Junta os filtros enviados pelo cliente com um filtro obrigatório do
 * servidor. Como fica em um "$and", o cliente nunca consegue remover a
 * restrição (ex.: ver vagas de outra empresa).
 */
export function comEscopo(filtrosDoCliente: unknown, obrigatorio: Filtros): Filtros {
  const temFiltros =
    typeof filtrosDoCliente === 'object' && filtrosDoCliente !== null && Object.keys(filtrosDoCliente).length > 0;
  return temFiltros ? { $and: [filtrosDoCliente, obrigatorio] } : obrigatorio;
}

/** Empresa cujo responsável é o usuário informado (ou null). */
export function empresaDoUsuario(strapi: Core.Strapi, usuarioId: number) {
  return strapi.documents('api::empresa.empresa').findFirst({
    filters: { responsavel: { id: usuarioId } },
  });
}

/** Currículo do candidato informado (ou null). */
export function curriculoDoUsuario(strapi: Core.Strapi, usuarioId: number) {
  return strapi.documents('api::curriculo.curriculo').findFirst({
    filters: { candidato: { id: usuarioId } },
  });
}

/** Filtro que nunca encontra nada (para quem não tem acesso a nenhum registro). */
export const NENHUM = { id: { $null: true } };
