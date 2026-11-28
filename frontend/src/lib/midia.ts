import { API_URL } from './config';
import type { Midia } from './tipos';

/**
 * Endereço completo de uma imagem do Strapi. Os arquivos ficam no backend
 * (/uploads/...), então o caminho relativo recebe o endereço da API.
 * Usa um tamanho menor gerado pelo Strapi quando existir.
 */
export function urlDaMidia(midia: Midia, tamanho?: 'thumbnail' | 'small'): string {
  const url = (tamanho && midia.formats?.[tamanho]?.url) || midia.url;
  return /^https?:\/\//.test(url) ? url : `${API_URL}${url}`;
}
