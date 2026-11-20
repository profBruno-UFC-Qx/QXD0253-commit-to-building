import type { Core } from '@strapi/strapi';
import { configurarPapeisEPermissoes } from './bootstrap/permissoes';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * Roda antes de o servidor começar a responder: garante que os papéis
   * e as permissões no banco estejam de acordo com o código.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await configurarPapeisEPermissoes(strapi);
  },
};
