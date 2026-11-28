import { factories } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import type { Context } from 'koa';
import type { Core } from '@strapi/strapi';
import { atendeCnh, type CategoriaCnh } from '../../../utils/cnh';
import { comEscopo, curriculoDoUsuario, empresaDoUsuario, NENHUM } from '../../../utils/escopo';
import { PAPEIS, papelDaRequisicao, usuarioDaRequisicao } from '../../../utils/papeis';
import * as validar from '../../../utils/validacao';

const { ApplicationError, ForbiddenError, NotFoundError } = errors;
const UID = 'api::candidatura.candidatura';

/** Situações que a empresa pode definir ao avaliar uma candidatura. */
const SITUACOES_DA_EMPRESA = ['em_analise', 'aprovada', 'recusada'] as const;
/** Regra 7: o candidato só cancela enquanto a candidatura estiver nestas situações. */
const SITUACOES_CANCELAVEIS = ['enviada', 'em_analise'];

const NOMES_CNH: Record<CategoriaCnh, string> = { nenhuma: 'sem CNH', B: 'B', C: 'C', D: 'D', E: 'E' };

/**
 * Regra 6, quais candidaturas o usuário pode ver:
 * - administrador: todas;
 * - candidato: só as próprias;
 * - empresa: só as das próprias vagas.
 */
async function escopoDeLeitura(strapi: Core.Strapi, ctx: Context): Promise<Record<string, unknown>> {
  const usuario = usuarioDaRequisicao(ctx);
  const papel = papelDaRequisicao(ctx);
  if (papel === PAPEIS.ADMINISTRADOR) return {};
  if (!usuario) return NENHUM;
  if (papel === PAPEIS.CANDIDATO) return { curriculo: { candidato: { id: usuario.id } } };
  if (papel === PAPEIS.EMPRESA) {
    const empresa = await empresaDoUsuario(strapi, usuario.id);
    return empresa ? { vaga: { empresa: { documentId: empresa.documentId } } } : NENHUM;
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
    const candidatura = await strapi.documents(UID).findFirst({
      ...consulta,
      filters: comEscopo(consulta.filters, {
        $and: [{ documentId: ctx.params.id }, await escopoDeLeitura(strapi, ctx)],
      }),
    });
    if (!candidatura) throw new NotFoundError('Candidatura não encontrada.');
    return this.transformResponse(await this.sanitizeOutput(candidatura, ctx));
  },

  /**
   * POST /api/candidaturas  { data: { vaga: "<documentId da vaga>" } }
   * Aplica as regras 2, 3, 4 e 5. O currículo e a situação são definidos
   * pelo servidor, nunca pelo cliente.
   */
  async create(ctx) {
    const usuario = usuarioDaRequisicao(ctx);
    if (!usuario || papelDaRequisicao(ctx) !== PAPEIS.CANDIDATO) {
      throw new ForbiddenError('Apenas candidatos podem se candidatar.');
    }

    const { vaga: vagaId } = validar.corpoData(ctx.request.body);
    if (typeof vagaId !== 'string' || !vagaId) throw new errors.ValidationError('Informe a vaga.');

    // Regra 2
    const curriculo = await curriculoDoUsuario(strapi, usuario.id);
    if (!curriculo) throw new ApplicationError('Preencha o seu currículo antes de se candidatar.');

    // Regra 5
    const vaga = await strapi.documents('api::vaga.vaga').findOne({ documentId: vagaId, populate: ['empresa'] });
    if (!vaga || vaga.empresa?.situacao !== 'aprovada') throw new NotFoundError('Vaga não encontrada.');
    if (vaga.situacao !== 'aberta') throw new ApplicationError('Esta vaga está encerrada.');

    // Regra 3
    const jaCandidatou = await strapi.documents(UID).count({
      filters: { vaga: { documentId: vaga.documentId }, curriculo: { documentId: curriculo.documentId } },
    });
    if (jaCandidatou > 0) throw new ApplicationError('Você já se candidatou a esta vaga.');

    // Regra 4
    const exigida = vaga.cnhExigida as CategoriaCnh;
    const doCandidato = curriculo.cnh as CategoriaCnh;
    if (!atendeCnh(doCandidato, exigida)) {
      throw new ApplicationError(
        `Esta vaga exige CNH categoria ${NOMES_CNH[exigida]} ou superior. A sua é: ${NOMES_CNH[doCandidato]}.`
      );
    }

    const candidatura = await strapi.documents(UID).create({
      data: { situacao: 'enviada', vaga: vaga.documentId, curriculo: curriculo.documentId },
      populate: ['vaga'],
    });
    ctx.status = 201;
    return this.transformResponse(await this.sanitizeOutput(candidatura, ctx));
  },

  /** PUT /api/candidaturas/:id: a empresa muda só a situação, e só nas próprias vagas. */
  async update(ctx) {
    const usuario = usuarioDaRequisicao(ctx);
    const empresa = usuario && (await empresaDoUsuario(strapi, usuario.id));
    if (!empresa) throw new ForbiddenError('Apenas empresas avaliam candidaturas.');

    const atual = await strapi.documents(UID).findFirst({
      filters: { documentId: ctx.params.id, vaga: { empresa: { documentId: empresa.documentId } } },
    });
    if (!atual) throw new NotFoundError('Candidatura não encontrada.');

    const situacao = validar.umDe(validar.corpoData(ctx.request.body).situacao, SITUACOES_DA_EMPRESA, 'situação');
    const candidatura = await strapi.documents(UID).update({ documentId: atual.documentId, data: { situacao } });
    return this.transformResponse(await this.sanitizeOutput(candidatura, ctx));
  },

  /** DELETE /api/candidaturas/:id: o candidato cancela a própria candidatura (regra 7). */
  async delete(ctx) {
    const usuario = usuarioDaRequisicao(ctx);
    if (!usuario) throw new ForbiddenError('Faça login para continuar.');
    const atual = await strapi.documents(UID).findFirst({
      filters: { documentId: ctx.params.id, curriculo: { candidato: { id: usuario.id } } },
    });
    if (!atual) throw new NotFoundError('Candidatura não encontrada.');
    if (!SITUACOES_CANCELAVEIS.includes(atual.situacao ?? '')) {
      throw new ApplicationError('Só é possível cancelar candidaturas enviadas ou em análise.');
    }

    await strapi.documents(UID).delete({ documentId: atual.documentId });
    ctx.status = 204;
  },
}));
