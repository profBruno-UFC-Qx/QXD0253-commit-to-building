import type { Core } from '@strapi/strapi';
import { PAPEIS } from '../utils/papeis';

/**
 * Dados de exemplo para testar e corrigir o projeto.
 *
 * Só são criados quando o banco ainda não tem nenhum usuário, então nunca
 * duplicam nem sobrescrevem dados. Para desligar, use DADOS_EXEMPLO=false no .env.
 *
 * Os e-mails usam o domínio ".test", reservado para testes (não existe de
 * verdade). Os CNPJs são fictícios, mas passam na validação.
 */
export const SENHA_PADRAO = 'Senha@123';

const ADMIN_DO_PAINEL = {
  firstname: 'Admin',
  lastname: 'Portal',
  email: 'admin@portal.test',
};

const USUARIOS = {
  admin: { username: 'admin', email: 'admin@portal.test', papel: PAPEIS.ADMINISTRADOR },
  raysan: { username: 'raysan', email: 'rh@raysan.test', papel: PAPEIS.EMPRESA },
  transnordeste: { username: 'transnordeste', email: 'contato@transnordeste.test', papel: PAPEIS.EMPRESA },
  pecem: { username: 'pecemlog', email: 'contato@pecemlog.test', papel: PAPEIS.EMPRESA },
  carlos: { username: 'carlos', email: 'carlos@candidato.test', papel: PAPEIS.CANDIDATO },
  ana: { username: 'ana', email: 'ana@candidato.test', papel: PAPEIS.CANDIDATO },
  pedro: { username: 'pedro', email: 'pedro@candidato.test', papel: PAPEIS.CANDIDATO },
  lucas: { username: 'lucas', email: 'lucas@candidato.test', papel: PAPEIS.CANDIDATO }, // sem currículo
};

type ChaveUsuario = keyof typeof USUARIOS;

const EMPRESAS = [
  {
    chave: 'raysan',
    responsavel: 'raysan' as ChaveUsuario,
    nome: 'Raysan Transportes',
    cnpj: '12345678000195',
    cidade: 'Fortaleza',
    telefone: '(85) 3000-1992',
    descricao:
      'Empresa de Fortaleza que atua desde 1992 com transporte de carga a granel, locação de máquinas e operações portuárias. Frota com rodotrem, vanderleia, LS e truck, além de pá carregadeira e retroescavadeira.',
    situacao: 'aprovada' as const,
  },
  {
    chave: 'transnordeste',
    responsavel: 'transnordeste' as ChaveUsuario,
    nome: 'Transnordeste Cargas',
    cnpj: '98765432000198',
    cidade: 'Maracanaú',
    telefone: '(85) 3100-2000',
    descricao: 'Transporte rodoviário de cargas secas entre o Ceará e os estados vizinhos.',
    situacao: 'aprovada' as const,
  },
  {
    chave: 'pecem',
    responsavel: 'pecem' as ChaveUsuario,
    nome: 'Pecém Logística',
    cnpj: '45678912000155',
    cidade: 'São Gonçalo do Amarante',
    telefone: '(85) 3200-3000',
    descricao: 'Operadora logística no Complexo do Pecém. Cadastro aguardando aprovação.',
    situacao: 'pendente' as const,
  },
];

const VAGAS = [
  {
    chave: 'rodotrem',
    empresa: 'raysan',
    titulo: 'Motorista de rodotrem',
    descricao:
      'Transporte de grãos e minério a granel entre o Porto do Pecém e Maracanaú. Escala 12x36. Experiência mínima de 2 anos com combinações de veículos.',
    cidade: 'Caucaia',
    tipo: 'motorista' as const,
    cnhExigida: 'E' as const,
    equipamento: 'Rodotrem',
    salario: 4500,
  },
  {
    chave: 'vanderleia',
    empresa: 'raysan',
    titulo: 'Motorista de carreta vanderleia',
    descricao: 'Viagens regionais no Ceará com carga a granel. Conhecimento de amarração de carga é um diferencial.',
    cidade: 'Fortaleza',
    tipo: 'motorista' as const,
    cnhExigida: 'E' as const,
    equipamento: 'Vanderleia',
    salario: 4200,
  },
  {
    chave: 'ls',
    empresa: 'raysan',
    titulo: 'Motorista de carreta LS',
    descricao: 'Transporte de carga entre o porto e clientes na Região Metropolitana de Fortaleza.',
    cidade: 'São Gonçalo do Amarante',
    tipo: 'motorista' as const,
    cnhExigida: 'E' as const,
    equipamento: 'Carreta LS',
    salario: 3800,
  },
  {
    chave: 'truck',
    empresa: 'raysan',
    titulo: 'Motorista de caminhão truck',
    descricao: 'Entregas urbanas em Fortaleza. Vaga já preenchida.',
    cidade: 'Fortaleza',
    tipo: 'motorista' as const,
    cnhExigida: 'C' as const,
    equipamento: 'Truck',
    salario: 2800,
    situacao: 'encerrada' as const,
  },
  {
    chave: 'pa',
    empresa: 'raysan',
    titulo: 'Operador de pá carregadeira',
    descricao: 'Carregamento de caminhões no pátio de granéis. Necessário curso de operador de máquinas.',
    cidade: 'São Gonçalo do Amarante',
    tipo: 'operador' as const,
    cnhExigida: 'nenhuma' as const,
    equipamento: 'Pá carregadeira',
    salario: 2600,
  },
  {
    chave: 'retro',
    empresa: 'raysan',
    titulo: 'Operador de retroescavadeira',
    descricao: 'Serviços de terraplanagem em obras de clientes de locação de máquinas.',
    cidade: 'Maracanaú',
    tipo: 'operador' as const,
    cnhExigida: 'nenhuma' as const,
    equipamento: 'Retroescavadeira',
    salario: null,
  },
  {
    chave: 'bitrem',
    empresa: 'transnordeste',
    titulo: 'Motorista de bitrem',
    descricao: 'Rotas Fortaleza–Recife com carga seca. Viagens de 3 a 5 dias.',
    cidade: 'Maracanaú',
    tipo: 'motorista' as const,
    cnhExigida: 'E' as const,
    equipamento: 'Bitrem',
    salario: 4300,
  },
  {
    chave: 'toco',
    empresa: 'transnordeste',
    titulo: 'Motorista de caminhão toco',
    descricao: 'Distribuição de mercadorias na Região Metropolitana de Fortaleza.',
    cidade: 'Maracanaú',
    tipo: 'motorista' as const,
    cnhExigida: 'C' as const,
    equipamento: 'Toco',
    salario: 2500,
  },
];

const CURRICULOS = [
  {
    chave: 'carlos',
    candidato: 'carlos' as ChaveUsuario,
    nome: 'Carlos Alberto Lima',
    cidade: 'Caucaia',
    telefone: '(85) 98800-1111',
    cnh: 'E' as const,
    anosExperiencia: 12,
    equipamentos: 'Rodotrem, vanderleia, bitrem',
    resumo: 'Motorista carreteiro há 12 anos, com experiência em granel e rotas para o Nordeste.',
  },
  {
    chave: 'ana',
    candidato: 'ana' as ChaveUsuario,
    nome: 'Ana Paula Ferreira',
    cidade: 'Fortaleza',
    telefone: '(85) 98800-2222',
    cnh: 'C' as const,
    anosExperiencia: 4,
    equipamentos: 'Truck, toco',
    resumo: 'Motorista de entregas urbanas. Busca a primeira oportunidade em empresa de maior porte.',
  },
  {
    chave: 'pedro',
    candidato: 'pedro' as ChaveUsuario,
    nome: 'Pedro Henrique Sousa',
    cidade: 'São Gonçalo do Amarante',
    telefone: '(85) 98800-3333',
    cnh: 'B' as const,
    anosExperiencia: 6,
    equipamentos: 'Pá carregadeira, retroescavadeira',
    resumo: 'Operador de máquinas pesadas com curso técnico e experiência em pátio portuário.',
  },
];

const CANDIDATURAS = [
  { curriculo: 'carlos', vaga: 'rodotrem', situacao: 'em_analise' as const },
  { curriculo: 'carlos', vaga: 'vanderleia', situacao: 'enviada' as const },
  { curriculo: 'carlos', vaga: 'bitrem', situacao: 'aprovada' as const },
  { curriculo: 'ana', vaga: 'truck', situacao: 'recusada' as const },
  { curriculo: 'ana', vaga: 'toco', situacao: 'enviada' as const },
  { curriculo: 'pedro', vaga: 'pa', situacao: 'aprovada' as const },
  { curriculo: 'pedro', vaga: 'retro', situacao: 'em_analise' as const },
];

export async function criarDadosDeExemplo(strapi: Core.Strapi): Promise<void> {
  if (process.env.DADOS_EXEMPLO === 'false') return;

  const totalUsuarios = await strapi.db.query('plugin::users-permissions.user').count();
  if (totalUsuarios > 0) return;

  strapi.log.info('[dados-exemplo] Banco vazio: criando dados de exemplo...');

  await strapi.db.transaction(async () => {
    // Usuário do painel administrativo do Strapi (/admin)
    const adminService = strapi.service('admin::user');
    if (!(await adminService.exists())) {
      await adminService.createFirstAdmin({ ...ADMIN_DO_PAINEL, password: SENHA_PADRAO });
    }

    // Usuários da aplicação, cada um no seu papel
    const papeis = await strapi.db.query('plugin::users-permissions.role').findMany();
    const idDoPapel = (tipo: string) => papeis.find((p: { type: string }) => p.type === tipo)?.id;

    const usuarios = {} as Record<ChaveUsuario, { id: number }>;
    for (const [chave, u] of Object.entries(USUARIOS) as [ChaveUsuario, (typeof USUARIOS)[ChaveUsuario]][]) {
      usuarios[chave] = await strapi.plugin('users-permissions').service('user').add({
        username: u.username,
        email: u.email,
        password: SENHA_PADRAO,
        provider: 'local',
        confirmed: true,
        blocked: false,
        role: idDoPapel(u.papel),
      });
    }

    const empresas: Record<string, string> = {};
    for (const { chave, responsavel, ...dados } of EMPRESAS) {
      const empresa = await strapi.documents('api::empresa.empresa').create({
        data: { ...dados, responsavel: usuarios[responsavel].id },
      });
      empresas[chave] = empresa.documentId;
    }

    const vagas: Record<string, string> = {};
    for (const { chave, empresa, ...dados } of VAGAS) {
      const vaga = await strapi.documents('api::vaga.vaga').create({
        data: { situacao: 'aberta', ...dados, empresa: empresas[empresa] },
      });
      vagas[chave] = vaga.documentId;
    }

    const curriculos: Record<string, string> = {};
    for (const { chave, candidato, ...dados } of CURRICULOS) {
      const curriculo = await strapi.documents('api::curriculo.curriculo').create({
        data: { ...dados, candidato: usuarios[candidato].id },
      });
      curriculos[chave] = curriculo.documentId;
    }

    for (const c of CANDIDATURAS) {
      await strapi.documents('api::candidatura.candidatura').create({
        data: { situacao: c.situacao, vaga: vagas[c.vaga], curriculo: curriculos[c.curriculo] },
      });
    }
  });

  strapi.log.info(`[dados-exemplo] Pronto. Senha de todos os usuários de teste: ${SENHA_PADRAO}`);
}
