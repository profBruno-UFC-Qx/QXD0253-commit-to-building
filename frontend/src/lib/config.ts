/** Endereço do backend Strapi. Pode ser trocado no arquivo .env (VITE_API_URL). */
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:1337').replace(/\/+$/, '');

export const NOME_DO_SITE = 'Portal de Empregos do Transporte de Cargas';
