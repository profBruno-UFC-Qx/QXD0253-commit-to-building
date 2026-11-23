import { api, ErroApi } from '../lib/api';
import { paginaInicialDoPapel } from '../lib/auth';
import { aoRecarregar, cartaoVaga, erroAoCarregar } from '../lib/componentes';
import { carregando, elemento, vazio } from '../lib/dom';
import { html, renderizar } from '../lib/html';
import { iniciarPagina } from '../lib/pagina';
import type { RespostaLista, Vaga } from '../lib/tipos';

const perfil = await iniciarPagina();
const ultimas = elemento('#ultimas-vagas');

// Quem já está logado vê "Ir para a minha área" no lugar dos botões de cadastro.
if (perfil) {
  document.querySelectorAll<HTMLAnchorElement>('[data-somente-visitante]').forEach((link) => {
    link.href = paginaInicialDoPapel(perfil.papel);
    link.textContent = 'Ir para a minha área';
  });
}

async function carregarNumeros(): Promise<void> {
  const total = async (caminho: string) =>
    (await api.get<RespostaLista<unknown>>(caminho, { pagination: { pageSize: 1 }, fields: ['id'] })).meta.pagination.total;
  try {
    const [vagas, empresas] = await Promise.all([total('/vagas'), total('/empresas')]);
    elemento('#total-vagas').textContent = String(vagas);
    elemento('#total-empresas').textContent = String(empresas);
  } catch {
    /* os números são só um complemento; se falhar, fica o "–" */
  }
}

async function carregarUltimas(): Promise<void> {
  renderizar(ultimas, carregando());
  try {
    const { data } = await api.get<RespostaLista<Vaga>>('/vagas', {
      populate: ['empresa'],
      sort: ['createdAt:desc'],
      pagination: { pageSize: 6 },
    });
    renderizar(
      ultimas,
      data.length
        ? html`<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">${data.map((v) => cartaoVaga(v))}</div>`
        : vazio('Nenhuma vaga aberta no momento.', 'bi-briefcase')
    );
  } catch (erro) {
    renderizar(ultimas, erroAoCarregar(erro instanceof ErroApi ? erro.message : 'Não foi possível carregar as vagas.'));
  }
}

aoRecarregar(ultimas, () => void carregarUltimas());
await Promise.all([carregarNumeros(), carregarUltimas()]);
