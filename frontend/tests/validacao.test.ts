import { describe, expect, it } from 'vitest';
import { cnpjValido, mascaraCnpj, mascaraTelefone, telefoneValido } from '../src/lib/validacao';

describe('CNPJ', () => {
  it('valida os dígitos verificadores (mesma regra do backend)', () => {
    expect(cnpjValido('11.222.333/0001-81')).toBe(true);
    expect(cnpjValido('11.222.333/0001-80')).toBe(false);
    expect(cnpjValido('00.000.000/0000-00')).toBe(false);
  });

  it('máscara formata enquanto digita e ignora letras', () => {
    expect(mascaraCnpj('11222')).toBe('11.222');
    expect(mascaraCnpj('112223330001')).toBe('11.222.333/0001');
    expect(mascaraCnpj('11a222333000181999')).toBe('11.222.333/0001-81');
  });
});

describe('telefone', () => {
  it('aceita fixo e celular com DDD', () => {
    expect(telefoneValido('(85) 3000-1992')).toBe(true);
    expect(telefoneValido('(85) 98888-1111')).toBe(true);
    expect(telefoneValido('98888-1111')).toBe(false);
  });

  it('máscara para fixo e celular', () => {
    expect(mascaraTelefone('8530001992')).toBe('(85) 3000-1992');
    expect(mascaraTelefone('85988881111')).toBe('(85) 98888-1111');
    expect(mascaraTelefone('85')).toBe('(85');
    expect(mascaraTelefone('')).toBe('');
  });
});
