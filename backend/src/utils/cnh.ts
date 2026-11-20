/**
 * Categorias da CNH em ordem crescente. Para este sistema, uma categoria
 * maior habilita tudo o que as menores habilitam (ex.: quem tem E pode se
 * candidatar a uma vaga que pede C).
 */
export const CATEGORIAS_CNH = ['nenhuma', 'B', 'C', 'D', 'E'] as const;

export type CategoriaCnh = (typeof CATEGORIAS_CNH)[number];

/** Regra 4: a CNH do candidato atende à exigida pela vaga? */
export function atendeCnh(doCandidato: CategoriaCnh, exigida: CategoriaCnh): boolean {
  return CATEGORIAS_CNH.indexOf(doCandidato) >= CATEGORIAS_CNH.indexOf(exigida);
}
