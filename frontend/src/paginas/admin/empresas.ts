import { api, ErroApi } from '../../lib/api';
import { aoRecarregar, erroAoCarregar } from '../../lib/componentes';
import { carregando, elemento, mostrarAlerta, vazio } from '../../lib/dom';
import { html, renderizar } from '../../lib/html';
import { confirmar } from '../../lib/modal';
import { iniciarAreaRestrita } from '../../lib/pagina';
import { formatarCnpj, formatarData, selo, SITUACAO_EMPRESA } from '../../lib/rotulos';
import type { Empresa, RespostaLista, SituacaoEmpresa } from '../../lib/tipos';

await iniciarAreaRestrita(['administrador']);

const lista = elemento('#lista');
const mensagem = elemento('#mensagem');
const abas = elemento('#abas');
let situacaoAtual: SituacaoEmpresa = 'pendente';
let empresas: Empresa[] = [];

/** Ações disponíveis conforme a situação atual da empresa. */
const ACOES: Record<SituacaoEmpresa, { para: SituacaoEmpresa; texto: string; classe: string; icone: string }[]> = {
  pendente: [
    { para: 'aprovada', texto: 'Aprovar', classe: 'btn-success', icone: 'bi-check-lg' },
    { para: 'recusada', texto: 'Recusar', classe: 'btn-outline-danger', icone: 'bi-x-lg' },
  ],
  aprovada: [{ para: 'recusada', texto: 'Suspender', classe: 'btn-outline-danger', icone: 'bi-slash-circle' }],
  recusada: [{ para: 'aprovada', texto: 'Aprovar', classe: 'btn-outline-success', icone: 'bi-check-lg' }],
};

function cartao(e: Empresa) {
  return html`<div class="col">
    <article class="card cartao h-100">
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between gap-2 mb-2">
          <h2 class="h5 mb-0">${e.nome}</h2>
          ${selo(SITUACAO_EMPRESA[e.situacao])}
        </div>
        <dl class="row small mb-2">
          <dt class="col-4">CNPJ</dt><dd class="col-8">${formatarCnpj(e.cnpj)}</dd>
          <dt class="col-4">Cidade</dt><dd class="col-8">${e.cidade}</dd>
          <dt class="col-4">Telefone</dt><dd class="col-8">${e.telefone}</dd>
          <dt class="col-4">Cadastro</dt><dd class="col-8">${formatarData(e.createdAt)}</dd>
        </dl>
        ${e.descricao ? html`<p class="small texto-livre text-body-secondary">${e.descricao}</p>` : ''}
        <div class="mt-auto d-flex gap-2 justify-content-end">
          ${ACOES[e.situacao].map(
            (a) => html`<button type="button" class="btn btn-sm ${a.classe}" data-id="${e.documentId}" data-para="${a.para}">
              <i class="bi ${a.icone} me-1" aria-hidden="true"></i>${a.texto}
            </button>`
          )}
        </div>
      </div>
    </article>
  </div>`;
}

async function atualizarTotais(): Promise<void> {
  const situacoes: SituacaoEmpresa[] = ['pendente', 'aprovada', 'recusada'];
  const totais = await Promise.all(
    situacoes.map((s) =>
      api
        .get<RespostaLista<Empresa>>('/empresas', { filters: { situacao: { $eq: s } }, fields: ['id'], pagination: { pageSize: 1 } })
        .then((r) => r.meta.pagination.total)
        .catch(() => null)
    )
  );
  situacoes.forEach((s, i) => {
    elemento(`[data-total="${s}"]`).textContent = totais[i] === null ? '–' : String(totais[i]);
  });
}

async function carregar(): Promise<void> {
  renderizar(lista, carregando());
  void atualizarTotais();
  try {
    const { data } = await api.get<RespostaLista<Empresa>>('/empresas', {
      filters: { situacao: { $eq: situacaoAtual } },
      sort: ['createdAt:asc'],
      pagination: { pageSize: 100 },
    });
    empresas = data;
    const textoVazio: Record<SituacaoEmpresa, string> = {
      pendente: 'Nenhuma empresa aguardando aprovação.',
      aprovada: 'Nenhuma empresa aprovada.',
      recusada: 'Nenhuma empresa recusada.',
    };
    renderizar(
      lista,
      data.length
        ? html`<div class="row row-cols-1 row-cols-lg-2 g-3">${data.map(cartao)}</div>`
        : vazio(textoVazio[situacaoAtual], 'bi-buildings')
    );
  } catch (erro) {
    renderizar(lista, erroAoCarregar(erro instanceof ErroApi ? erro.message : 'Não foi possível carregar as empresas.'));
  }
}

abas.addEventListener('click', (evento) => {
  const aba = (evento.target as Element).closest<HTMLButtonElement>('[data-situacao]');
  if (!aba) return;
  abas.querySelectorAll('[data-situacao]').forEach((b) => {
    b.classList.toggle('active', b === aba);
    b.setAttribute('aria-selected', String(b === aba));
  });
  situacaoAtual = aba.dataset.situacao as SituacaoEmpresa;
  void carregar();
});

lista.addEventListener('click', async (evento) => {
  const botao = (evento.target as Element).closest<HTMLButtonElement>('button[data-id][data-para]');
  if (!botao) return;
  const empresa = empresas.find((e) => e.documentId === botao.dataset.id);
  const para = botao.dataset.para as SituacaoEmpresa;
  if (!empresa) return;

  if (para === 'recusada') {
    const ok = await confirmar({
      titulo: empresa.situacao === 'aprovada' ? 'Suspender empresa' : 'Recusar empresa',
      mensagem: `${empresa.nome} não poderá publicar vagas, e as vagas dela deixam de aparecer no portal.`,
      confirmar: empresa.situacao === 'aprovada' ? 'Suspender' : 'Recusar',
      perigo: true,
    });
    if (!ok) return;
  }

  botao.disabled = true;
  try {
    await api.put(`/empresas/${empresa.documentId}`, { data: { situacao: para } });
    mostrarAlerta(mensagem, `${empresa.nome}: cadastro ${para === 'aprovada' ? 'aprovado' : 'recusado'}.`, 'success');
    await carregar();
  } catch (erro) {
    mostrarAlerta(mensagem, erro instanceof ErroApi ? erro.message : 'Não foi possível alterar a situação.');
    botao.disabled = false;
  }
});

aoRecarregar(lista, () => void carregar());
await carregar();
