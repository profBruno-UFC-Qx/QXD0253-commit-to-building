import { api, ErroApi } from '../../lib/api';
import { exibirAvisoPendente } from '../../lib/aviso';
import { aoRecarregar, erroAoCarregar } from '../../lib/componentes';
import { carregando, elemento, mostrarAlerta, vazio } from '../../lib/dom';
import { html, renderizar } from '../../lib/html';
import { confirmar } from '../../lib/modal';
import { iniciarAreaRestrita } from '../../lib/pagina';
import { formatarData, selo, SITUACAO_EMPRESA, SITUACAO_VAGA } from '../../lib/rotulos';
import type { RespostaLista, Vaga } from '../../lib/tipos';

const perfil = await iniciarAreaRestrita(['empresa']);
const empresa = perfil.empresa;
const lista = elemento('#lista');
const mensagem = elemento('#mensagem');
let vagas: Vaga[] = [];

exibirAvisoPendente(elemento('#aviso'));

if (empresa) {
  renderizar(elemento('#nome-empresa'), html`${empresa.nome} ${selo(SITUACAO_EMPRESA[empresa.situacao])}`);

  // Regra 1: só empresa aprovada publica vagas.
  if (empresa.situacao !== 'aprovada') {
    const botao = elemento<HTMLAnchorElement>('#botao-nova-vaga');
    botao.classList.add('disabled');
    botao.setAttribute('aria-disabled', 'true');
    botao.removeAttribute('href');
    renderizar(
      elemento('#situacao-empresa'),
      empresa.situacao === 'pendente'
        ? html`<div class="alert alert-warning d-flex gap-2" role="status">
            <i class="bi bi-clock" aria-hidden="true"></i>
            <div><strong>Cadastro em análise.</strong> Assim que o administrador aprovar a sua empresa, você poderá publicar vagas.</div>
          </div>`
        : html`<div class="alert alert-danger d-flex gap-2" role="status">
            <i class="bi bi-x-octagon" aria-hidden="true"></i>
            <div><strong>Cadastro recusado.</strong> Revise os dados em <a href="/empresa/perfil.html" class="alert-link">Minha empresa</a>; ao salvar, o cadastro volta para análise.</div>
          </div>`
    );
  }
}

function indicador(titulo: string, valor: number, icone: string) {
  return html`<div class="col-sm-4">
    <div class="card cartao h-100"><div class="card-body d-flex align-items-center gap-3">
      <span class="icone-circulo"><i class="bi ${icone}" aria-hidden="true"></i></span>
      <div><div class="h4 mb-0">${valor}</div><div class="small text-body-secondary">${titulo}</div></div>
    </div></div>
  </div>`;
}

function renderizarIndicadores(): void {
  const abertas = vagas.filter((v) => v.situacao === 'aberta').length;
  const candidaturas = vagas.reduce((soma, v) => soma + (v.totalCandidaturas ?? 0), 0);
  renderizar(
    elemento('#indicadores'),
    html`${indicador('vagas abertas', abertas, 'bi-unlock')}
      ${indicador('vagas encerradas', vagas.length - abertas, 'bi-lock')}
      ${indicador('candidaturas recebidas', candidaturas, 'bi-people')}`
  );
}

function linhaDaVaga(vaga: Vaga) {
  const aberta = vaga.situacao === 'aberta';
  const total = vaga.totalCandidaturas ?? 0;
  return html`<tr>
    <td>
      <a href="/vaga.html?id=${vaga.documentId}" class="fw-semibold text-decoration-none">${vaga.titulo}</a>
      <div class="small text-body-secondary">${vaga.cidade}</div>
    </td>
    <td>${selo(SITUACAO_VAGA[vaga.situacao])}</td>
    <td>
      <a href="/empresa/candidatos.html?vaga=${vaga.documentId}" class="text-decoration-none">
        <i class="bi bi-people me-1" aria-hidden="true"></i>${total}
      </a>
    </td>
    <td class="small text-nowrap">${formatarData(vaga.createdAt)}</td>
    <td class="text-end text-nowrap">
      <a class="btn btn-sm btn-outline-primary" href="/empresa/vaga-form.html?id=${vaga.documentId}" title="Editar" aria-label="Editar ${vaga.titulo}">
        <i class="bi bi-pencil" aria-hidden="true"></i>
      </a>
      <button type="button" class="btn btn-sm btn-outline-primary" data-acao="${aberta ? 'encerrar' : 'reabrir'}" data-id="${vaga.documentId}"
        title="${aberta ? 'Encerrar' : 'Reabrir'}" aria-label="${aberta ? 'Encerrar' : 'Reabrir'} ${vaga.titulo}">
        <i class="bi ${aberta ? 'bi-lock' : 'bi-unlock'}" aria-hidden="true"></i>
      </button>
      <button type="button" class="btn btn-sm btn-outline-danger" data-acao="excluir" data-id="${vaga.documentId}" title="Excluir" aria-label="Excluir ${vaga.titulo}">
        <i class="bi bi-trash" aria-hidden="true"></i>
      </button>
    </td>
  </tr>`;
}

function renderizarLista(): void {
  const filtro = elemento<HTMLInputElement>('#filtro-situacao input:checked').value;
  const visiveis = filtro ? vagas.filter((v) => v.situacao === filtro) : vagas;
  if (!visiveis.length) {
    renderizar(lista, vazio(vagas.length ? 'Nenhuma vaga nessa situação.' : 'Você ainda não publicou vagas.', 'bi-briefcase'));
    return;
  }
  renderizar(
    lista,
    html`<div class="table-responsive">
      <table class="table align-middle mb-0">
        <thead><tr>
          <th scope="col">Vaga</th><th scope="col">Situação</th><th scope="col">Candidatos</th>
          <th scope="col">Publicada</th><th scope="col" class="text-end">Ações</th>
        </tr></thead>
        <tbody>${visiveis.map(linhaDaVaga)}</tbody>
      </table>
    </div>`
  );
}

async function carregar(): Promise<void> {
  renderizar(lista, carregando());
  try {
    const resposta = await api.get<RespostaLista<Vaga>>('/vagas/minhas', {
      sort: ['createdAt:desc'],
      pagination: { pageSize: 100 },
    });
    vagas = resposta.data;
    renderizarIndicadores();
    renderizarLista();
  } catch (erro) {
    renderizar(lista, erroAoCarregar(erro instanceof ErroApi ? erro.message : 'Não foi possível carregar as vagas.'));
  }
}

async function executarAcao(acao: string, vaga: Vaga): Promise<void> {
  if (acao === 'excluir') {
    const total = vaga.totalCandidaturas ?? 0;
    const ok = await confirmar({
      titulo: 'Excluir vaga',
      mensagem: `Excluir "${vaga.titulo}"? ${total ? `As ${total} candidatura(s) recebidas também serão apagadas. ` : ''}Esta ação não pode ser desfeita. Se quiser só parar de receber candidatos, encerre a vaga.`,
      confirmar: 'Excluir vaga',
      perigo: true,
    });
    if (!ok) return;
    await api.excluir(`/vagas/${vaga.documentId}`);
    mostrarAlerta(mensagem, `Vaga "${vaga.titulo}" excluída.`, 'success');
  } else {
    const novaSituacao = acao === 'encerrar' ? 'encerrada' : 'aberta';
    if (acao === 'encerrar') {
      const ok = await confirmar({
        titulo: 'Encerrar vaga',
        mensagem: `Encerrar "${vaga.titulo}"? Ela sai da lista pública e não recebe mais candidaturas, mas continua aqui no painel e pode ser reaberta.`,
        confirmar: 'Encerrar vaga',
      });
      if (!ok) return;
    }
    await api.put(`/vagas/${vaga.documentId}`, { data: { situacao: novaSituacao } });
    mostrarAlerta(mensagem, `Vaga "${vaga.titulo}" ${novaSituacao === 'aberta' ? 'reaberta' : 'encerrada'}.`, 'success');
  }
  await carregar();
}

lista.addEventListener('click', async (evento) => {
  const botao = (evento.target as Element).closest<HTMLButtonElement>('button[data-acao][data-id]');
  if (!botao) return;
  const vaga = vagas.find((v) => v.documentId === botao.dataset.id);
  if (!vaga) return;
  botao.disabled = true;
  try {
    await executarAcao(botao.dataset.acao ?? '', vaga);
  } catch (erro) {
    mostrarAlerta(mensagem, erro instanceof ErroApi ? erro.message : 'Não foi possível concluir a ação.');
  } finally {
    botao.disabled = false;
  }
});

elemento('#filtro-situacao').addEventListener('change', renderizarLista);
aoRecarregar(lista, () => void carregar());
await carregar();
