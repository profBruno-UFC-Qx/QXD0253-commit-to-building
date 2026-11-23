import { api, ErroApi } from '../lib/api';
import { definirAviso } from '../lib/aviso';
import { atendeCnh } from '../lib/cnh';
import { erroAoCarregar } from '../lib/componentes';
import { NOME_DO_SITE } from '../lib/config';
import { carregando, definirCarregando, elemento, mostrarAlerta } from '../lib/dom';
import { html, renderizar } from '../lib/html';
import { iniciarPagina } from '../lib/pagina';
import {
  formatarCnpj,
  formatarData,
  formatarSalario,
  selo,
  SITUACAO_CANDIDATURA,
  SITUACAO_VAGA,
  textoCnh,
  TIPO_VAGA,
} from '../lib/rotulos';
import type { Candidatura, Perfil, RespostaItem, RespostaLista, Vaga } from '../lib/tipos';

const perfil = await iniciarPagina();
const detalhes = elemento('#detalhes');
const id = new URLSearchParams(window.location.search).get('id');

/** Quadro lateral com a ação de candidatura, conforme quem está vendo. */
async function quadroDeCandidatura(vaga: Vaga, usuario: Perfil | null) {
  const voltar = encodeURIComponent(`/vaga.html?id=${vaga.documentId}`);

  if (vaga.situacao !== 'aberta') {
    return html`<p class="mb-0 text-body-secondary"><i class="bi bi-lock me-1" aria-hidden="true"></i>Esta vaga está encerrada e não recebe mais candidaturas.</p>`;
  }
  if (!usuario) {
    return html`<p class="small">Para se candidatar, entre com a sua conta de candidato. É grátis.</p>
      <a class="btn btn-primary w-100 mb-2" href="/login.html?voltar=${voltar}">Entrar para se candidatar</a>
      <a class="btn btn-outline-primary w-100" href="/cadastro.html?tipo=candidato">Criar conta de candidato</a>`;
  }
  if (usuario.papel !== 'candidato') {
    return html`<p class="small mb-0 text-body-secondary"><i class="bi bi-info-circle me-1" aria-hidden="true"></i>Apenas contas de candidato podem se candidatar às vagas.</p>`;
  }
  if (!usuario.curriculo) {
    return html`<div class="alert alert-warning small mb-3">Preencha o seu currículo antes de se candidatar.</div>
      <a class="btn btn-primary w-100" href="/candidato/curriculo.html?voltar=${voltar}">Preencher currículo</a>`;
  }

  const { data: existentes } = await api.get<RespostaLista<Candidatura>>('/candidaturas', {
    filters: { vaga: { documentId: { $eq: vaga.documentId } } },
  });
  if (existentes.length) {
    return html`<p class="mb-2">Você já se candidatou a esta vaga.</p>
      <p class="mb-3">Situação: ${selo(SITUACAO_CANDIDATURA[existentes[0].situacao])}</p>
      <a class="btn btn-outline-primary w-100" href="/candidato/candidaturas.html">Ver minhas candidaturas</a>`;
  }

  if (!atendeCnh(usuario.curriculo.cnh, vaga.cnhExigida)) {
    return html`<div class="alert alert-warning small mb-0">
      Esta vaga pede <strong>${textoCnh(vaga.cnhExigida)}</strong>, e o seu currículo informa
      <strong>${textoCnh(usuario.curriculo.cnh, 'candidato')}</strong>. Se a sua CNH mudou,
      <a href="/candidato/curriculo.html">atualize o currículo</a>.
    </div>`;
  }

  return html`<p class="small">O seu currículo será enviado para <strong>${vaga.empresa?.nome ?? 'a empresa'}</strong>.</p>
    <button type="button" class="btn btn-destaque w-100" id="botao-candidatar">
      <i class="bi bi-send me-1" aria-hidden="true"></i>Candidatar-se
    </button>`;
}

async function carregar(): Promise<void> {
  if (!id) {
    renderizar(detalhes, erroAoCarregar('Vaga não informada.'));
    return;
  }
  renderizar(detalhes, carregando());

  try {
    const { data: vaga } = await api.get<RespostaItem<Vaga>>(`/vagas/${encodeURIComponent(id)}`, { populate: ['empresa'] });
    document.title = `${vaga.titulo} | ${NOME_DO_SITE}`;
    elemento('#caminho-titulo').textContent = vaga.titulo;
    const tipo = TIPO_VAGA[vaga.tipo];
    const empresa = vaga.empresa;

    renderizar(
      detalhes,
      html`<div class="row g-4">
        <div class="col-lg-8">
          <article class="card cartao">
            <div class="card-body p-4">
              <div class="d-flex flex-wrap gap-2 mb-2">
                <span class="badge text-bg-light border"><i class="bi ${tipo.icone} me-1" aria-hidden="true"></i>${tipo.texto}</span>
                ${selo(SITUACAO_VAGA[vaga.situacao])}
              </div>
              <h1 class="h3">${vaga.titulo}</h1>
              <p class="text-body-secondary">${empresa?.nome ?? ''} · publicada em ${formatarData(vaga.createdAt)}</p>

              <dl class="row small mb-4">
                <dt class="col-sm-4">Cidade</dt>
                <dd class="col-sm-8">${vaga.cidade}</dd>
                <dt class="col-sm-4">CNH</dt>
                <dd class="col-sm-8">${textoCnh(vaga.cnhExigida)}</dd>
                <dt class="col-sm-4">Equipamento</dt>
                <dd class="col-sm-8">${vaga.equipamento || 'Não informado'}</dd>
                <dt class="col-sm-4">Salário</dt>
                <dd class="col-sm-8">${formatarSalario(vaga.salario)}</dd>
              </dl>

              <h2 class="h5">Descrição</h2>
              <p class="texto-livre mb-0">${vaga.descricao}</p>
            </div>
          </article>
        </div>

        <aside class="col-lg-4 d-flex flex-column gap-4">
          <section class="card cartao" aria-labelledby="titulo-candidatura">
            <div class="card-body">
              <h2 class="h6" id="titulo-candidatura">Candidatura</h2>
              <div id="mensagem-candidatura" aria-live="polite"></div>
              <div id="quadro-candidatura">${carregando()}</div>
            </div>
          </section>

          ${empresa
            ? html`<section class="card cartao" aria-labelledby="titulo-empresa">
                <div class="card-body">
                  <h2 class="h6" id="titulo-empresa">Sobre a empresa</h2>
                  <p class="fw-semibold mb-1">${empresa.nome}</p>
                  <p class="small text-body-secondary mb-2">CNPJ ${formatarCnpj(empresa.cnpj)} · ${empresa.cidade}</p>
                  ${empresa.descricao ? html`<p class="small texto-livre">${empresa.descricao}</p>` : ''}
                  <a class="small" href="/vagas.html?empresa=${empresa.documentId}">Ver todas as vagas da empresa</a>
                </div>
              </section>`
            : ''}
        </aside>
      </div>`
    );

    const quadro = elemento('#quadro-candidatura');
    try {
      renderizar(quadro, await quadroDeCandidatura(vaga, perfil));
    } catch (erro) {
      renderizar(quadro, html`<p class="text-danger small mb-0">${erro instanceof ErroApi ? erro.message : 'Erro ao verificar candidatura.'}</p>`);
    }
  } catch (erro) {
    const mensagem =
      erro instanceof ErroApi && erro.status === 404
        ? 'Vaga não encontrada. Ela pode ter sido encerrada ou removida.'
        : erro instanceof ErroApi
          ? erro.message
          : 'Não foi possível carregar a vaga.';
    renderizar(detalhes, html`${erroAoCarregar(mensagem)}<a href="/vagas.html">Voltar para as vagas</a>`);
  }
}

detalhes.addEventListener('click', async (evento) => {
  const alvo = evento.target as Element;
  if (alvo.closest('[data-acao="recarregar"]')) return void carregar();

  const botao = alvo.closest<HTMLButtonElement>('#botao-candidatar');
  if (!botao || !id) return;
  definirCarregando(botao, true);
  try {
    await api.post('/candidaturas', { data: { vaga: id } });
    definirAviso('Candidatura enviada! Acompanhe a situação por aqui.');
    window.location.href = '/candidato/candidaturas.html';
  } catch (erro) {
    mostrarAlerta(elemento('#mensagem-candidatura'), erro instanceof ErroApi ? erro.message : 'Não foi possível enviar.');
    definirCarregando(botao, false);
  }
});

await carregar();
