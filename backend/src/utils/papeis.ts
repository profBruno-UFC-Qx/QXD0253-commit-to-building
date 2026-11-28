import type { Context } from 'koa';

/**
 * Papéis (roles) da aplicação. O valor é o campo "type" do papel no
 * plugin users-permissions do Strapi.
 */
export const PAPEIS = {
  PUBLICO: 'public',
  ADMINISTRADOR: 'administrador',
  EMPRESA: 'empresa',
  CANDIDATO: 'candidato',
} as const;

export type Papel = (typeof PAPEIS)[keyof typeof PAPEIS];

export interface UsuarioAutenticado {
  id: number;
  documentId: string;
  username: string;
  email: string;
  role?: { type: string; name: string };
}

/** Usuário logado na requisição atual (ou undefined para visitante). */
export function usuarioDaRequisicao(ctx: Context): UsuarioAutenticado | undefined {
  return ctx.state.user as UsuarioAutenticado | undefined;
}

/** Papel do usuário da requisição. Visitantes são "public". */
export function papelDaRequisicao(ctx: Context): Papel {
  const tipo = usuarioDaRequisicao(ctx)?.role?.type;
  const papeisValidos = Object.values(PAPEIS) as string[];
  return (tipo && papeisValidos.includes(tipo) ? tipo : PAPEIS.PUBLICO) as Papel;
}
