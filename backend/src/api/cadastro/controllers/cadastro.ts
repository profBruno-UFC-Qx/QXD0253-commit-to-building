import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import { errors } from '@strapi/utils';
import { PAPEIS } from '../../../utils/papeis';
import * as validar from '../../../utils/validacao';

const { ValidationError } = errors;
const USUARIO_UID = 'plugin::users-permissions.user';

/** Só é possível se cadastrar como empresa ou candidato. Administrador, nunca. */
const TIPOS_PERMITIDOS = [PAPEIS.EMPRESA, PAPEIS.CANDIDATO] as const;

interface DadosEmpresa {
  nome: string;
  cnpj: string;
  cidade: string;
  telefone: string;
  descricao: string;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * POST /api/cadastro
   * Corpo: { tipo, username, email, password, empresa?: { nome, cnpj, cidade, telefone, descricao } }
   * Cria o usuário no papel escolhido e, se for empresa, já cria a Empresa como "pendente".
   * Responde com o JWT, como o login.
   */
  async registrar(ctx: Context) {
    const corpo = (ctx.request.body ?? {}) as Record<string, any>;

    const tipo = validar.umDe(corpo.tipo, TIPOS_PERMITIDOS, 'tipo');
    const username = validar.texto(corpo.username, 'nome de usuário', { min: 3, max: 50 });
    const email = validar.email(corpo.email);
    const password = validar.senha(corpo.password);

    let dadosEmpresa: DadosEmpresa | undefined;
    if (tipo === PAPEIS.EMPRESA) {
      const e = (corpo.empresa ?? {}) as Record<string, unknown>;
      dadosEmpresa = {
        nome: validar.texto(e.nome, 'nome da empresa', { min: 2, max: 120 }),
        cnpj: validar.cnpj(e.cnpj),
        cidade: validar.texto(e.cidade, 'cidade', { max: 80 }),
        telefone: validar.telefone(e.telefone),
        descricao: validar.texto(e.descricao, 'descrição', { max: 2000, obrigatorio: false }),
      };
    }

    const jaExiste = await strapi.db.query(USUARIO_UID).findOne({
      where: { $or: [{ email }, { username }] },
    });
    if (jaExiste) throw new ValidationError('Já existe uma conta com esse e-mail ou nome de usuário.');

    if (dadosEmpresa) {
      const cnpjUsado = await strapi.db.query('api::empresa.empresa').findOne({ where: { cnpj: dadosEmpresa.cnpj } });
      if (cnpjUsado) throw new ValidationError('Já existe uma empresa cadastrada com esse CNPJ.');
    }

    const papel = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: tipo } });
    if (!papel) throw new errors.ApplicationError('Papel de usuário não configurado.');

    // Transação: se a criação da empresa falhar, o usuário também não é criado.
    const usuario = await strapi.db.transaction(async () => {
      const novo = await strapi.plugin('users-permissions').service('user').add({
        username,
        email,
        password, // o Strapi criptografa a senha (bcrypt) antes de salvar
        provider: 'local',
        confirmed: true,
        blocked: false,
        role: papel.id,
      });

      if (dadosEmpresa) {
        const empresa = dadosEmpresa; // cópia local: o TS não acompanha o "if" dentro da função
        await strapi.documents('api::empresa.empresa').create({
          data: { ...empresa, situacao: 'pendente', responsavel: novo.id },
        });
      }
      return novo;
    });

    const jwt = await strapi.plugin('users-permissions').service('jwt').issue({ id: usuario.id });

    ctx.status = 201;
    ctx.body = {
      jwt,
      user: {
        id: usuario.id,
        documentId: usuario.documentId,
        username: usuario.username,
        email: usuario.email,
        papel: tipo,
      },
    };
  },
});
