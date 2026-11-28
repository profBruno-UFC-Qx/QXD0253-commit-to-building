import { describe, expect, it } from 'vitest';
import { escapar, html } from '../src/lib/html';

describe('html``: escape automático (proteção contra XSS)', () => {
  it('escapa os caracteres especiais de HTML', () => {
    expect(escapar(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });

  it('texto vindo do usuário vira texto, nunca código', () => {
    const titulo = '<script>alert(1)</script>';
    expect(html`<h1>${titulo}</h1>`.conteudo).toBe('<h1>&lt;script&gt;alert(1)&lt;/script&gt;</h1>');
  });

  it('trechos que já são html`` não são escapados de novo', () => {
    const item = html`<li>${'a & b'}</li>`;
    expect(html`<ul>${item}</ul>`.conteudo).toBe('<ul><li>a &amp; b</li></ul>');
  });

  it('listas são concatenadas, e null, undefined e false viram vazio', () => {
    expect(html`${['<b>', 'c']}`.conteudo).toBe('&lt;b&gt;c');
    expect(html`[${null}${undefined}${false}]`.conteudo).toBe('[]');
    expect(html`${0}`.conteudo).toBe('0');
  });
});
