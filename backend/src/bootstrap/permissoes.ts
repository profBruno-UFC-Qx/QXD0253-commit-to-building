import type { Core } from '@strapi/strapi';
import { PAPEIS } from '../utils/papeis';

const ROLE_UID = 'plugin::users-permissions.role';
const PERMISSAO_UID = 'plugin::users-permissions.permission';

/** Papéis criados pela aplicação (além do "public", que o Strapi já cria). */
const PAPEIS_DA_APLICACAO = [
  {
    type: PAPEIS.ADMINISTRADOR,
    name: 'Administrador',
    description: 'Aprova empresas, remove vagas irregulares e vê todos os dados.',
  },
  {
    type: PAPEIS.EMPRESA,
    name: 'Empresa',
    description: 'Publica e gerencia as próprias vagas e avalia candidaturas.',
  },
  {
    type: PAPEIS.CANDIDATO,
    name: 'Candidato',
    description: 'Mantém o currículo e se candidata às vagas.',
  },
];

const ler = (api: string) => [`api::${api}.${api}.find`, `api::${api}.${api}.findOne`];

/**
 * Matriz de permissões: quais ações da API cada papel pode chamar.
 * Ela define apenas se a rota pode ser acessada; o que cada usuário
 * enxerga dentro dela (somente os próprios dados, por exemplo) é
 * decidido nos controllers.
 */
const PERMISSOES: Record<string, string[]> = {
  [PAPEIS.PUBLICO]: [
    'plugin::users-permissions.auth.callback', // login
    // o cadastro (/api/cadastro) é público pela própria rota (auth: false)
    ...ler('vaga'),
    ...ler('empresa'),
  ],
  [PAPEIS.EMPRESA]: [
    'plugin::users-permissions.user.me',
    'api::perfil.perfil.meu',
    ...ler('vaga'),
    'api::vaga.vaga.minhas',
    'api::vaga.vaga.create',
    'api::vaga.vaga.update',
    'api::vaga.vaga.delete',
    ...ler('empresa'),
    'api::empresa.empresa.update',
    ...ler('candidatura'),
    'api::candidatura.candidatura.update',
    ...ler('curriculo'),
  ],
  [PAPEIS.CANDIDATO]: [
    'plugin::users-permissions.user.me',
    'api::perfil.perfil.meu',
    ...ler('vaga'),
    ...ler('empresa'),
    ...ler('curriculo'),
    'api::curriculo.curriculo.create',
    'api::curriculo.curriculo.update',
    ...ler('candidatura'),
    'api::candidatura.candidatura.create',
    'api::candidatura.candidatura.delete',
  ],
  [PAPEIS.ADMINISTRADOR]: [
    'plugin::users-permissions.user.me',
    'api::perfil.perfil.meu',
    ...ler('vaga'),
    'api::vaga.vaga.delete',
    ...ler('empresa'),
    'api::empresa.empresa.update',
    ...ler('curriculo'),
    ...ler('candidatura'),
  ],
  // Papel padrão do Strapi: não é usado pela aplicação, fica sem acesso.
  authenticated: [],
};

/**
 * Cria os papéis que faltam e deixa as permissões de cada papel exatamente
 * iguais à matriz acima. Roda a cada inicialização, então o banco sempre
 * reflete o código.
 */
export async function configurarPapeisEPermissoes(strapi: Core.Strapi): Promise<void> {
  for (const papel of PAPEIS_DA_APLICACAO) {
    const existe = await strapi.db.query(ROLE_UID).findOne({ where: { type: papel.type } });
    if (!existe) {
      await strapi.db.query(ROLE_UID).create({ data: papel });
      strapi.log.info(`[permissoes] Papel criado: ${papel.name}`);
    }
  }

  for (const [tipo, acoesDesejadas] of Object.entries(PERMISSOES)) {
    const papel = await strapi.db.query(ROLE_UID).findOne({ where: { type: tipo } });
    if (!papel) continue;

    const atuais: { id: number; action: string }[] = await strapi.db
      .query(PERMISSAO_UID)
      .findMany({ where: { role: papel.id } });
    const acoesAtuais = atuais.map((p) => p.action);

    const remover = atuais.filter((p) => !acoesDesejadas.includes(p.action));
    const criar = acoesDesejadas.filter((acao) => !acoesAtuais.includes(acao));

    for (const permissao of remover) {
      await strapi.db.query(PERMISSAO_UID).delete({ where: { id: permissao.id } });
    }
    for (const action of criar) {
      await strapi.db.query(PERMISSAO_UID).create({ data: { action, role: papel.id } });
    }
  }

  // O cadastro padrão do Strapi (/api/auth/local/register) fica desligado:
  // ele colocaria todos no mesmo papel. O cadastro é feito por /api/cadastro.
  const loja = strapi.store({ type: 'plugin', name: 'users-permissions' });
  const avancado = ((await loja.get({ key: 'advanced' })) ?? {}) as Record<string, unknown>;
  if (avancado.allow_register !== false) {
    await loja.set({ key: 'advanced', value: { ...avancado, allow_register: false } });
  }
}
