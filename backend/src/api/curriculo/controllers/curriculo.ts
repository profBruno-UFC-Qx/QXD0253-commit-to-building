import { factories } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { CATEGORIAS_CNH, type CategoriaCnh } from '../../../utils/cnh';
import { comEscopo, curriculoDoUsuario, empresaDoUsuario, NENHUM } from '../../../utils/escopo';
import { PAPEIS, papelDaRequisicao, usuarioDaRequisicao } from '../../../utils/papeis';
import * as validar from '../../../utils/validacao';
import type { Context } from 'koa';
import type { Core } from '@strapi/strapi';

const { ApplicationError, ForbiddenError, NotFoundError } = errors;
const UID = 'api::curriculo.curriculo';

type DadosCurriculo = {
  nome: string;
  cidade: string;
  telefone: string;
  cnh: CategoriaCnh;
  anosExperiencia: number;
  equipamentos: string;
  resumo: string;
};

function validarCurriculo(dados: Record<string, unknown>, parcial: boolean) {
  return validar.campos<DadosCurriculo>(
    dados,
    {
      nome: (v) => validar.texto(v, 'nome', { min: 2, max: 120 }),
      cidade: (v) => validar.texto(v, 'cidade', { max: 80 }),
      telefone: (v) => validar.telefone(v),
      cnh: (v) => validar.umDe(v ?? 'nenhuma', CATEGORIAS_CNH, 'CNH'),
      anosExperiencia: (v) => validar.inteiro(v ?? 0, 'anos de experiência', 0, 60),
      equipamentos: (v) => validar.texto(v, 'equipamentos', { max: 300, obrigatorio: false }),
      resumo: (v) => validar.texto(v, 'resumo', { max: 2000, obrigatorio: false }),
    },
    parcial
  );
}

/**
 * Quais currículos o usuário pode ver:
 * - administrador: todos;
 * - candidato: só o próprio;
 * - empresa: só de quem se candidatou às vagas dela.
 */
async function escopoDeLeitura(strapi: Core.Strapi, ctx: Context): Promise<Record<string, unknown>> {
  const usuario = usuarioDaRequisicao(ctx);
  const papel = papelDaRequisicao(ctx);
  if (papel === PAPEIS.ADMINISTRADOR) return {};
  if (!usuario) return NENHUM;
  if (papel === PAPEIS.CANDIDATO) return { candidato: { id: usuario.id } };
  if (papel === PAPEIS.EMPRESA) {
    const empresa = await empresaDoUsuario(strapi, usuario.id);
    return empresa ? { candidaturas: { vaga: { empresa: { documentId: empresa.documentId } } } } : NENHUM;
  }
  return NENHUM;
}

export default factories.createCoreController(UID, ({ strapi }) => ({
  async find(ctx) {
    await this.validateQuery(ctx);
    const consulta = await this.sanitizeQuery(ctx);
    const filters = comEscopo(consulta.filters, await escopoDeLeitura(strapi, ctx));
    const { results, pagination } = await strapi.service(UID).find({ ...consulta, filters });
    return this.transformResponse(await this.sanitizeOutput(results, ctx), { pagination });
  },

  async findOne(ctx) {
    await this.validateQuery(ctx);
    const consulta = await this.sanitizeQuery(ctx);
    const curriculo = await strapi.documents(UID).findFirst({
      ...consulta,
      filters: comEscopo(consulta.filters, {
        $and: [{ documentId: ctx.params.id }, await escopoDeLeitura(strapi, ctx)],
      }),
    });
    if (!curriculo) throw new NotFoundError('Currículo não encontrado.');
    return this.transformResponse(await this.sanitizeOutput(curriculo, ctx));
  },

  /** POST /api/curriculos: cada candidato tem no máximo um currículo. */
  async create(ctx) {
    const usuario = usuarioDaRequisicao(ctx);
    if (!usuario || papelDaRequisicao(ctx) !== PAPEIS.CANDIDATO) {
      throw new ForbiddenError('Apenas candidatos têm currículo.');
    }
    if (await curriculoDoUsuario(strapi, usuario.id)) {
      throw new ApplicationError('Você já tem um currículo. Edite o existente.');
    }

    const dados = validarCurriculo(validar.corpoData(ctx.request.body), false);
    const curriculo = await strapi.documents(UID).create({
      data: { ...(dados as DadosCurriculo), candidato: usuario.id },
    });
    ctx.status = 201;
    return this.transformResponse(await this.sanitizeOutput(curriculo, ctx));
  },

  /** PUT /api/curriculos/:id: o candidato só edita o próprio currículo. */
  async update(ctx) {
    const usuario = usuarioDaRequisicao(ctx);
    if (!usuario) throw new ForbiddenError('Faça login para continuar.');
    const atual = await strapi.documents(UID).findFirst({
      filters: { documentId: ctx.params.id, candidato: { id: usuario.id } },
    });
    if (!atual) throw new NotFoundError('Currículo não encontrado.');

    const dados = validarCurriculo(validar.corpoData(ctx.request.body), true);
    const curriculo = await strapi.documents(UID).update({ documentId: atual.documentId, data: dados });
    return this.transformResponse(await this.sanitizeOutput(curriculo, ctx));
  },
}));
