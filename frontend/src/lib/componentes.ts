import { html } from './html';
import { urlDaMidia } from './midia';
import { formatarData, formatarSalario, selo, SITUACAO_VAGA, textoCnh, TIPO_VAGA } from './rotulos';
import type { Empresa, Paginacao, Vaga } from './tipos';

/** Cartão de vaga usado na página inicial e na lista de vagas. */
export function cartaoVaga(vaga: Vaga, opcoes: { mostrarSituacao?: boolean } = {}) {
  const tipo = TIPO_VAGA[vaga.tipo];
  return html`<div class="col">
    <article class="card cartao cartao-interativo h-100">
      <div class="card-body d-flex flex-column">
        <div class="d-flex gap-3 mb-2">
          <span class="icone-circulo"><i class="bi ${tipo.icone}" aria-hidden="true"></i></span>
          <div class="min-w-0">
            <h3 class="h6 mb-1">
              <a class="stretched-link text-decoration-none text-body" href="/vaga.html?id=${vaga.documentId}">${vaga.titulo}</a>
            </h3>
            <div class="small text-body-secondary">
              ${vaga.empresa?.logo ? html`<img src="${urlDaMidia(vaga.empresa.logo, 'thumbnail')}" class="logo-mini me-1" alt="" loading="lazy" />` : ''}${vaga.empresa?.nome ?? ''}
            </div>
          </div>
        </div>
        <ul class="list-unstyled small text-body-secondary mb-3">
          <li><i class="bi bi-geo-alt me-1" aria-hidden="true"></i>${vaga.cidade}</li>
          <li><i class="bi bi-person-badge me-1" aria-hidden="true"></i>${textoCnh(vaga.cnhExigida)}</li>
          ${vaga.equipamento ? html`<li><i class="bi bi-gear me-1" aria-hidden="true"></i>${vaga.equipamento}</li>` : ''}
        </ul>
        <div class="mt-auto d-flex justify-content-between align-items-center">
          <span class="fw-semibold">${formatarSalario(vaga.salario)}</span>
          ${opcoes.mostrarSituacao
            ? selo(SITUACAO_VAGA[vaga.situacao])
            : html`<span class="small text-body-secondary">${formatarData(vaga.createdAt)}</span>`}
        </div>
      </div>
    </article>
  </div>`;
}

/** Cartão de empresa (página de empresas). */
export function cartaoEmpresa(empresa: Empresa, totalVagas: number) {
  return html`<div class="col">
    <article class="card cartao h-100">
      <div class="card-body d-flex flex-column">
        ${empresa.logo
          ? html`<img src="${urlDaMidia(empresa.logo, 'small')}" class="logo-empresa mb-3" alt="Logo da ${empresa.nome}" loading="lazy" />`
          : ''}
        <div class="d-flex gap-3 align-items-center mb-3">
          ${empresa.logo ? '' : html`<span class="icone-circulo"><i class="bi bi-buildings" aria-hidden="true"></i></span>`}
          <div>
            <h2 class="h5 mb-0">${empresa.nome}</h2>
            <span class="small text-body-secondary"><i class="bi bi-geo-alt me-1" aria-hidden="true"></i>${empresa.cidade}</span>
          </div>
        </div>
        <p class="small texto-livre flex-grow-1">${empresa.descricao || 'Empresa participante do portal.'}</p>
        <div class="d-flex justify-content-between align-items-center">
          <span class="small"><i class="bi bi-telephone me-1" aria-hidden="true"></i>${empresa.telefone}</span>
          <a class="btn btn-outline-primary btn-sm" href="/vagas.html?empresa=${empresa.documentId}">
            ${totalVagas === 1 ? '1 vaga aberta' : `${totalVagas} vagas abertas`}
          </a>
        </div>
      </div>
    </article>
  </div>`;
}

/**
 * Paginação do Bootstrap. Os botões têm data-pagina; quem usa escuta o
 * clique no container e lê o número da página.
 */
export function paginacao(meta: Paginacao) {
  if (meta.pageCount <= 1) return html``;
  const paginas = Array.from({ length: meta.pageCount }, (_, i) => i + 1);
  const item = (pagina: number, texto: unknown, desabilitado = false, ativo = false) =>
    html`<li class="page-item${desabilitado ? ' disabled' : ''}${ativo ? ' active' : ''}">
      <button type="button" class="page-link" data-pagina="${pagina}" ${ativo ? html`aria-current="page"` : ''} ${desabilitado ? html`disabled` : ''}>${texto}</button>
    </li>`;
  return html`<nav aria-label="Paginação" class="mt-4">
    <ul class="pagination justify-content-center flex-wrap">
      ${item(meta.page - 1, html`<span aria-hidden="true">&laquo;</span><span class="visually-hidden">Anterior</span>`, meta.page === 1)}
      ${paginas.map((p) => item(p, p, false, p === meta.page))}
      ${item(meta.page + 1, html`<span aria-hidden="true">&raquo;</span><span class="visually-hidden">Próxima</span>`, meta.page === meta.pageCount)}
    </ul>
  </nav>`;
}

/** Erro ao carregar dados, com botão para tentar de novo. */
export function erroAoCarregar(mensagem: string) {
  return html`<div class="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center gap-2" role="alert">
    <span class="flex-grow-1"><i class="bi bi-wifi-off me-1" aria-hidden="true"></i>${mensagem}</span>
    <button type="button" class="btn btn-sm btn-outline-danger" data-acao="recarregar">Tentar de novo</button>
  </div>`;
}

/** Liga o botão "Tentar de novo" de erroAoCarregar. */
export function aoRecarregar(container: Element, acao: () => void): void {
  container.addEventListener('click', (evento) => {
    if ((evento.target as Element).closest('[data-acao="recarregar"]')) acao();
  });
}
