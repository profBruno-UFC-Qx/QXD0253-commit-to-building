import { errors } from '@strapi/utils';

const { ValidationError } = errors;

interface OpcoesTexto {
  min?: number;
  max?: number;
  obrigatorio?: boolean;
}

/**
 * Valida um campo de texto e devolve o valor sem espaços nas pontas.
 * Lança ValidationError (HTTP 400) com uma mensagem em português.
 */
export function texto(valor: unknown, campo: string, opcoes: OpcoesTexto = {}): string {
  const { min = 0, max = 255, obrigatorio = true } = opcoes;
  if (valor === undefined || valor === null || valor === '') {
    if (obrigatorio) throw new ValidationError(`O campo "${campo}" é obrigatório.`);
    return '';
  }
  if (typeof valor !== 'string') throw new ValidationError(`O campo "${campo}" deve ser um texto.`);
  const limpo = valor.trim();
  if (obrigatorio && limpo.length === 0) throw new ValidationError(`O campo "${campo}" é obrigatório.`);
  if (limpo.length < min) throw new ValidationError(`O campo "${campo}" deve ter pelo menos ${min} caracteres.`);
  if (limpo.length > max) throw new ValidationError(`O campo "${campo}" deve ter no máximo ${max} caracteres.`);
  return limpo;
}

export function email(valor: unknown): string {
  const limpo = texto(valor, 'e-mail', { max: 120 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo)) throw new ValidationError('Informe um e-mail válido.');
  return limpo;
}

export function senha(valor: unknown): string {
  if (typeof valor !== 'string' || valor.length < 8) {
    throw new ValidationError('A senha deve ter pelo menos 8 caracteres.');
  }
  if (valor.length > 72) throw new ValidationError('A senha deve ter no máximo 72 caracteres.');
  return valor;
}

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/** Confere os dois dígitos verificadores de um CNPJ (14 dígitos). */
export function cnpjValido(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const digito = (base: string): number => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base.split('').reduce((total, d, i) => total + Number(d) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = digito(cnpj.slice(0, 12));
  const d2 = digito(cnpj.slice(0, 12) + d1);
  return cnpj.endsWith(`${d1}${d2}`);
}

export function cnpj(valor: unknown): string {
  const digitos = somenteDigitos(texto(valor, 'CNPJ', { max: 20 }));
  if (!cnpjValido(digitos)) throw new ValidationError('CNPJ inválido.');
  return digitos;
}

export function telefone(valor: unknown): string {
  const limpo = texto(valor, 'telefone', { max: 20 });
  const digitos = somenteDigitos(limpo);
  if (digitos.length < 10 || digitos.length > 11) {
    throw new ValidationError('Informe o telefone com DDD (10 ou 11 dígitos).');
  }
  return limpo;
}

/** Garante que o valor é um dos permitidos (para campos de lista fixa). */
export function umDe<T extends string>(valor: unknown, permitidos: readonly T[], campo: string): T {
  if (typeof valor !== 'string' || !permitidos.includes(valor as T)) {
    throw new ValidationError(`O campo "${campo}" deve ser um destes: ${permitidos.join(', ')}.`);
  }
  return valor as T;
}

export function inteiro(valor: unknown, campo: string, min: number, max: number): number {
  const numero = typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : valor;
  if (typeof numero !== 'number' || !Number.isInteger(numero) || numero < min || numero > max) {
    throw new ValidationError(`O campo "${campo}" deve ser um número inteiro entre ${min} e ${max}.`);
  }
  return numero;
}

/** Número opcional (vazio vira null), maior ou igual a zero. */
export function valorOpcional(valor: unknown, campo: string): number | null {
  if (valor === undefined || valor === null || valor === '') return null;
  const numero = typeof valor === 'string' ? Number(valor.replace(',', '.')) : valor;
  if (typeof numero !== 'number' || !Number.isFinite(numero) || numero < 0) {
    throw new ValidationError(`O campo "${campo}" deve ser um valor maior ou igual a zero.`);
  }
  return Math.round(numero * 100) / 100;
}

/**
 * Valida só os campos presentes em "dados" (útil para edição parcial).
 * Cada validador recebe o valor bruto e devolve o valor limpo.
 */
export function campos<T extends Record<string, unknown>>(
  dados: Record<string, unknown>,
  validadores: { [K in keyof T]: (valor: unknown) => T[K] },
  parcial: boolean
): Partial<T> {
  const resultado: Partial<T> = {};
  for (const chave of Object.keys(validadores) as (keyof T)[]) {
    if (parcial && !(chave in dados)) continue;
    resultado[chave] = validadores[chave](dados[chave as string]);
  }
  return resultado;
}

/** Lê o objeto "data" do corpo da requisição, no formato padrão do Strapi. */
export function corpoData(body: unknown): Record<string, unknown> {
  const data = (body as { data?: unknown } | undefined)?.data;
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new ValidationError('Envie os dados no formato { "data": { ... } }.');
  }
  return data as Record<string, unknown>;
}
