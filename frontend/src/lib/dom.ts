import { html, renderizar } from './html';

/** querySelector que falha com uma mensagem clara se o elemento não existir. */
export function elemento<T extends Element = HTMLElement>(seletor: string, raiz: ParentNode = document): T {
  const encontrado = raiz.querySelector<T>(seletor);
  if (!encontrado) throw new Error(`Elemento não encontrado: ${seletor}`);
  return encontrado;
}

export type TipoAlerta = 'success' | 'danger' | 'warning' | 'info';

const ICONES: Record<TipoAlerta, string> = {
  success: 'bi-check-circle-fill',
  danger: 'bi-exclamation-triangle-fill',
  warning: 'bi-exclamation-circle-fill',
  info: 'bi-info-circle-fill',
};

/** Mostra uma mensagem (alerta do Bootstrap) dentro do container. */
export function mostrarAlerta(container: Element, mensagem: string, tipo: TipoAlerta = 'danger'): void {
  renderizar(
    container,
    html`<div class="alert alert-${tipo} d-flex align-items-center gap-2" role="alert">
      <i class="bi ${ICONES[tipo]}" aria-hidden="true"></i>
      <span>${mensagem}</span>
    </div>`
  );
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function limparAlerta(container: Element): void {
  container.innerHTML = '';
}

/** Desabilita o botão e mostra um spinner enquanto uma ação está em andamento. */
export function definirCarregando(botao: HTMLButtonElement, carregando: boolean): void {
  if (carregando) {
    botao.dataset.textoOriginal = botao.innerHTML;
    botao.disabled = true;
    renderizar(botao, html`<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Aguarde...`);
  } else {
    botao.disabled = false;
    if (botao.dataset.textoOriginal !== undefined) botao.innerHTML = botao.dataset.textoOriginal;
  }
}

/** Indicador de carregamento para listas e páginas. */
export function carregando(texto = 'Carregando...') {
  return html`<div class="d-flex justify-content-center align-items-center gap-2 py-5 text-body-secondary">
    <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>${texto}
  </div>`;
}

/** Estado vazio para listas. */
export function vazio(texto: string, icone = 'bi-inbox') {
  return html`<div class="text-center text-body-secondary py-5">
    <i class="bi ${icone} fs-1 d-block mb-2" aria-hidden="true"></i>${texto}
  </div>`;
}

/** Lê os campos de um formulário como objeto { nome: valor }. */
export function lerFormulario(form: HTMLFormElement): Record<string, string> {
  const dados: Record<string, string> = {};
  new FormData(form).forEach((valor, chave) => {
    if (typeof valor === 'string') dados[chave] = valor.trim();
  });
  return dados;
}

/**
 * Validação nativa do navegador com o visual do Bootstrap.
 * Retorna true se o formulário está válido.
 */
export function validarFormulario(form: HTMLFormElement): boolean {
  form.classList.add('was-validated');
  return form.checkValidity();
}
