import { mostrarAlerta, type TipoAlerta } from './dom';

/**
 * Mensagem que sobrevive a um redirecionamento (ex.: "Vaga criada!" depois
 * de salvar e voltar para o painel). Fica no sessionStorage até ser exibida.
 */
const CHAVE = 'portal-cargas:aviso';

export function definirAviso(mensagem: string, tipo: TipoAlerta = 'success'): void {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify({ mensagem, tipo }));
  } catch {
    /* sem armazenamento: a mensagem simplesmente não aparece */
  }
}

export function exibirAvisoPendente(container: Element): void {
  try {
    const salvo = sessionStorage.getItem(CHAVE);
    if (!salvo) return;
    sessionStorage.removeItem(CHAVE);
    const { mensagem, tipo } = JSON.parse(salvo) as { mensagem: string; tipo: TipoAlerta };
    mostrarAlerta(container, mensagem, tipo);
  } catch {
    /* aviso inválido: ignora */
  }
}
