import { describe, expect, it } from 'vitest';
import { comEscopo } from '../src/utils/escopo';

describe('comEscopo: filtro obrigatório do servidor', () => {
  const minhas = { empresa: { documentId: 'abc' } };

  it('sem filtros do cliente, usa só o filtro do servidor', () => {
    expect(comEscopo(undefined, minhas)).toEqual(minhas);
    expect(comEscopo({}, minhas)).toEqual(minhas);
  });

  it('junta os filtros do cliente com o do servidor em um $and', () => {
    const doCliente = { cidade: { $eq: 'Fortaleza' } };
    expect(comEscopo(doCliente, minhas)).toEqual({ $and: [doCliente, minhas] });
  });

  it('um $or enviado pelo cliente não consegue escapar do filtro do servidor', () => {
    const tentativa = { $or: [{ id: { $gt: 0 } }] };
    const resultado = comEscopo(tentativa, minhas) as { $and: unknown[] };
    expect(resultado.$and).toContainEqual(minhas);
  });
});
