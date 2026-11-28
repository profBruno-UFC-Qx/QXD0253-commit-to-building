import { API_URL } from './config';
import { limparSessao, obterToken } from './sessao';

/** Erro de uma chamada à API, já com a mensagem pronta para mostrar ao usuário. */
export class ErroApi extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ErroApi';
  }
}

/** Mensagens do Strapi que chegam em inglês e a tradução para o usuário. */
const TRADUCOES: Record<string, string> = {
  'Invalid identifier or password': 'E-mail/usuário ou senha incorretos.',
  'Your account has been blocked by an administrator': 'Sua conta foi bloqueada pelo administrador.',
  'Too many requests, please try again later.': 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.',
  Forbidden: 'Você não tem permissão para fazer isso.',
  Unauthorized: 'Sua sessão expirou. Entre novamente.',
  'Not Found': 'Registro não encontrado.',
};

function mensagemDeErro(corpo: unknown, status: number): string {
  const mensagem = (corpo as { error?: { message?: string } } | null)?.error?.message;
  if (mensagem) return TRADUCOES[mensagem] ?? mensagem;
  if (status === 401) return TRADUCOES.Unauthorized;
  if (status === 403) return TRADUCOES.Forbidden;
  if (status === 404) return TRADUCOES['Not Found'];
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

type Parametros = Record<string, unknown>;

/**
 * Converte objetos aninhados para o formato de query string do Strapi.
 * Ex.: { filters: { cidade: { $eq: 'Fortaleza' } } } → filters[cidade][$eq]=Fortaleza
 */
export function montarQuery(parametros: Parametros): string {
  const pares: string[] = [];
  const adicionar = (chave: string, valor: unknown): void => {
    if (valor === undefined || valor === null || valor === '') return;
    if (Array.isArray(valor)) valor.forEach((v, i) => adicionar(`${chave}[${i}]`, v));
    else if (typeof valor === 'object') {
      for (const [k, v] of Object.entries(valor as Parametros)) adicionar(`${chave}[${k}]`, v);
    } else pares.push(`${encodeURIComponent(chave)}=${encodeURIComponent(String(valor))}`);
  };
  for (const [chave, valor] of Object.entries(parametros)) adicionar(chave, valor);
  return pares.length ? `?${pares.join('&')}` : '';
}

async function requisicao<T>(metodo: string, caminho: string, corpo?: unknown, parametros?: Parametros): Promise<T> {
  const cabecalhos: Record<string, string> = { Accept: 'application/json' };
  const token = obterToken();
  if (token) cabecalhos.Authorization = `Bearer ${token}`;
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';

  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}/api${caminho}${parametros ? montarQuery(parametros) : ''}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi('Não foi possível conectar ao servidor. Verifique se o backend está rodando.', 0);
  }

  if (resposta.status === 204) return undefined as T;
  const dados: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    // Token vencido ou inválido: descarta a sessão para o usuário entrar de novo.
    if (resposta.status === 401 && token) limparSessao();
    throw new ErroApi(mensagemDeErro(dados, resposta.status), resposta.status);
  }
  return dados as T;
}

export const api = {
  get: <T>(caminho: string, parametros?: Parametros) => requisicao<T>('GET', caminho, undefined, parametros),
  post: <T>(caminho: string, corpo: unknown) => requisicao<T>('POST', caminho, corpo),
  put: <T>(caminho: string, corpo: unknown) => requisicao<T>('PUT', caminho, corpo),
  excluir: (caminho: string) => requisicao<void>('DELETE', caminho),
};
