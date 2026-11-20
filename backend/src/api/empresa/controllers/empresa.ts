import { factories } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { comEscopo } from '../../../utils/escopo';
import { PAPEIS, papelDaRequisicao, usuarioDaRequisicao } from '../../../utils/papeis';
import * as validar from '../../../utils/validacao';

const { ForbiddenError, NotFoundError } = errors;
const UID = 'api::empresa.empresa';
const SITUACOES = ['pendente', 'aprovada', 'recusada'] as const;

type DadosEmpresa = { nome: string; cidade: string; telefone: string; descricao: string };

/** Campos que a própria empresa pode editar (CNPJ e situação, não). */
function validarEdicaoDaEmpresa(dados: Record<string, unknown>) {
  return validar.campos<DadosEmpresa>(
    dados,
    {
      nome: (v) => validar.texto(v, 'nome da empresa', { min: 2, max: 120 }),
      cidade: (v) => validar.texto(v, 'cidade', { max: 80 }),
      telefone: (v) => validar.telefone(v),
      descricao: (v) => validar.texto(v, 'descrição', { max: 2000, obrigatorio: false }),
    },
    true
  );
}

export default factories.createCoreController(UID, ({ strapi }) => ({
  /** GET /api/empresas: o público vê as aprovadas; o administrador vê todas. */
  async find(ctx) {
    await this.validateQuery(ctx);
    const consulta = await this.sanitizeQuery(ctx);
    const filters =
      papelDaRequisicao(ctx) === PAPEIS.ADMINISTRADOR
        ? consulta.filters
        : comEscopo(consulta.filters, { situacao: 'aprovada' });

    const { results, pagination } = await strapi.service(UID).find({ ...consulta, filters });
    return this.transformResponse(await this.sanitizeOutput(results, ctx), { pagination });
  },

  /** GET /api/empresas/:id: a empresa também vê o próprio cadastro, mesmo pendente. */
  async findOne(ctx) {
    await this.validateQuery(ctx);
    const consulta = await this.sanitizeQuery(ctx);
    const usuario = usuarioDaRequisicao(ctx);

    let escopo: Record<string, unknown> = { situacao: 'aprovada' };
    if (papelDaRequisicao(ctx) === PAPEIS.ADMINISTRADOR) escopo = {};
    else if (papelDaRequisicao(ctx) === PAPEIS.EMPRESA && usuario) {
      escopo = { $or: [{ situacao: 'aprovada' }, { responsavel: { id: usuario.id } }] };
    }

    const empresa = await strapi.documents(UID).findFirst({
      ...consulta,
      filters: comEscopo(consulta.filters, { $and: [{ documentId: ctx.params.id }, escopo] }),
    });
    if (!empresa) throw new NotFoundError('Empresa não encontrada.');
    return this.transformResponse(await this.sanitizeOutput(empresa, ctx));
  },

  /**
   * PUT /api/empresas/:id
   * - Administrador: só muda a situação (aprovar ou recusar o cadastro).
   * - Empresa: só edita os próprios dados. Se estava recusada, volta para
   *   "pendente" para ser analisada de novo.
   */
  async update(ctx) {
    const dadosRecebidos = validar.corpoData(ctx.request.body);
    const usuario = usuarioDaRequisicao(ctx);

    if (papelDaRequisicao(ctx) === PAPEIS.ADMINISTRADOR) {
      const atual = await strapi.documents(UID).findOne({ documentId: ctx.params.id });
      if (!atual) throw new NotFoundError('Empresa não encontrada.');
      const situacao = validar.umDe(dadosRecebidos.situacao, SITUACOES, 'situação');
      const empresa = await strapi.documents(UID).update({ documentId: atual.documentId, data: { situacao } });
      return this.transformResponse(await this.sanitizeOutput(empresa, ctx));
    }

    if (!usuario) throw new ForbiddenError('Faça login para continuar.');
    const atual = await strapi.documents(UID).findFirst({
      filters: { documentId: ctx.params.id, responsavel: { id: usuario.id } },
    });
    if (!atual) throw new NotFoundError('Empresa não encontrada.');

    const dados = validarEdicaoDaEmpresa(dadosRecebidos);
    const empresa = await strapi.documents(UID).update({
      documentId: atual.documentId,
      data: { ...dados, ...(atual.situacao === 'recusada' ? { situacao: 'pendente' as const } : {}) },
    });
    return this.transformResponse(await this.sanitizeOutput(empresa, ctx));
  },
}));
