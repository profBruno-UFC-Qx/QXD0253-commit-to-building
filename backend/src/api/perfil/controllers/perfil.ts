import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import { errors } from '@strapi/utils';
import { PAPEIS, papelDaRequisicao, usuarioDaRequisicao } from '../../../utils/papeis';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * GET /api/perfil
   * Devolve o usuário logado, o papel dele e, conforme o papel,
   * a empresa ou o currículo. O frontend usa isso para montar o menu.
   */
  async meu(ctx: Context) {
    const usuario = usuarioDaRequisicao(ctx);
    if (!usuario) throw new errors.UnauthorizedError('Faça login para continuar.');
    const papel = papelDaRequisicao(ctx);

    const empresa =
      papel === PAPEIS.EMPRESA
        ? await strapi.documents('api::empresa.empresa').findFirst({
            filters: { responsavel: { id: usuario.id } },
          })
        : null;

    const curriculo =
      papel === PAPEIS.CANDIDATO
        ? await strapi.documents('api::curriculo.curriculo').findFirst({
            filters: { candidato: { id: usuario.id } },
          })
        : null;

    ctx.body = {
      id: usuario.id,
      documentId: usuario.documentId,
      username: usuario.username,
      email: usuario.email,
      papel,
      empresa: empresa ?? null,
      curriculo: curriculo ?? null,
    };
  },
});
