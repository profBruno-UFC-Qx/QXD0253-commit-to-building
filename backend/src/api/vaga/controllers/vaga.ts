import { factories } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { CATEGORIAS_CNH, type CategoriaCnh } from '../../../utils/cnh';
import { comEscopo, empresaDoUsuario } from '../../../utils/escopo';
import { PAPEIS, papelDaRequisicao, usuarioDaRequisicao } from '../../../utils/papeis';
import * as validar from '../../../utils/validacao';

const { ForbiddenError, NotFoundError } = errors;
const UID = 'api::vaga.vaga';

/** Regra 5: o público só vê vagas abertas de empresas aprovadas. */
const VISIVEL_AO_PUBLICO = { situacao: 'aberta', empresa: { situacao: 'aprovada' } };

type DadosVaga = {
  titulo: string;
  descricao: string;
  cidade: string;
  tipo: 'motorista' | 'operador';
  cnhExigida: CategoriaCnh;
  equipamento: string;
  salario: number | null;
  situacao: 'aberta' | 'encerrada';
};

/** Campos que a empresa pode enviar. "empresa" nunca vem do cliente. */
function validarVaga(dados: Record<string, unknown>, parcial: boolean) {
  return validar.campos<DadosVaga>(
    dados,
    {
      titulo: (v) => validar.texto(v, 'título', { min: 3, max: 120 }),
      descricao: (v) => validar.texto(v, 'descrição', { min: 10, max: 4000 }),
      cidade: (v) => validar.texto(v, 'cidade', { max: 80 }),
      tipo: (v) => validar.umDe(v, ['motorista', 'operador'] as const, 'tipo'),
      cnhExigida: (v) => validar.umDe(v ?? 'nenhuma', CATEGORIAS_CNH, 'CNH exigida'),
      equipamento: (v) => validar.texto(v, 'equipamento', { max: 80, obrigatorio: false }),
      salario: (v) => validar.valorOpcional(v, 'salário'),
      situacao: (v) => validar.umDe(v ?? 'aberta', ['aberta', 'encerrada'] as const, 'situação'),
    },
    parcial
  );
}

export default factories.createCoreController(UID, ({ strapi }) => ({
  /** GET /api/vagas: lista pública (o administrador vê todas). */
  async find(ctx) {
    await this.validateQuery(ctx);
    const consulta = await this.sanitizeQuery(ctx);
    const filters =
      papelDaRequisicao(ctx) === PAPEIS.ADMINISTRADOR
        ? consulta.filters
        : comEscopo(consulta.filters, VISIVEL_AO_PUBLICO);

    const { results, pagination } = await strapi.service(UID).find({ ...consulta, filters });
    return this.transformResponse(await this.sanitizeOutput(results, ctx), { pagination });
  },

  /** GET /api/vagas/:id: a empresa também vê as próprias vagas encerradas. */
  async findOne(ctx) {
    await this.validateQuery(ctx);
    const consulta = await this.sanitizeQuery(ctx);
    const usuario = usuarioDaRequisicao(ctx);
    const papel = papelDaRequisicao(ctx);

    let escopo: Record<string, unknown> = VISIVEL_AO_PUBLICO;
    if (papel === PAPEIS.ADMINISTRADOR) escopo = {};
    if (papel === PAPEIS.EMPRESA && usuario) {
      escopo = { $or: [VISIVEL_AO_PUBLICO, { empresa: { responsavel: { id: usuario.id } } }] };
    }

    const vaga = await strapi.documents(UID).findFirst({
      ...consulta,
      filters: comEscopo(consulta.filters, { $and: [{ documentId: ctx.params.id }, escopo] }),
    });
    if (!vaga) throw new NotFoundError('Vaga não encontrada.');
    return this.transformResponse(await this.sanitizeOutput(vaga, ctx));
  },

  /** GET /api/vagas/minhas: todas as vagas da empresa logada, com o total de candidatos. */
  async minhas(ctx) {
    await this.validateQuery(ctx);
    const consulta = await this.sanitizeQuery(ctx);
    const usuario = usuarioDaRequisicao(ctx);
    const empresa = usuario && (await empresaDoUsuario(strapi, usuario.id));
    if (!empresa) throw new ForbiddenError('Apenas empresas podem acessar este painel.');

    const { results, pagination } = await strapi.service(UID).find({
      ...consulta,
      filters: comEscopo(consulta.filters, { empresa: { documentId: empresa.documentId } }),
    });

    const vagas = await this.sanitizeOutput(results, ctx);
    const comTotais = await Promise.all(
      (vagas as { documentId: string }[]).map(async (vaga) => ({
        ...vaga,
        totalCandidaturas: await strapi
          .documents('api::candidatura.candidatura')
          .count({ filters: { vaga: { documentId: vaga.documentId } } }),
      }))
    );
    return this.transformResponse(comTotais, { pagination });
  },

  /** POST /api/vagas: regra 1, só empresa aprovada publica. */
  async create(ctx) {
    const usuario = usuarioDaRequisicao(ctx);
    const empresa = usuario && (await empresaDoUsuario(strapi, usuario.id));
    if (!empresa) throw new ForbiddenError('Apenas empresas podem publicar vagas.');
    if (empresa.situacao !== 'aprovada') {
      throw new ForbiddenError('Sua empresa ainda não foi aprovada pelo administrador.');
    }

    const dados = validarVaga(validar.corpoData(ctx.request.body), false);
    const vaga = await strapi.documents(UID).create({
      data: { ...(dados as DadosVaga), situacao: 'aberta', empresa: empresa.documentId },
      populate: ['empresa'],
    });

    ctx.status = 201;
    return this.transformResponse(await this.sanitizeOutput(vaga, ctx));
  },

  /** PUT /api/vagas/:id: regra 6, a empresa só edita as próprias vagas. */
  async update(ctx) {
    const usuario = usuarioDaRequisicao(ctx);
    const empresa = usuario && (await empresaDoUsuario(strapi, usuario.id));
    if (!empresa) throw new ForbiddenError('Apenas empresas podem editar vagas.');

    const atual = await strapi.documents(UID).findFirst({
      filters: { documentId: ctx.params.id, empresa: { documentId: empresa.documentId } },
    });
    if (!atual) throw new NotFoundError('Vaga não encontrada.');

    const dados = validarVaga(validar.corpoData(ctx.request.body), true);
    if (dados.situacao === 'aberta' && empresa.situacao !== 'aprovada') {
      throw new ForbiddenError('Sua empresa precisa estar aprovada para reabrir vagas.');
    }

    const vaga = await strapi.documents(UID).update({
      documentId: atual.documentId,
      data: dados,
      populate: ['empresa'],
    });
    return this.transformResponse(await this.sanitizeOutput(vaga, ctx));
  },

  /**
   * DELETE /api/vagas/:id: a empresa remove as próprias vagas e o
   * administrador remove qualquer vaga irregular. As candidaturas da vaga
   * são apagadas junto.
   */
  async delete(ctx) {
    const usuario = usuarioDaRequisicao(ctx);
    let escopo: Record<string, unknown> | null = null;
    if (papelDaRequisicao(ctx) === PAPEIS.ADMINISTRADOR) escopo = {};
    else if (usuario) {
      const empresa = await empresaDoUsuario(strapi, usuario.id);
      if (empresa) escopo = { empresa: { documentId: empresa.documentId } };
    }
    if (!escopo) throw new ForbiddenError('Você não pode remover vagas.');

    const vaga = await strapi.documents(UID).findFirst({ filters: { documentId: ctx.params.id, ...escopo } });
    if (!vaga) throw new NotFoundError('Vaga não encontrada.');

    await strapi.db.transaction(async () => {
      const candidaturas = await strapi.documents('api::candidatura.candidatura').findMany({
        filters: { vaga: { documentId: vaga.documentId } },
        fields: ['documentId'],
      });
      for (const c of candidaturas) {
        await strapi.documents('api::candidatura.candidatura').delete({ documentId: c.documentId });
      }
      await strapi.documents(UID).delete({ documentId: vaga.documentId });
    });

    ctx.status = 204;
  },
}));
