import type { CategoriaCnh } from './tipos';

/**
 * Mesma regra do backend (backend/src/utils/cnh.ts): uma categoria maior
 * atende às menores. Aqui serve só para avisar o usuário antes; quem decide
 * de verdade é o servidor.
 */
const ORDEM: CategoriaCnh[] = ['nenhuma', 'B', 'C', 'D', 'E'];

export function atendeCnh(doCandidato: CategoriaCnh, exigida: CategoriaCnh): boolean {
  return ORDEM.indexOf(doCandidato) >= ORDEM.indexOf(exigida);
}

/** Categorias de vaga que quem tem a CNH informada pode disputar. */
export function categoriasAtendidas(doCandidato: CategoriaCnh): CategoriaCnh[] {
  return ORDEM.slice(0, ORDEM.indexOf(doCandidato) + 1);
}
