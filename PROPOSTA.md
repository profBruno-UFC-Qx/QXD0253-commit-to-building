# :checkered_flag: Vagas no Transporte

Site gratuito de vagas de emprego para motoristas de caminhão e operadores de máquinas pesadas na Região Metropolitana de Fortaleza. Transportadoras publicam vagas e candidatos montam o currículo e se candidatam. A parceira inicial do projeto é a Raysan Transportes.

## :technologist: Membros da equipe

| Matrícula | Nome | Curso |
|---|---|---|
| _preencher_ | Raíssa Ívyna Moreira de Oliveira | Engenharia de Computação |

## :bulb: Objetivo Geral

Juntar num lugar só as vagas de motorista de caminhão e de operador de máquinas da Região Metropolitana de Fortaleza, para que quem procura trabalho nessa área encontre as oportunidades e se candidate, e para que as transportadoras encontrem esses profissionais com mais facilidade.

O site começa com as vagas da Raysan Transportes, empresa de Fortaleza que atua desde 1992 com transporte de carga a granel, locação de máquinas e operações portuárias, e que usa caminhões rodotrem, vanderleia, LS e truck, além de pá carregadeira e retroescavadeira. Depois, outras transportadoras da região podem se cadastrar.

## :eyes: Público-Alvo

**Principal:** pessoas desempregadas ou em trabalho informal na Região Metropolitana de Fortaleza que têm CNH C, D ou E ou experiência com máquinas pesadas.

**Secundário:** transportadoras e empresas da região que precisam contratar esses profissionais, começando pela Raysan Transportes.

## :star2: Impacto Esperado

Existe um descompasso no setor. De um lado, faltam motoristas: uma pesquisa da NTC&Logística divulgada em 2026 mostra que 88% das transportadoras do país têm dificuldade para contratar, e as empresas com caminhões parados têm, em média, 8 veículos sem operar por falta de profissional. O déficit estimado é de cerca de 120 mil motoristas. Além disso, o número de pessoas com CNH C, D ou E caiu de 5,6 milhões em 2015 para 4,4 milhões em 2026, segundo a Senatran.

Do outro lado, o Ceará ainda tem desemprego acima da média nacional: 6,6% no 2º trimestre de 2026, contra 5,4% no Brasil (IBGE, PNAD Contínua). No 1º trimestre, eram mais de 282 mil pessoas desocupadas no estado, e 27,6% dos trabalhadores cearenses atuavam por conta própria, acima da média nacional.

Ou seja, tem vaga e tem gente procurando trabalho, mas as duas pontas não se encontram. Hoje essas vagas costumam ser divulgadas só por indicação ou em grupos de WhatsApp, e quem não conhece ninguém do ramo não fica sabendo.

Com o site, esperamos:
- Que pessoas sem contato no setor fiquem sabendo das vagas e consigam se candidatar.
- Que o candidato acompanhe a situação de cada candidatura (enviada, em análise, aprovada ou recusada), em vez de ficar sem resposta da empresa.
- Que as transportadoras recebam currículos de quem tem a CNH e a experiência pedidas.

O site é gratuito para candidatos e empresas, e não é um sistema interno da Raysan: qualquer transportadora pode se cadastrar, depois de aprovada pelo administrador.

## :people_holding_hands: Papéis ou tipos de usuário da aplicação

| Papel | O que pode fazer |
|---|---|
| **Administrador** | Aprova ou recusa o cadastro de empresas, remove vagas irregulares e vê todos os dados |
| **Empresa** | Cadastra, edita e encerra as próprias vagas, vê os candidatos de cada vaga e muda a situação das candidaturas |
| **Candidato** | Preenche o currículo, se candidata às vagas e acompanha a situação de cada candidatura |
| **Usuário não logado** | Vê as vagas abertas, as empresas participantes e as informações do projeto |

## :triangular_flag_on_post:	 Principais funcionalidades da aplicação

**Acessíveis a todos (área pública):**
- Página inicial explicando o projeto e para quem ele é
- Lista de vagas abertas, com filtro por cidade, tipo de vaga e CNH
- Página de detalhes da vaga
- Página das empresas participantes
- Cadastro de candidato ou de empresa, e login

**Restritas a usuários logados:**
- **Empresa:** painel com as suas vagas e quantos candidatos cada uma tem; CRUD de vagas; lista de candidatos com o currículo; mudar a situação de cada candidatura
- **Candidato:** cadastro e edição do currículo; candidatar-se a vagas; ver e cancelar as próprias candidaturas
- **Administrador:** lista de empresas aguardando aprovação; aprovar ou recusar empresas; lista geral de vagas, com opção de remover
- Menu de acordo com o papel, com a opção de sair sempre visível

**Regras de negócio:**
1. A empresa só pode publicar vagas depois que o administrador aprovar o cadastro dela.
2. O candidato só pode se candidatar se tiver o currículo preenchido.
3. Não é possível se candidatar duas vezes para a mesma vaga.
4. Se a vaga exigir CNH, o candidato precisa ter a categoria pedida ou uma superior (ex.: quem tem E pode se candidatar a uma vaga que pede C).
5. Vagas encerradas somem da lista pública e não recebem mais candidaturas, mas continuam no painel da empresa.
6. A empresa só vê e altera as próprias vagas e os candidatos delas. O candidato só vê as próprias candidaturas.
7. O candidato só pode cancelar uma candidatura enquanto ela estiver como enviada ou em análise.

## :spiral_calendar: Entidades ou tabelas do sistema

- **Empresa:** nome, CNPJ, cidade, telefone, descrição, situação do cadastro (pendente, aprovada, recusada). Ligada ao usuário responsável.
- **Vaga:** título, descrição, cidade, tipo (motorista ou operador de máquinas), CNH exigida, equipamento (ex.: rodotrem, pá carregadeira), salário (opcional), situação (aberta ou encerrada). **Depende da Empresa.**
- **Currículo:** nome, cidade, telefone, categoria da CNH, anos de experiência, equipamentos que já operou, resumo da experiência. Cada candidato tem um.
- **Candidatura:** data e situação (enviada, em análise, aprovada, recusada). **Depende da Vaga e do Currículo.**

CRUDs completos no frontend: **Vaga** e **Candidatura**, além do cadastro e edição de **Empresa** e **Currículo**.

Tecnologias: HTML, CSS, TypeScript e Bootstrap no frontend; Strapi no backend (API REST com autenticação JWT); banco SQLite.
