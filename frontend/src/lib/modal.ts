import Modal from 'bootstrap/js/dist/modal';
import { html, renderizar } from './html';

interface OpcoesConfirmacao {
  titulo: string;
  mensagem: string;
  /** Texto do botão de confirmar (ex.: "Excluir vaga") */
  confirmar: string;
  /** Ação destrutiva: botão vermelho */
  perigo?: boolean;
}

/**
 * Janela de confirmação do Bootstrap. Devolve true se o usuário confirmou.
 * Uso: if (await confirmar({ ... })) { ... }
 */
export function confirmar(opcoes: OpcoesConfirmacao): Promise<boolean> {
  const container = document.createElement('div');
  document.body.append(container);
  renderizar(
    container,
    html`<div class="modal fade" tabindex="-1" aria-labelledby="titulo-confirmacao" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h5" id="titulo-confirmacao">${opcoes.titulo}</h2>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body"><p class="mb-0">${opcoes.mensagem}</p></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Voltar</button>
            <button type="button" class="btn ${opcoes.perigo ? 'btn-danger' : 'btn-primary'}" data-confirmar>${opcoes.confirmar}</button>
          </div>
        </div>
      </div>
    </div>`
  );

  const elementoModal = container.firstElementChild as HTMLElement;
  const modal = new Modal(elementoModal);

  return new Promise((resolve) => {
    let confirmado = false;
    elementoModal.querySelector('[data-confirmar]')?.addEventListener('click', () => {
      confirmado = true;
      modal.hide();
    });
    elementoModal.addEventListener('hidden.bs.modal', () => {
      modal.dispose();
      container.remove();
      resolve(confirmado);
    });
    modal.show();
  });
}
