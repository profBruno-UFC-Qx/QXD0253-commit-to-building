import { api, ErroApi } from './api';
import { limparSessao, obterToken, salvarToken } from './sessao';
import type { Papel, Perfil } from './tipos';

let perfilEmCache: Promise<Perfil | null> | null = null;

/** Perfil do usuário logado (ou null para visitante). Busca uma vez por página. */
export function carregarPerfil(forcar = false): Promise<Perfil | null> {
  if (!obterToken()) return Promise.resolve(null);
  if (!perfilEmCache || forcar) {
    perfilEmCache = api.get<Perfil>('/perfil').catch((erro: unknown) => {
      if (erro instanceof ErroApi && (erro.status === 401 || erro.status === 403)) {
        limparSessao();
        return null;
      }
      throw erro;
    });
  }
  return perfilEmCache;
}

/** Login com e-mail (ou nome de usuário) e senha. Guarda o JWT recebido. */
export async function entrar(identificador: string, senha: string): Promise<Perfil> {
  const resposta = await api.post<{ jwt: string }>('/auth/local', { identifier: identificador, password: senha });
  salvarToken(resposta.jwt);
  const perfil = await carregarPerfil(true);
  if (!perfil) throw new ErroApi('Não foi possível carregar o seu perfil.', 0);
  return perfil;
}

export interface DadosCadastro {
  tipo: 'empresa' | 'candidato';
  username: string;
  email: string;
  password: string;
  empresa?: { nome: string; cnpj: string; cidade: string; telefone: string; descricao: string };
}

/** Cria a conta e já deixa o usuário logado. */
export async function cadastrar(dados: DadosCadastro): Promise<Perfil> {
  const resposta = await api.post<{ jwt: string }>('/cadastro', dados);
  salvarToken(resposta.jwt);
  const perfil = await carregarPerfil(true);
  if (!perfil) throw new ErroApi('Não foi possível carregar o seu perfil.', 0);
  return perfil;
}

export function sair(): void {
  limparSessao();
  perfilEmCache = null;
  window.location.href = '/index.html';
}

/** Para onde cada papel vai depois do login. */
export function paginaInicialDoPapel(papel: Papel): string {
  switch (papel) {
    case 'administrador':
      return '/admin/empresas.html';
    case 'empresa':
      return '/empresa/painel.html';
    case 'candidato':
      return '/candidato/candidaturas.html';
    default:
      return '/index.html';
  }
}

/**
 * Valida o parâmetro "voltar" da URL de login. Só aceita caminhos do
 * próprio site, para que um link malicioso não leve o usuário a outro site
 * depois do login (open redirect).
 */
export function destinoSeguro(valor: string | null): string | null {
  if (!valor || !valor.startsWith('/') || valor.startsWith('//') || valor.includes('\\')) return null;
  return valor;
}

export const NOME_DO_PAPEL: Record<Papel, string> = {
  public: 'Visitante',
  administrador: 'Administrador',
  empresa: 'Empresa',
  candidato: 'Candidato',
};
