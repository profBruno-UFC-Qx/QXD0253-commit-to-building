import { describe, expect, it } from 'vitest';
import { atendeCnh, categoriasAtendidas } from '../src/lib/cnh';

describe('CNH', () => {
  it('mesma regra do backend: categoria maior atende às menores', () => {
    expect(atendeCnh('E', 'C')).toBe(true);
    expect(atendeCnh('C', 'E')).toBe(false);
    expect(atendeCnh('nenhuma', 'nenhuma')).toBe(true);
  });

  it('filtro "Minha CNH" lista as categorias de vaga que a pessoa pode disputar', () => {
    expect(categoriasAtendidas('C')).toEqual(['nenhuma', 'B', 'C']);
    expect(categoriasAtendidas('nenhuma')).toEqual(['nenhuma']);
    expect(categoriasAtendidas('E')).toEqual(['nenhuma', 'B', 'C', 'D', 'E']);
  });
});
