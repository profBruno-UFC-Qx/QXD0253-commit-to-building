import { describe, expect, it } from 'vitest';
import { montarQuery } from '../src/lib/api';
import { destinoSeguro, paginaInicialDoPapel } from '../src/lib/auth';

describe('montarQuery: parâmetros no formato do Strapi', () => {
  it('converte objetos e listas aninhados', () => {
    const query = montarQuery({
      filters: { cidade: { $eq: 'Maracanaú' } },
      populate: ['empresa'],
      pagination: { page: 2 },
    });
    expect(decodeURIComponent(query)).toBe('?filters[cidade][$eq]=Maracanaú&populate[0]=empresa&pagination[page]=2');
  });

  it('ignora valores vazios', () => {
    expect(montarQuery({ filters: undefined, busca: '', sort: null })).toBe('');
  });
});

describe('destinoSeguro: retorno depois do login', () => {
  it('aceita caminhos do próprio site', () => {
    expect(destinoSeguro('/vaga.html?id=abc')).toBe('/vaga.html?id=abc');
  });

  it('recusa endereços de outros sites (open redirect)', () => {
    expect(destinoSeguro('https://site-malicioso.com')).toBeNull();
    expect(destinoSeguro('//site-malicioso.com')).toBeNull();
    expect(destinoSeguro('/\\site-malicioso.com')).toBeNull();
    expect(destinoSeguro(null)).toBeNull();
  });
});

describe('paginaInicialDoPapel', () => {
  it('leva cada papel para a sua área', () => {
    expect(paginaInicialDoPapel('empresa')).toBe('/empresa/painel.html');
    expect(paginaInicialDoPapel('candidato')).toBe('/candidato/candidaturas.html');
    expect(paginaInicialDoPapel('administrador')).toBe('/admin/empresas.html');
    expect(paginaInicialDoPapel('public')).toBe('/index.html');
  });
});
