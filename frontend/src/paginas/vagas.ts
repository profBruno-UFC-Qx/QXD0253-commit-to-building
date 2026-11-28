import { api, ErroApi } from '../lib/api';
import { categoriasAtendidas } from '../lib/cnh';
import { aoRecarregar, cartaoVaga, erroAoCarregar, paginacao } from '../lib/componentes';
import { carregando, elemento, vazio } from '../lib/dom';
import { html, renderizar } from '../lib/html';
import { iniciarPagina } from '../lib/pagina';
import type { CategoriaCnh, Empresa, RespostaItem, RespostaLista, Vaga } from '../lib/tipos';
import { CIDADES_RMF } from '../lib/validacao';

await iniciarPagina();

const TAMANHO_DA_PAGINA = 9;
const form = elemento<HTMLFormElement>('#form-filtros');
const lista = elemento('#lista');
const resumo = elemento('#resumo');
const selectCidade = elemento<HTMLSelectElement>('#cidade');

renderizar(selectCidade, html`<option value="">Todas</option>${CIDADES_RMF.map((c) => html`<option>${c}</option>`)}`);

interface Filtros {
  busca: string;
  cidade: string;
  tipo: string;
  cnh: string;
  ordem: string;
  empresa: string;
  pagina: number;
}

/** Os filtros ficam na URL, então dá para compartilhar uma busca ou voltar para ela. */
function filtrosDaUrl(): Filtros {
  const p = new URLSearchParams(window.location.search);
  return {
    busca: p.get('busca') ?? '',
    cidade: p.get('cidade') ?? '',
    tipo: p.get('tipo') ?? '',
    cnh: p.get('cnh') ?? '',
    ordem: p.get('ordem') ?? 'recentes',
    empresa: p.get('empresa') ?? '',
    pagina: Math.max(1, Number(p.get('pagina')) || 1),
  };
}

function atualizarUrl(filtros: Filtros): void {
  const p = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor && !(chave === 'pagina' && valor === 1) && !(chave === 'ordem' && valor === 'recentes')) {
      p.set(chave, String(valor));
    }
  }
  const query = p.toString();
  history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
}

function preencherFormulario(filtros: Filtros): void {
  for (const campo of ['busca', 'cidade', 'tipo', 'cnh', 'ordem'] as const) {
    elemento<HTMLInputElement | HTMLSelectElement>(`#${campo}`).value = filtros[campo];
  }
}

/** Monta os filtros no formato do Strapi. */
function filtrosDaApi(f: Filtros): Record<string, unknown> {
  const condicoes: Record<string, unknown>[] = [];
  if (f.busca) {
    condicoes.push({
      $or: [{ titulo: { $containsi: f.busca } }, { descricao: { $containsi: f.busca } }, { equipamento: { $containsi: f.busca } }],
    });
  }
  if (f.cidade) condicoes.push({ cidade: { $eqi: f.cidade } });
  if (f.tipo) condicoes.push({ tipo: { $eq: f.tipo } });
  if (f.cnh) condicoes.push({ cnhExigida: { $in: categoriasAtendidas(f.cnh as CategoriaCnh) } });
  if (f.empresa) condicoes.push({ empresa: { documentId: { $eq: f.empresa } } });
  return condicoes.length ? { $and: condicoes } : {};
}

async function mostrarEmpresaFiltrada(documentId: string): Promise<void> {
  const destino = elemento('#filtro-empresa');
  if (!documentId) {
    destino.innerHTML = '';
    return;
  }
  try {
    const { data } = await api.get<RespostaItem<Empresa>>(`/empresas/${encodeURIComponent(documentId)}`);
    renderizar(
      destino,
      html`<span class="badge rounded-pill text-bg-light border fs-6 fw-normal">
        <i class="bi bi-buildings me-1" aria-hidden="true"></i>${data.nome}
        <a href="/vagas.html" class="ms-1 text-body-secondary" aria-label="Remover filtro de empresa"><i class="bi bi-x-lg" aria-hidden="true"></i></a>
      </span>`
    );
  } catch {
    destino.innerHTML = '';
  }
}

async function carregar(): Promise<void> {
  const filtros = filtrosDaUrl();
  preencherFormulario(filtros);
  renderizar(lista, carregando('Buscando vagas...'));

  try {
    const resposta = await api.get<RespostaLista<Vaga>>('/vagas', {
      filters: filtrosDaApi(filtros),
      populate: { empresa: { populate: ['logo'] } },
      sort: filtros.ordem === 'salario' ? ['salario:desc', 'createdAt:desc'] : ['createdAt:desc'],
      pagination: { page: filtros.pagina, pageSize: TAMANHO_DA_PAGINA },
    });
    const { total } = resposta.meta.pagination;
    resumo.textContent =
      total === 0 ? 'Nenhuma vaga encontrada' : total === 1 ? '1 vaga encontrada' : `${total} vagas encontradas`;

    renderizar(
      lista,
      resposta.data.length
        ? html`<div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">${resposta.data.map((v) => cartaoVaga(v))}</div>
            ${paginacao(resposta.meta.pagination)}`
        : vazio('Nenhuma vaga com esses filtros. Tente outra busca.', 'bi-search')
    );
  } catch (erro) {
    resumo.textContent = '';
    renderizar(lista, erroAoCarregar(erro instanceof ErroApi ? erro.message : 'Não foi possível carregar as vagas.'));
  }
}

form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const dados = new FormData(form);
  atualizarUrl({
    busca: String(dados.get('busca') ?? '').trim(),
    cidade: String(dados.get('cidade') ?? ''),
    tipo: String(dados.get('tipo') ?? ''),
    cnh: String(dados.get('cnh') ?? ''),
    ordem: String(dados.get('ordem') ?? 'recentes'),
    empresa: filtrosDaUrl().empresa,
    pagina: 1,
  });
  void carregar();
});

form.addEventListener('reset', () => {
  history.replaceState(null, '', window.location.pathname);
  void mostrarEmpresaFiltrada('');
  // espera o navegador limpar os campos antes de buscar de novo
  setTimeout(() => void carregar());
});

// Filtros de lista (select) aplicam na hora; a busca por texto, no "Buscar".
form.addEventListener('change', (evento) => {
  if ((evento.target as Element).matches('select')) form.requestSubmit();
});

lista.addEventListener('click', (evento) => {
  const botao = (evento.target as Element).closest<HTMLButtonElement>('[data-pagina]');
  if (!botao) return;
  atualizarUrl({ ...filtrosDaUrl(), pagina: Number(botao.dataset.pagina) });
  void carregar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

aoRecarregar(lista, () => void carregar());
void mostrarEmpresaFiltrada(filtrosDaUrl().empresa);
await carregar();
