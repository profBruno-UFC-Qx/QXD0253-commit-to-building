import { NOME_DO_PAPEL, sair } from './auth';
import { NOME_DO_SITE } from './config';
import { elemento } from './dom';
import { html, renderizar } from './html';
import type { Papel, Perfil } from './tipos';

interface Link {
  texto: string;
  href: string;
  icone: string;
}

const LINKS_PUBLICOS: Link[] = [
  { texto: 'Início', href: '/index.html', icone: 'bi-house' },
  { texto: 'Vagas', href: '/vagas.html', icone: 'bi-briefcase' },
  { texto: 'Empresas', href: '/empresas.html', icone: 'bi-buildings' },
];

/** Links da área restrita de cada papel. */
const LINKS_DO_PAPEL: Record<Papel, Link[]> = {
  public: [],
  empresa: [
    { texto: 'Painel', href: '/empresa/painel.html', icone: 'bi-speedometer2' },
    { texto: 'Nova vaga', href: '/empresa/vaga-form.html', icone: 'bi-plus-circle' },
    { texto: 'Minha empresa', href: '/empresa/perfil.html', icone: 'bi-building-gear' },
  ],
  candidato: [
    { texto: 'Minhas candidaturas', href: '/candidato/candidaturas.html', icone: 'bi-list-check' },
    { texto: 'Meu currículo', href: '/candidato/curriculo.html', icone: 'bi-person-vcard' },
  ],
  administrador: [
    { texto: 'Aprovar empresas', href: '/admin/empresas.html', icone: 'bi-patch-check' },
    { texto: 'Moderar vagas', href: '/admin/vagas.html', icone: 'bi-shield-check' },
  ],
};

function paginaAtual(): string {
  const caminho = window.location.pathname;
  return caminho === '/' ? '/index.html' : caminho;
}

function itemDeMenu(link: Link) {
  const ativo = paginaAtual() === link.href;
  return html`<li class="nav-item">
    <a class="nav-link${ativo ? ' active' : ''}" href="${link.href}" ${ativo ? html`aria-current="page"` : ''}>
      <i class="bi ${link.icone} me-1" aria-hidden="true"></i>${link.texto}
    </a>
  </li>`;
}

/**
 * Barra de navegação de todas as páginas. O botão "Sair" fica fora da área
 * que recolhe no celular, para estar sempre visível.
 */
export function renderizarNavbar(perfil: Perfil | null): void {
  const restritos = perfil ? LINKS_DO_PAPEL[perfil.papel] : [];

  renderizar(
    elemento('#topo'),
    html`<nav class="navbar navbar-expand-lg navbar-dark bg-marca shadow-sm" aria-label="Navegação principal">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2" href="/index.html">
          <i class="bi bi-truck-front-fill text-destaque" aria-hidden="true"></i>
          <span class="fw-bold">Cargas<span class="text-destaque">Empregos</span></span>
          <span class="visually-hidden">${NOME_DO_SITE}</span>
        </a>

        <div class="d-flex align-items-center gap-2 order-lg-last">
          ${perfil
            ? html`<span class="navbar-text small d-none d-md-inline text-white-50" title="${perfil.email}">
                  <i class="bi bi-person-circle me-1" aria-hidden="true"></i>${perfil.username}
                  <span class="badge bg-destaque text-dark ms-1">${NOME_DO_PAPEL[perfil.papel]}</span>
                </span>
                <button type="button" class="btn btn-outline-light btn-sm" id="botao-sair">
                  <i class="bi bi-box-arrow-right me-1" aria-hidden="true"></i>Sair
                </button>`
            : html`<a class="btn btn-outline-light btn-sm" href="/login.html">
                  <i class="bi bi-box-arrow-in-right me-1" aria-hidden="true"></i>Entrar
                </a>
                <a class="btn btn-destaque btn-sm d-none d-sm-inline-block" href="/cadastro.html">Cadastre-se</a>`}
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu-principal"
            aria-controls="menu-principal" aria-expanded="false" aria-label="Abrir menu">
            <span class="navbar-toggler-icon"></span>
          </button>
        </div>

        <div class="collapse navbar-collapse" id="menu-principal">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            ${LINKS_PUBLICOS.map(itemDeMenu)}
            ${restritos.length ? html`<li class="nav-item d-none d-lg-block"><span class="nav-link disabled px-1">|</span></li>` : ''}
            ${restritos.map(itemDeMenu)}
          </ul>
        </div>
      </div>
    </nav>`
  );

  document.querySelector('#botao-sair')?.addEventListener('click', sair);
}

export function renderizarRodape(): void {
  renderizar(
    elemento('#rodape'),
    html`<footer class="bg-marca text-white-50 py-4 mt-5">
      <div class="container d-flex flex-column flex-md-row justify-content-between gap-2 small">
        <span><i class="bi bi-truck me-1" aria-hidden="true"></i>${NOME_DO_SITE}</span>
        <span>Projeto de extensão · UFC Quixadá · Gratuito para candidatos e empresas</span>
      </div>
    </footer>`
  );
}
