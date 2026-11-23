import { api, ErroApi } from '../../lib/api';
import { exibirAvisoPendente } from '../../lib/aviso';
import { aoRecarregar, erroAoCarregar } from '../../lib/componentes';
import { carregando, elemento, mostrarAlerta, vazio } from '../../lib/dom';
import { html, renderizar } from '../../lib/html';
import { confirmar } from '../../lib/modal';
import { iniciarAreaRestrita } from '../../lib/pagina';
import { formatarData, selo, SITUACAO_CANDIDATURA, SITUACAO_VAGA } from '../../lib/rotulos';
import type { Candidatura, RespostaLista } from '../../lib/tipos';

const perfil = await iniciarAreaRestrita(['candidato']);
const lista = elemento('#lista');
const mensagem = elemento('#mensagem');
let candidaturas: Candidatura[] = [];

/** Regra 7: só dá para cancelar enquanto enviada ou em análise. */
const PODE_CANCELAR = ['enviada', 'em_analise'];

exibirAvisoPendente(elemento('#aviso'));
if (!perfil.curriculo) {
  renderizar(
    elemento('#alerta-curriculo'),
    html`<div class="alert alert-warning d-flex flex-column flex-sm-row align-items-sm-center gap-2">
      <span class="flex-grow-1"><i class="bi bi-person-vcard me-1" aria-hidden="true"></i>Você ainda não preencheu o currículo. Sem ele não é possível se candidatar.</span>
      <a class="btn btn-sm btn-warning" href="/candidato/curriculo.html">Preencher currículo</a>
    </div>`
  );
}

function linha(c: Candidatura) {
  const vaga = c.vaga;
  return html`<li class="list-group-item py-3">
    <div class="d-flex flex-column flex-md-row gap-2 justify-content-between align-items-md-center">
      <div class="min-w-0">
        ${vaga
          ? html`${vaga.situacao === 'aberta'
                ? html`<a class="fw-semibold text-decoration-none" href="/vaga.html?id=${vaga.documentId}">${vaga.titulo}</a>`
                : html`<span class="fw-semibold">${vaga.titulo}</span> <span class="ms-1">${selo(SITUACAO_VAGA.encerrada)}</span>`}
              <div class="small text-body-secondary">${vaga.empresa?.nome ?? ''} · ${vaga.cidade}</div>`
          : html`<span class="text-body-secondary">Vaga removida</span>`}
        <div class="small text-body-secondary">Enviada em ${formatarData(c.createdAt)}</div>
      </div>
      <div class="d-flex align-items-center gap-2">
        ${selo(SITUACAO_CANDIDATURA[c.situacao])}
        ${PODE_CANCELAR.includes(c.situacao)
          ? html`<button type="button" class="btn btn-sm btn-outline-danger" data-cancelar="${c.documentId}">Cancelar</button>`
          : ''}
      </div>
    </div>
  </li>`;
}

async function carregar(): Promise<void> {
  renderizar(lista, carregando());
  try {
    const { data } = await api.get<RespostaLista<Candidatura>>('/candidaturas', {
      populate: { vaga: { populate: { empresa: { fields: ['nome'] } } } },
      sort: ['createdAt:desc'],
      pagination: { pageSize: 100 },
    });
    candidaturas = data;
    const emAndamento = data.filter((c) => PODE_CANCELAR.includes(c.situacao)).length;
    elemento('#resumo').textContent = data.length
      ? `${data.length} candidatura(s), ${emAndamento} aguardando resposta`
      : '';
    renderizar(
      lista,
      data.length
        ? html`<ul class="list-group cartao">${data.map(linha)}</ul>`
        : vazio('Você ainda não se candidatou a nenhuma vaga.', 'bi-send')
    );
  } catch (erro) {
    renderizar(lista, erroAoCarregar(erro instanceof ErroApi ? erro.message : 'Não foi possível carregar as candidaturas.'));
  }
}

lista.addEventListener('click', async (evento) => {
  const botao = (evento.target as Element).closest<HTMLButtonElement>('[data-cancelar]');
  if (!botao) return;
  const candidatura = candidaturas.find((c) => c.documentId === botao.dataset.cancelar);
  const titulo = candidatura?.vaga?.titulo ?? 'esta vaga';
  const ok = await confirmar({
    titulo: 'Cancelar candidatura',
    mensagem: `Cancelar a sua candidatura para "${titulo}"? A empresa deixará de ver o seu currículo para esta vaga.`,
    confirmar: 'Cancelar candidatura',
    perigo: true,
  });
  if (!ok) return;
  botao.disabled = true;
  try {
    await api.excluir(`/candidaturas/${botao.dataset.cancelar}`);
    mostrarAlerta(mensagem, `Candidatura para "${titulo}" cancelada.`, 'success');
    await carregar();
  } catch (erro) {
    mostrarAlerta(mensagem, erro instanceof ErroApi ? erro.message : 'Não foi possível cancelar.');
    botao.disabled = false;
  }
});

aoRecarregar(lista, () => void carregar());
await carregar();
