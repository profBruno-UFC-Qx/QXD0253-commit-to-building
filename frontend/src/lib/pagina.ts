import 'bootstrap/js/dist/collapse';
import { carregarPerfil, paginaInicialDoPapel } from './auth';
import { NOME_DO_SITE } from './config';
import { elemento } from './dom';
import { html, renderizar } from './html';
import { renderizarNavbar, renderizarRodape } from './navbar';
import type { Papel, Perfil } from './tipos';

interface OpcoesDaPagina {
  /** Papéis que podem ver a página. Sem isso, a página é pública. */
  papeis?: Papel[];
}

/**
 * Prepara qualquer página: carrega o perfil, monta o menu e o rodapé e,
 * se a página for restrita, confere se o usuário pode acessá-la.
 *
 * Retorna o perfil (ou null para visitante). Em página restrita, só retorna
 * se o acesso for permitido; senão redireciona ou mostra "acesso negado".
 */
export async function iniciarPagina(opcoes: OpcoesDaPagina = {}): Promise<Perfil | null> {
  let perfil: Perfil | null = null;
  try {
    perfil = await carregarPerfil();
  } catch {
    perfil = null; // backend fora do ar: a página mostra o erro ao carregar os dados
  }
  renderizarNavbar(perfil);
  renderizarRodape();

  if (!opcoes.papeis) return perfil;

  if (!perfil) {
    const voltar = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/login.html?voltar=${voltar}`);
    return new Promise(() => {}); // a página não continua enquanto redireciona
  }

  if (!opcoes.papeis.includes(perfil.papel)) {
    renderizar(
      elemento('#conteudo'),
      html`<div class="container py-5 text-center">
        <i class="bi bi-shield-lock display-4 text-body-secondary" aria-hidden="true"></i>
        <h1 class="h3 mt-3">Acesso negado</h1>
        <p class="text-body-secondary">Esta página não está disponível para o seu tipo de conta.</p>
        <a class="btn btn-primary" href="${paginaInicialDoPapel(perfil.papel)}">Ir para a minha área</a>
      </div>`
    );
    document.title = `Acesso negado | ${NOME_DO_SITE}`;
    return new Promise(() => {});
  }

  return perfil;
}

/**
 * Versão para páginas restritas: só continua se o usuário tiver um dos
 * papéis, então o perfil nunca é null.
 */
export async function iniciarAreaRestrita(papeis: Papel[]): Promise<Perfil> {
  return (await iniciarPagina({ papeis })) as Perfil;
}
