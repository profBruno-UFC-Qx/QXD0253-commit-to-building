import { api, ErroApi } from '../../lib/api';
import { aoRecarregar, erroAoCarregar } from '../../lib/componentes';
import { carregando, elemento, mostrarAlerta, vazio } from '../../lib/dom';
import { html, renderizar } from '../../lib/html';
import { iniciarAreaRestrita } from '../../lib/pagina';
import { formatarData, selo, SITUACAO_CANDIDATURA, textoCnh } from '../../lib/rotulos';
import type { Candidatura, RespostaLista, SituacaoCandidatura, Vaga } from '../../lib/tipos';
import { somenteDigitos } from '../../lib/validacao';

await iniciarAreaRestrita(['empresa']);

const lista = elemento('#lista');
const mensagem = elemento('#mensagem');
const filtroVaga = elemento<HTMLSelectElement>('#filtro-vaga');
const filtroSituacao = elemento<HTMLSelectElement>('#filtro-situacao');

/** Situações que a empresa pode escolher (a "enviada" é só a inicial). */
const OPCOES: SituacaoCandidatura[] = ['em_analise', 'aprovada', 'recusada'];

async function carregarVagas(): Promise<void> {
  const { data } = await api.get<RespostaLista<Vaga>>('/vagas/minhas', {
    fields: ['titulo', 'situacao'],
    sort: ['titulo:asc'],
    pagination: { pageSize: 100 },
  });
  renderizar(
    filtroVaga,
    html`<option value="">Todas as vagas</option>
      ${data.map((v) => html`<option value="${v.documentId}">${v.titulo}${v.situacao === 'encerrada' ? ' (encerrada)' : ''}</option>`)}`
  );
  const daUrl = new URLSearchParams(window.location.search).get('vaga');
  if (daUrl && data.some((v) => v.documentId === daUrl)) filtroVaga.value = daUrl;
}

function linkWhatsApp(telefone: string): string {
  return `https://wa.me/55${somenteDigitos(telefone)}`;
}

function cartaoCandidatura(c: Candidatura) {
  const cv = c.curriculo;
  if (!cv) return html``;
  return html`<div class="col">
    <article class="card cartao h-100">
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between gap-2 mb-2">
          <div>
            <h2 class="h5 mb-0">${cv.nome}</h2>
            <div class="small text-body-secondary">${c.vaga?.titulo ?? ''} · ${formatarData(c.createdAt)}</div>
          </div>
          <div data-selo="${c.documentId}">${selo(SITUACAO_CANDIDATURA[c.situacao])}</div>
        </div>
        <ul class="list-unstyled small mb-2">
          <li><i class="bi bi-geo-alt me-1" aria-hidden="true"></i>${cv.cidade}</li>
          <li><i class="bi bi-person-badge me-1" aria-hidden="true"></i>${textoCnh(cv.cnh, 'candidato')} · ${cv.anosExperiencia} ano(s) de experiência</li>
          ${cv.equipamentos ? html`<li><i class="bi bi-gear me-1" aria-hidden="true"></i>${cv.equipamentos}</li>` : ''}
        </ul>
        ${cv.resumo ? html`<p class="small texto-livre text-body-secondary">${cv.resumo}</p>` : ''}
        <div class="mt-auto d-flex flex-wrap gap-2 align-items-end justify-content-between">
          <div class="d-flex gap-2">
            <a class="btn btn-sm btn-outline-primary" href="tel:+55${somenteDigitos(cv.telefone)}"><i class="bi bi-telephone me-1" aria-hidden="true"></i>${cv.telefone}</a>
            <a class="btn btn-sm btn-outline-success" href="${linkWhatsApp(cv.telefone)}" target="_blank" rel="noopener noreferrer" aria-label="Conversar com ${cv.nome} pelo WhatsApp (abre em nova aba)">
              <i class="bi bi-whatsapp" aria-hidden="true"></i>
            </a>
          </div>
          <div>
            <label class="form-label small mb-1" for="sit-${c.documentId}">Mudar situação</label>
            <select class="form-select form-select-sm" id="sit-${c.documentId}" data-candidatura="${c.documentId}" data-nome="${cv.nome}">
              ${c.situacao === 'enviada' ? html`<option value="enviada" selected disabled>Enviada</option>` : ''}
              ${OPCOES.map((s) => html`<option value="${s}" ${s === c.situacao ? html`selected` : ''}>${SITUACAO_CANDIDATURA[s].texto}</option>`)}
            </select>
          </div>
        </div>
      </div>
    </article>
  </div>`;
}

async function carregar(): Promise<void> {
  renderizar(lista, carregando());
  const condicoes: Record<string, unknown>[] = [];
  if (filtroVaga.value) condicoes.push({ vaga: { documentId: { $eq: filtroVaga.value } } });
  if (filtroSituacao.value) condicoes.push({ situacao: { $eq: filtroSituacao.value } });

  try {
    const { data, meta } = await api.get<RespostaLista<Candidatura>>('/candidaturas', {
      filters: condicoes.length ? { $and: condicoes } : undefined,
      populate: { curriculo: true, vaga: { fields: ['titulo'] } },
      sort: ['createdAt:desc'],
      pagination: { pageSize: 100 },
    });
    const total = meta.pagination.total;
    elemento('#resumo').textContent = total === 1 ? '1 candidatura' : `${total} candidaturas`;
    renderizar(
      lista,
      data.length
        ? html`<div class="row row-cols-1 row-cols-lg-2 g-3">${data.map(cartaoCandidatura)}</div>`
        : vazio('Nenhuma candidatura encontrada.', 'bi-people')
    );
  } catch (erro) {
    renderizar(lista, erroAoCarregar(erro instanceof ErroApi ? erro.message : 'Não foi possível carregar os candidatos.'));
  }
}

lista.addEventListener('change', async (evento) => {
  const select = evento.target as HTMLSelectElement;
  const id = select.dataset.candidatura;
  if (!id) return;
  const situacao = select.value as SituacaoCandidatura;
  select.disabled = true;
  try {
    await api.put(`/candidaturas/${id}`, { data: { situacao } });
    renderizar(elemento(`[data-selo="${id}"]`), selo(SITUACAO_CANDIDATURA[situacao]));
    select.querySelector('option[value="enviada"]')?.remove();
    mostrarAlerta(mensagem, `Situação de ${select.dataset.nome} alterada para "${SITUACAO_CANDIDATURA[situacao].texto}".`, 'success');
  } catch (erro) {
    mostrarAlerta(mensagem, erro instanceof ErroApi ? erro.message : 'Não foi possível alterar a situação.');
  } finally {
    select.disabled = false;
  }
});

for (const filtro of [filtroVaga, filtroSituacao]) {
  filtro.addEventListener('change', () => {
    const url = new URL(window.location.href);
    if (filtroVaga.value) url.searchParams.set('vaga', filtroVaga.value);
    else url.searchParams.delete('vaga');
    history.replaceState(null, '', url);
    void carregar();
  });
}

aoRecarregar(lista, () => void carregar());
try {
  await carregarVagas();
} catch {
  /* sem a lista de vagas, o filtro fica só com "Todas" */
}
await carregar();
