import { api, ErroApi } from '../../lib/api';
import { aoRecarregar, erroAoCarregar, paginacao } from '../../lib/componentes';
import { carregando, elemento, mostrarAlerta, vazio } from '../../lib/dom';
import { html, renderizar } from '../../lib/html';
import { confirmar } from '../../lib/modal';
import { iniciarAreaRestrita } from '../../lib/pagina';
import { formatarData, selo, SITUACAO_EMPRESA, SITUACAO_VAGA } from '../../lib/rotulos';
import type { RespostaLista, Vaga } from '../../lib/tipos';

await iniciarAreaRestrita(['administrador']);

const lista = elemento('#lista');
const mensagem = elemento('#mensagem');
const form = elemento<HTMLFormElement>('#form-filtros');
let vagas: Vaga[] = [];
let pagina = 1;

function linha(v: Vaga) {
  return html`<tr>
    <td>
      <span class="fw-semibold">${v.titulo}</span>
      <div class="small text-body-secondary">${v.cidade}</div>
    </td>
    <td>
      ${v.empresa?.nome ?? '–'}
      ${v.empresa && v.empresa.situacao !== 'aprovada' ? html`<div>${selo(SITUACAO_EMPRESA[v.empresa.situacao])}</div>` : ''}
    </td>
    <td>${selo(SITUACAO_VAGA[v.situacao])}</td>
    <td class="small text-nowrap">${formatarData(v.createdAt)}</td>
    <td class="text-end">
      <button type="button" class="btn btn-sm btn-outline-danger" data-remover="${v.documentId}" aria-label="Remover ${v.titulo}">
        <i class="bi bi-trash me-1" aria-hidden="true"></i>Remover
      </button>
    </td>
  </tr>`;
}

async function carregar(): Promise<void> {
  renderizar(lista, carregando());
  const dados = new FormData(form);
  const busca = String(dados.get('busca') ?? '').trim();
  const situacao = String(dados.get('situacao') ?? '');
  const condicoes: Record<string, unknown>[] = [];
  if (busca) condicoes.push({ $or: [{ titulo: { $containsi: busca } }, { empresa: { nome: { $containsi: busca } } }] });
  if (situacao) condicoes.push({ situacao: { $eq: situacao } });

  try {
    const resposta = await api.get<RespostaLista<Vaga>>('/vagas', {
      filters: condicoes.length ? { $and: condicoes } : undefined,
      populate: { empresa: { fields: ['nome', 'situacao'] } },
      sort: ['createdAt:desc'],
      pagination: { page: pagina, pageSize: 20 },
    });
    vagas = resposta.data;
    const total = resposta.meta.pagination.total;
    elemento('#resumo').textContent = total === 1 ? '1 vaga' : `${total} vagas (de todas as empresas e situações)`;
    renderizar(
      lista,
      vagas.length
        ? html`<div class="table-responsive"><table class="table align-middle mb-0">
              <thead><tr><th scope="col">Vaga</th><th scope="col">Empresa</th><th scope="col">Situação</th><th scope="col">Publicada</th><th scope="col" class="text-end">Ação</th></tr></thead>
              <tbody>${vagas.map(linha)}</tbody>
            </table></div>
            ${paginacao(resposta.meta.pagination)}`
        : vazio('Nenhuma vaga encontrada.', 'bi-briefcase')
    );
  } catch (erro) {
    renderizar(lista, erroAoCarregar(erro instanceof ErroApi ? erro.message : 'Não foi possível carregar as vagas.'));
  }
}

form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  pagina = 1;
  void carregar();
});
form.addEventListener('change', (evento) => {
  if ((evento.target as Element).matches('select')) form.requestSubmit();
});

lista.addEventListener('click', async (evento) => {
  const alvo = evento.target as Element;
  const botaoPagina = alvo.closest<HTMLButtonElement>('[data-pagina]');
  if (botaoPagina) {
    pagina = Number(botaoPagina.dataset.pagina);
    return void carregar();
  }
  const botao = alvo.closest<HTMLButtonElement>('[data-remover]');
  if (!botao) return;
  const vaga = vagas.find((v) => v.documentId === botao.dataset.remover);
  if (!vaga) return;
  const ok = await confirmar({
    titulo: 'Remover vaga irregular',
    mensagem: `Remover "${vaga.titulo}" de ${vaga.empresa?.nome ?? 'empresa desconhecida'}? A vaga e as candidaturas dela serão apagadas. Esta ação não pode ser desfeita.`,
    confirmar: 'Remover vaga',
    perigo: true,
  });
  if (!ok) return;
  botao.disabled = true;
  try {
    await api.excluir(`/vagas/${vaga.documentId}`);
    mostrarAlerta(mensagem, `Vaga "${vaga.titulo}" removida.`, 'success');
    await carregar();
  } catch (erro) {
    mostrarAlerta(mensagem, erro instanceof ErroApi ? erro.message : 'Não foi possível remover a vaga.');
    botao.disabled = false;
  }
});

aoRecarregar(lista, () => void carregar());
await carregar();
