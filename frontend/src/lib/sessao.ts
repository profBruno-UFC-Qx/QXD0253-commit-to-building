/**
 * Guarda o JWT no localStorage do navegador. O acesso fica protegido por
 * try/catch porque o armazenamento pode estar bloqueado (ex.: navegação privada).
 */
const CHAVE_TOKEN = 'portal-cargas:token';

export function salvarToken(token: string): void {
  try {
    localStorage.setItem(CHAVE_TOKEN, token);
  } catch {
    /* sem armazenamento disponível: a sessão dura só até recarregar a página */
  }
}

export function obterToken(): string | null {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

export function limparSessao(): void {
  try {
    localStorage.removeItem(CHAVE_TOKEN);
  } catch {
    /* nada a limpar */
  }
}
