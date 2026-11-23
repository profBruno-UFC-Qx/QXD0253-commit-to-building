# :checkered_flag: Portal de Empregos do Transporte de Cargas

Site gratuito de vagas para **motoristas de caminhão** e **operadores de máquinas pesadas** na Região Metropolitana de Fortaleza. As transportadoras publicam vagas, os candidatos montam o currículo, se candidatam e acompanham a resposta. A parceira inicial é a **Raysan Transportes**, e qualquer transportadora pode participar depois de aprovada pelo administrador.

Projeto final da disciplina QXD0253, com viés de extensão.

> A proposta aprovada está em [`PROPOSTA.md`](PROPOSTA.md) e as instruções de execução, as credenciais de teste e as demais informações de entrega estão em [`ENTREGA.md`](ENTREGA.md).

## Funcionalidades

| Papel | O que pode fazer |
|---|---|
| **Visitante** | Ver a página inicial, buscar e filtrar vagas (cidade, tipo, CNH), ver detalhes da vaga e as empresas participantes, criar conta e entrar |
| **Candidato** | Criar e editar o currículo, se candidatar às vagas, acompanhar a situação de cada candidatura e cancelar enquanto estiver enviada ou em análise |
| **Empresa** | Painel com indicadores; criar, editar, encerrar, reabrir e excluir as próprias vagas; ver os currículos dos candidatos e mudar a situação de cada candidatura; editar os dados da empresa |
| **Administrador** | Aprovar, recusar ou suspender empresas; ver e remover qualquer vaga irregular |

### Regras de negócio (validadas no backend)

1. A empresa só publica vagas depois de aprovada pelo administrador.
2. O candidato só se candidata se tiver o currículo preenchido.
3. Não é possível se candidatar duas vezes à mesma vaga.
4. A CNH do candidato precisa ser igual ou superior à exigida pela vaga (B < C < D < E).
5. Vagas encerradas (ou de empresas não aprovadas) somem da lista pública e não recebem candidaturas.
6. A empresa só vê e altera as próprias vagas e candidatos; o candidato só vê as próprias candidaturas.
7. O candidato só cancela a candidatura enquanto ela está enviada ou em análise.

## Entidades

```
Usuário ─1:1─ Empresa ─1:N─ Vaga ─1:N─ Candidatura ─N:1─ Currículo ─1:1─ Usuário
```

- **Empresa**: nome, CNPJ, cidade, telefone, descrição, logo e situação (pendente, aprovada, recusada)
- **Vaga** (depende da Empresa): título, descrição, cidade, tipo, CNH exigida, equipamento, salário e situação (aberta, encerrada)
- **Currículo**: nome, cidade, telefone, CNH, anos de experiência, equipamentos e resumo
- **Candidatura** (depende da Vaga e do Currículo): situação (enviada, em análise, aprovada, recusada)

## Tecnologias

- **Frontend:** HTML, CSS e TypeScript, sem framework de interface; Bootstrap 5 e Bootstrap Icons; Vite para compilar o TypeScript
- **Backend:** Strapi 5 (API REST, autenticação JWT) com banco SQLite
- **Testes:** Vitest (backend e frontend)

## Estrutura

```
backend/                 Strapi
  src/api/               coleções, controllers com as regras de negócio e rotas
  src/bootstrap/         papéis e permissões (criados por código) e dados de exemplo
  src/utils/             regra da CNH, validações e filtro de escopo por usuário
  tests/                 testes automatizados
  .tmp/data.db           banco SQLite com os dados de exemplo
frontend/                site (uma página HTML por tela)
  *.html                 área pública
  empresa/ candidato/ admin/   áreas restritas de cada papel
  src/lib/               cliente da API, autenticação, menu, componentes
  src/paginas/           script de cada página
  src/estilos/           CSS
  tests/                 testes automatizados
```

## Executar rapidamente

Requer Node.js 22. O passo a passo completo está no [`ENTREGA.md`](ENTREGA.md).

```bash
# terminal 1
cd backend && cp .env.example .env && npm install && npm run develop

# terminal 2
cd frontend && cp .env.example .env && npm install && npm run dev
```

Site: http://localhost:5173 · API: http://localhost:1337/api · Painel do Strapi: http://localhost:1337/admin
