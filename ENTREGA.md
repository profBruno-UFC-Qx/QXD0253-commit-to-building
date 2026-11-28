# :package: Entrega Final

## :computer: Como executar o projeto

**Pré-requisitos**

- [Node.js](https://nodejs.org/) **22** (LTS) e npm 10. O Strapi 5 não roda no Node 18. Com o [nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22`.
- Git.
- Portas **1337** (backend) e **5173** (frontend) livres.

**1. Clonar o repositório**

```bash
git clone https://github.com/profBruno-UFC-Qx/QXD0253-commit-to-building.git
cd QXD0253-commit-to-building
```

**2. Backend (Strapi), no primeiro terminal**

```bash
cd backend
cp .env.example .env
npm install
npm run develop
```

Aguarde a mensagem `Strapi started successfully`. A API fica em http://localhost:1337/api e o painel do Strapi em http://localhost:1337/admin.

O banco SQLite já vem pronto em `backend/.tmp/data.db`, com usuários, empresas, vagas e candidaturas de exemplo. Os papéis e as permissões são aplicados automaticamente ao iniciar, então não é preciso configurar nada no painel.

**3. Frontend, no segundo terminal**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Acesse **http://localhost:5173**. Se o backend estiver em outro endereço, altere `VITE_API_URL` no `frontend/.env`.

**4. Testes automatizados (opcional)**

```bash
cd backend && npm test
cd frontend && npm test
```

**Voltar o banco ao estado inicial (opcional):** com o backend parado, apague `backend/.tmp/data.db` e rode `npm run develop` de novo. O banco é recriado com os dados de exemplo.

## :key: Credenciais de acesso para teste

A senha de **todos** os usuários é **`Senha@123`**. No login, pode-se usar o nome de usuário ou o e-mail.

| Papel | Usuário | E-mail | Situação nos dados de exemplo |
|---|---|---|---|
| Administrador | `admin` | admin@portal.test | Tem uma empresa pendente para aprovar |
| Empresa | `raysan` | rh@raysan.test | Raysan Transportes, aprovada, 6 vagas (1 encerrada) |
| Empresa | `transnordeste` | contato@transnordeste.test | Transnordeste Cargas, aprovada, 2 vagas |
| Empresa | `pecemlog` | contato@pecemlog.test | Pecém Logística, **pendente** (não pode publicar vagas) |
| Candidato | `carlos` | carlos@candidato.test | CNH E, 3 candidaturas |
| Candidato | `ana` | ana@candidato.test | CNH C, candidatura recusada e enviada |
| Candidato | `pedro` | pedro@candidato.test | CNH B (operador de máquinas), 2 candidaturas |
| Candidato | `lucas` | lucas@candidato.test | **Sem currículo** (não pode se candidatar) |

**Painel administrativo do Strapi** (http://localhost:1337/admin): e-mail `admin@portal.test` e senha `Senha@123`.

Os e-mails usam o domínio `.test`, reservado para testes, e os CNPJs são fictícios (mas válidos).

## :robot: Uso de ferramentas de Inteligência Artificial

Sim. Usei o **Claude Code** (Anthropic), dentro do VS Code, para me auxiliar na criação do projeto, e ao mesmo tempo fui estudando cada parte com base nos conceitos vistos na disciplina.

- **Como usei:** dividi o desenvolvimento em etapas a partir da proposta aprovada (backend, papéis e permissões, regras de negócio, área pública, áreas restritas e testes). Em cada etapa eu dizia o que precisava ser feito, a ferramenta gerava boa parte do código e explicava como ele funcionava, e eu revisava, testava no navegador e aprovava antes de cada commit.
- **Como me ajudou a aprender:** acompanhei cada etapa relacionando o código com o conteúdo da disciplina: estrutura das páginas em HTML, estilização com CSS e Bootstrap, manipulação do DOM e eventos com TypeScript, requisições HTTP com `fetch` para uma API REST, autenticação com JWT e controle de acesso por papéis no Strapi. Quando algo não ficava claro, pedia explicações detalhadas de uma etapa inteira antes de seguir para a próxima.
- **Também ajudou** a encontrar e corrigir erros (por exemplo, um formulário de cadastro que travava ao trocar de empresa para candidato) e a resolver problemas de ambiente, como a versão do Node e a conexão com o GitHub.
- **Decisões minhas:** o tema e as regras de negócio da proposta, a parceria com a Raysan Transportes e o uso da identidade visual dela, o que cada papel pode ver e fazer, e a revisão e os testes de todas as telas.

## :construction: Maiores dificuldades encontradas

A principal dificuldade foi garantir que **cada usuário só acesse os próprios dados**. No Strapi, as permissões são definidas por papel: dá para dizer que o papel "Empresa" pode editar vagas, mas não que uma empresa só pode editar **as vagas dela**. Do mesmo jeito, a empresa precisa ver o currículo de quem se candidatou às vagas dela, mas não o de outros candidatos.

Para resolver, sobrescrevi os controllers das quatro coleções. Depois de validar a consulta enviada pelo cliente, o servidor acrescenta um filtro obrigatório de "dono" (por exemplo, só vagas cuja empresa tem o usuário logado como responsável), combinado com os filtros do cliente por um `$and`. Assim, mesmo chamando a API diretamente e enviando filtros próprios, não é possível ver ou alterar dados de outro usuário. As mesmas validações também foram usadas para as regras de negócio (CNH, candidatura duplicada, cancelamento e aprovação da empresa), que ficaram no backend e não só na interface.

## :warning: Limitações conhecidas

- Não há recuperação de senha nem confirmação de e-mail, porque o projeto não usa servidor de e-mail. Pelo mesmo motivo, o candidato não recebe aviso por e-mail quando a situação da candidatura muda; ele acompanha pelo site.
- A logo da empresa só pode ser enviada pelo painel do Strapi; ainda não há upload na tela "Minha empresa".
- Ao recusar uma empresa ou uma candidatura, não é possível informar o motivo.
- As listas do painel da empresa, dos candidatos e das candidaturas mostram até 100 itens, sem paginação. A lista pública de vagas e a moderação do administrador têm paginação.
- Novos administradores só podem ser criados pelo painel do Strapi (o cadastro do site só cria empresas e candidatos).
- O login tem o limite de tentativas padrão do Strapi: depois de várias tentativas seguidas, é preciso aguardar cerca de um minuto.

<!-- kit:fim-secoes-genericas -->

## :desktop_computer: Tecnologias e bibliotecas utilizadas

**Frontend** (`frontend/`)

- HTML, CSS e **TypeScript** 5.9, sem framework de interface: uma página HTML por tela, com CSS e scripts em arquivos externos
- **Bootstrap** 5.3 e **Bootstrap Icons** 1.13
- Fonte **Josefin Sans** (pacote `@fontsource/josefin-sans`)
- **Vite** 8, usado para compilar o TypeScript e servir as páginas em desenvolvimento
- Chamadas à API com `fetch` nativo; JWT guardado no `localStorage`

**Backend** (`backend/`)

- **Strapi** 5.63 (API REST) com o plugin **Users & Permissions** (autenticação **JWT**, papéis e permissões)
- Banco **SQLite** (`backend/.tmp/data.db`)
- TypeScript nos controllers, nas rotas e nos utilitários

**Testes**

- **Vitest** 5 no backend (regra da CNH, validações e filtro de escopo) e no frontend (escape de HTML contra XSS, máscaras, validações e query da API)
