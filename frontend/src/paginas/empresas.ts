import { api, ErroApi } from '../lib/api';
import { aoRecarregar, cartaoEmpresa, erroAoCarregar } from '../lib/componentes';
import { carregando, elemento, vazio } from '../lib/dom';
import { html, renderizar } from '../lib/html';
import { iniciarPagina } from '../lib/pagina';
import type { Empresa, RespostaLista } from '../lib/tipos';

await iniciarPagina();
const lista = elemento('#lista');

async function carregar(): Promise<void> {
  renderizar(lista, carregando());
  try {
    const { data } = await api.get<RespostaLista<Empresa>>('/empresas', {
      sort: ['nome:asc'],
      // traz só o id das vagas abertas, para contar
      populate: { logo: true, vagas: { fields: ['id'], filters: { situacao: { $eq: 'aberta' } } } },
      pagination: { pageSize: 100 },
    });
    renderizar(
      lista,
      data.length
        ? html`<div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
            ${data.map((e) => cartaoEmpresa(e, e.vagas?.length ?? 0))}
          </div>`
        : vazio('Ainda não há empresas aprovadas.', 'bi-buildings')
    );
  } catch (erro) {
    renderizar(lista, erroAoCarregar(erro instanceof ErroApi ? erro.message : 'Não foi possível carregar as empresas.'));
  }
}

aoRecarregar(lista, () => void carregar());
await carregar();
