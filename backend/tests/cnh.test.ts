import { describe, expect, it } from 'vitest';
import { atendeCnh } from '../src/utils/cnh';

describe('Regra 4: CNH do candidato x CNH exigida pela vaga', () => {
  it('aceita a mesma categoria', () => {
    expect(atendeCnh('C', 'C')).toBe(true);
  });

  it('aceita categoria superior (quem tem E pode se candidatar a vaga que pede C)', () => {
    expect(atendeCnh('E', 'C')).toBe(true);
    expect(atendeCnh('D', 'B')).toBe(true);
  });

  it('recusa categoria inferior', () => {
    expect(atendeCnh('C', 'E')).toBe(false);
    expect(atendeCnh('B', 'C')).toBe(false);
  });

  it('vaga que não exige CNH aceita qualquer candidato, inclusive sem CNH', () => {
    expect(atendeCnh('nenhuma', 'nenhuma')).toBe(true);
    expect(atendeCnh('E', 'nenhuma')).toBe(true);
  });

  it('candidato sem CNH não atende vaga que exige CNH', () => {
    expect(atendeCnh('nenhuma', 'B')).toBe(false);
  });
});
