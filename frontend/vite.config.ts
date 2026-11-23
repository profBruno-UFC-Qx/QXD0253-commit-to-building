import { readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const raiz = fileURLToPath(new URL('.', import.meta.url));
const IGNORAR = new Set(['node_modules', 'dist', 'public', 'src']);

/** Encontra todos os .html do projeto: cada um é uma página do site. */
function paginasHtml(pasta: string): Record<string, string> {
  const paginas: Record<string, string> = {};
  for (const item of readdirSync(pasta, { withFileTypes: true })) {
    const caminho = resolve(pasta, item.name);
    if (item.isDirectory() && !IGNORAR.has(item.name)) Object.assign(paginas, paginasHtml(caminho));
    if (item.isFile() && item.name.endsWith('.html')) {
      paginas[relative(raiz, caminho).replace(/\.html$/, '')] = caminho;
    }
  }
  return paginas;
}

export default defineConfig({
  // Site com várias páginas HTML: endereço inexistente dá 404 em vez de abrir o index.
  appType: 'mpa',
  server: { port: 5173 },
  build: {
    rollupOptions: { input: paginasHtml(raiz) },
  },
});
