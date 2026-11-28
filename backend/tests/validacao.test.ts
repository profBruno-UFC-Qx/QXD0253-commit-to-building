import { describe, expect, it } from 'vitest';
import * as validar from '../src/utils/validacao';

describe('validação de CNPJ', () => {
  it('aceita CNPJ com dígitos verificadores corretos', () => {
    expect(validar.cnpjValido('11222333000181')).toBe(true);
    expect(validar.cnpjValido('12345678000195')).toBe(true);
  });

  it('recusa dígitos verificadores errados, tamanho errado e números repetidos', () => {
    expect(validar.cnpjValido('11222333000180')).toBe(false);
    expect(validar.cnpjValido('1122233300018')).toBe(false);
    expect(validar.cnpjValido('11111111111111')).toBe(false);
  });

  it('cnpj() aceita o número com pontuação e devolve só os dígitos', () => {
    expect(validar.cnpj('11.222.333/0001-81')).toBe('11222333000181');
  });

  it('cnpj() lança erro de validação para CNPJ inválido', () => {
    expect(() => validar.cnpj('11.111.111/1111-11')).toThrow('CNPJ inválido.');
  });
});

describe('validação de textos e outros campos', () => {
  it('remove espaços nas pontas', () => {
    expect(validar.texto('  Fortaleza  ', 'cidade')).toBe('Fortaleza');
  });

  it('exige campo obrigatório e respeita tamanho mínimo e máximo', () => {
    expect(() => validar.texto('', 'cidade')).toThrow('obrigatório');
    expect(() => validar.texto('   ', 'cidade')).toThrow('obrigatório');
    expect(() => validar.texto('ab', 'título', { min: 3 })).toThrow('pelo menos 3');
    expect(() => validar.texto('x'.repeat(11), 'título', { max: 10 })).toThrow('no máximo 10');
  });

  it('campo opcional vazio vira texto vazio', () => {
    expect(validar.texto(undefined, 'descrição', { obrigatorio: false })).toBe('');
  });

  it('e-mail é normalizado para minúsculas e validado', () => {
    expect(validar.email('Joao@Teste.COM')).toBe('joao@teste.com');
    expect(() => validar.email('joao@')).toThrow('e-mail válido');
  });

  it('senha precisa de pelo menos 8 caracteres', () => {
    expect(() => validar.senha('1234567')).toThrow('8 caracteres');
    expect(validar.senha('12345678')).toBe('12345678');
  });

  it('telefone precisa ter DDD (10 ou 11 dígitos)', () => {
    expect(validar.telefone('(85) 98888-1111')).toBe('(85) 98888-1111');
    expect(() => validar.telefone('98888-1111')).toThrow('DDD');
  });

  it('umDe só aceita valores da lista', () => {
    expect(validar.umDe('motorista', ['motorista', 'operador'] as const, 'tipo')).toBe('motorista');
    expect(() => validar.umDe('administrador', ['empresa', 'candidato'] as const, 'tipo')).toThrow('deve ser um destes');
  });

  it('valorOpcional aceita vírgula, arredonda centavos e transforma vazio em null', () => {
    expect(validar.valorOpcional('3100,505', 'salário')).toBe(3100.51);
    expect(validar.valorOpcional('', 'salário')).toBeNull();
    expect(() => validar.valorOpcional(-1, 'salário')).toThrow('maior ou igual a zero');
  });

  it('campos() em modo parcial valida só o que foi enviado', () => {
    const resultado = validar.campos<{ nome: string; cidade: string }>(
      { nome: ' Raysan ' },
      { nome: (v) => validar.texto(v, 'nome'), cidade: (v) => validar.texto(v, 'cidade') },
      true
    );
    expect(resultado).toEqual({ nome: 'Raysan' });
  });

  it('corpoData exige o formato { data: { ... } }', () => {
    expect(validar.corpoData({ data: { a: 1 } })).toEqual({ a: 1 });
    expect(() => validar.corpoData({ a: 1 })).toThrow('{ "data"');
  });
});
