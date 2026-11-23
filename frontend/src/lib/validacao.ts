/** Validações e máscaras usadas nos formulários (o backend valida de novo). */

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function cnpjValido(valor: string): boolean {
  const cnpj = somenteDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const digito = (base: string): number => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const resto = base.split('').reduce((soma, d, i) => soma + Number(d) * pesos[i], 0) % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = digito(cnpj.slice(0, 12));
  const d2 = digito(cnpj.slice(0, 12) + d1);
  return cnpj.endsWith(`${d1}${d2}`);
}

export function telefoneValido(valor: string): boolean {
  const digitos = somenteDigitos(valor);
  return digitos.length === 10 || digitos.length === 11;
}

/** 12345678000195 → 12.345.678/0001-95 (enquanto digita) */
export function mascaraCnpj(valor: string): string {
  return somenteDigitos(valor)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/** 85988881111 → (85) 98888-1111 (enquanto digita) */
export function mascaraTelefone(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Aplica uma máscara a um campo e um validador que usa a mensagem do HTML. */
export function configurarCampo(
  campo: HTMLInputElement,
  mascara: (valor: string) => string,
  valido: (valor: string) => boolean
): void {
  const conferir = () => campo.setCustomValidity(campo.value === '' || valido(campo.value) ? '' : 'inválido');
  campo.addEventListener('input', () => {
    campo.value = mascara(campo.value);
    conferir();
  });
  conferir();
}

/** Cidades da Região Metropolitana de Fortaleza (usadas em filtros e formulários). */
export const CIDADES_RMF = [
  'Aquiraz',
  'Cascavel',
  'Caucaia',
  'Chorozinho',
  'Eusébio',
  'Fortaleza',
  'Guaiúba',
  'Horizonte',
  'Itaitinga',
  'Maracanaú',
  'Maranguape',
  'Pacajus',
  'Pacatuba',
  'Paracuru',
  'Paraipaba',
  'Pindoretama',
  'São Gonçalo do Amarante',
  'São Luís do Curu',
  'Trairi',
];
