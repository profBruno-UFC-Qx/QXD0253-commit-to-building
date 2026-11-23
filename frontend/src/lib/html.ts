/**
 * Template de HTML com escape automático.
 *
 * Tudo o que é interpolado em html`...` é escapado, então um texto vindo do
 * usuário (ex.: "<script>") aparece como texto e nunca vira código (XSS).
 * Para inserir um trecho que já é html`...`, basta interpolá-lo também.
 */
const MARCA = Symbol('html-seguro');

export interface HtmlSeguro {
  readonly [MARCA]: true;
  readonly conteudo: string;
}

const ENTIDADES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapar(texto: unknown): string {
  return String(texto).replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

function ehSeguro(valor: unknown): valor is HtmlSeguro {
  return typeof valor === 'object' && valor !== null && MARCA in valor;
}

function converter(valor: unknown): string {
  if (valor === null || valor === undefined || valor === false) return '';
  if (Array.isArray(valor)) return valor.map(converter).join('');
  if (ehSeguro(valor)) return valor.conteudo;
  return escapar(valor);
}

export function html(partes: TemplateStringsArray, ...valores: unknown[]): HtmlSeguro {
  let conteudo = partes[0];
  valores.forEach((valor, i) => {
    conteudo += converter(valor) + partes[i + 1];
  });
  return { [MARCA]: true, conteudo };
}

/** Substitui o conteúdo de um elemento por um HTML seguro. */
export function renderizar(elemento: Element, trecho: HtmlSeguro): void {
  elemento.innerHTML = trecho.conteudo;
}
