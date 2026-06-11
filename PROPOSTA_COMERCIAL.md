# 📋 Proposta Comercial — Plataforma de Gestão Esportiva "Formando Campeões"

> **Documento Confidencial** — Destinado exclusivamente à avaliação do investimento necessário para aquisição e customização da plataforma.

---

## 1. Resumo Executivo

A plataforma **Formando Campeões** é um sistema web completo (SaaS) de gestão esportiva governamental, projetado para coordenar projetos de inclusão social pelo esporte em **múltiplos núcleos espalhados pelo Brasil**. O sistema gerencia desde a captação e matrícula de alunos até a prestação de contas ao governo federal (Lei de Incentivo ao Esporte), incluindo **inteligência artificial para leitura automatizada de documentos**, geração automática de relatórios oficiais em PDF, e controle administrativo multi-projeto.

| Indicador | Valor |
|-----------|-------|
| **Linhas de código-fonte** | **~40.000 linhas** (37.274 TypeScript/React + 2.954 SQL) |
| **Componentes React** | **45 componentes** especializados |
| **Serviços Backend/IA** | **9 módulos de serviço** |
| **Migrações de banco de dados** | **19 scripts SQL** (Supabase/PostgreSQL) |
| **Total de commits** | **247 commits** de evolução contínua |
| **Período de desenvolvimento** | **Março/2026 — Junho/2026** (~3,5 meses) |
| **Projetos suportados** | 3 projetos simultâneos (Triathlon, Daniel Dias, Futebol) |

---

## 2. Stack Tecnológica (Valor Técnico)

A plataforma foi construída sobre uma stack moderna e profissional, equivalente ao padrão de empresas como Nubank, iFood e Stone:

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Frontend** | React 18 + TypeScript | Framework #1 do mercado, tipagem estática para segurança |
| **Build** | Vite 5 | Compilador ultrarrápido (hot-reload < 1s) |
| **Estilização** | Tailwind CSS | Design system consistente e responsivo |
| **Banco de Dados** | Supabase (PostgreSQL) | Backend-as-a-Service com RLS (Row Level Security) |
| **Autenticação** | Supabase Auth | Login seguro com JWT, roles e permissões |
| **IA / OCR** | Google Gemini API | Visão computacional para leitura de documentos |
| **Mapas** | Leaflet + React-Leaflet | Geolocalização interativa dos núcleos |
| **PDF** | jsPDF + pdf-lib | Geração de relatórios oficiais A4 |
| **Deploy** | Vercel | CDN global, deploy automático via Git |
| **Versionamento** | Git + GitHub | 247 commits rastreáveis |

### Por que isso importa para o cliente:
- Não é um "sistema caseiro" — usa a **mesma tecnologia de startups avaliadas em bilhões**
- **Sem servidor dedicado** = custo de infraestrutura próximo a R$ 0/mês (Supabase free tier + Vercel)
- **Escalável**: suporta de 1 a 10.000+ alunos sem mudança de arquitetura

---

## 3. Inventário Completo de Funcionalidades

### 3.1 🔐 Sistema de Autenticação e Controle de Acesso

| Funcionalidade | Complexidade | Detalhe |
|---------------|-------------|---------|
| Login com e-mail/senha (Supabase Auth) | Alta | JWT, sessões persistentes |
| 4 níveis de permissão | Alta | PROFESSOR, MONITOR, COORDENADOR, ADMIN |
| Seleção de projeto na tela de login | Média | 3 projetos simultâneos |
| Filtro por estado/região | Média | Núcleos filtrados por UF |
| Acesso Demo (sem cadastro) | Baixa | Para demonstrações rápidas |
| Auto-detecção de estado via perfil | Alta | Busca `profiles` + `user_project_access` |
| Cross-project access para admins | Alta | Admin de um projeto acessa os outros |
| Row Level Security (RLS) | Muito Alta | 22 policies de segurança no PostgreSQL |

**Valor isolado deste módulo no mercado: R$ 8.000 – R$ 15.000**

---

### 3.2 📊 Painel Administrativo (AdminDashboard)

| Funcionalidade | Complexidade | Detalhe |
|---------------|-------------|---------|
| Dashboard com métricas em tempo real | Alta | Cards KPI com animações |
| Mapa interativo de todos os núcleos | Alta | Leaflet + clusters por estado |
| Indicadores de estoque por núcleo (LOW/MEDIUM/HIGH) | Média | Semáforo visual |
| Gestão completa de alunos (CRUD) | Alta | Cadastro, edição, busca, filtros |
| Gestão de núcleos | Alta | CRUD com endereço, coordenadas, turmas |
| Gestão de RH/funcionários | Alta | 6 tipos de cargo, dados completos |
| Gestão de contratos | Alta | 5 tipos (CLT, PJ, MEI, Bolsista, Voluntário) |
| Geração automática de contratos PDF | Muito Alta | Templates dinâmicos com cláusulas jurídicas |
| Controle de turmas por núcleo | Média | Turma A/B/C com dias e horários |
| Vinculação SLI ↔ Núcleos | Alta | Multi-select com busca por estado |
| Tour guiado (Onboarding) | Média | GuidedTour.tsx interativo |

**Valor isolado: R$ 25.000 – R$ 40.000**

---

### 3.3 📄 Motor de Geração de Relatórios PDF (5 builders especializados)

Este é o **módulo mais complexo e valioso** do sistema — equivale a um produto inteiro em si.

| Report Builder | Linhas de Código | Funcionalidade |
|---------------|-----------------|----------------|
| **PesquisaReportBuilder** | **254.932 bytes** (~6.000 linhas) | Pesquisa Meta Contínua — relatório com gráficos, tabelas e análise qualitativa |
| **AssiduidadeReportBuilder** | **140.636 bytes** (~3.500 linhas) | Assiduidade e Aproveitamento Escolar — dados cruzados com boletins |
| **InscricaoReportBuilder** | **123.919 bytes** (~3.000 linhas) | Fichas de Inscrição — layout oficial A4 com foto e assinatura |
| **FrequencyReportBuilder** | **56.471 bytes** (~1.400 linhas) | Lista de Frequência mensal — chamada por turma |
| **PDLIEReportBuilder** | **26.262 bytes** (~650 linhas) | Plano de Divulgação da Lei de Incentivo ao Esporte |

**Funcionalidades transversais:**
- Drag-and-drop para montar relatórios customizados
- Editor de toolbar com formatação rica
- Preview em tempo real A4
- Exportação PDF pixel-perfect
- Filtro por SLI / múltiplos núcleos / período
- Sidebar configurável com widgets
- Fórmulas dinâmicas (`formulaEngine.ts` — 12.057 bytes)

**Valor isolado: R$ 35.000 – R$ 60.000**

---

### 3.4 🤖 Inteligência Artificial e OCR (Google Gemini)

| Funcionalidade | Complexidade | Detalhe |
|---------------|-------------|---------|
| OCR de boletins escolares | Muito Alta | Upload de foto → extração automática de notas |
| OCR de documentos gerais | Muito Alta | Comprovantes de renda/endereço |
| Processamento em lote | Alta | Múltiplos boletins de uma vez |
| Extração de dados de contratos | Alta | Leitura de contratos em imagem |
| SmartCamera (captura guiada) | Alta | Interface de câmera com guias visuais |
| CameraOCR (132.486 bytes) | Muito Alta | Módulo completo de visão computacional |

**Tokens de IA estimados consumidos no desenvolvimento:**
- ~2 milhões de tokens de input (imagens de teste)
- ~500 mil tokens de output (extrações estruturadas)
- Custo estimado em API: ~US$ 15–30 no desenvolvimento

**Valor isolado: R$ 20.000 – R$ 35.000**

---

### 3.5 📱 Portal Público (Acesso Externo sem Login)

| Funcionalidade | Complexidade | Detalhe |
|---------------|-------------|---------|
| PublicFormView — roteador de formulários | Alta | Acesso via URL com token |
| PublicPreCadastroForm | Alta | Pré-cadastro completo com geolocalização |
| PublicBoletimUpload | Média | Upload de boletim pelo responsável |
| PublicDeclaracaoMatriculaUpload | Média | Upload de declaração de matrícula |
| Autorização de Viagem | Alta | Formulário legal com consentimento |
| Declaração de Prontidão | Média | Declaração oficial com dados do aluno |
| Declaração de Uniformes | Média | Controle de entrega de material |
| Sincronização cross-tab | Alta | Dados atualizados em tempo real entre abas |

**Valor isolado: R$ 10.000 – R$ 18.000**

---

### 3.6 👩‍⚕️ Módulo de Serviço Social

| Funcionalidade | Complexidade | Detalhe |
|---------------|-------------|---------|
| Dashboard sigiloso do assistente social | Alta | Acesso restrito por senha |
| Pesquisa socioeconômica (49 perguntas) | Alta | Formulário completo com validações |
| Sistema de alertas (3+ faltas, ocorrências) | Alta | Bordas vermelhas automáticas |
| Relatórios sociais confidenciais | Alta | Histórico protegido |
| Cruzamento de dados (frequência × notas) | Muito Alta | Gráficos e tabelas comparativas |

**Valor isolado: R$ 12.000 – R$ 20.000**

---

### 3.7 📦 Módulos Complementares

| Módulo | Complexidade | Detalhe |
|--------|-------------|---------|
| Controle de Estoque/Inventário | Média | Kits lanche, uniformes, materiais com alertas |
| Evidências Fotográficas | Média | Upload categorizado (Acessibilidade, Divulgação) |
| Chamada Digital (Frequência) | Alta | Presença em tempo real por turma |
| Meta Qualitativa | Alta | Questionário aluno/pai/professor |
| Ambiente de Desenvolvimento | Alta | Área técnica para relatórios avançados |

**Valor isolado: R$ 8.000 – R$ 15.000**

---

### 3.8 🗄️ Backend e Banco de Dados (Supabase/PostgreSQL)

| Item | Detalhe |
|------|---------|
| **19 migrações SQL** estruturadas e versionadas | Evolução controlada do schema |
| **13 tabelas** com relacionamentos complexos | profiles, projects, nucleos, students, employees, contracts, documents, etc. |
| **22 políticas RLS** | Segurança em nível de linha — cada usuário vê apenas seus dados |
| **3 functions SECURITY DEFINER** | Elimina recursão em políticas de acesso |
| **Backfill automático** | Migração de dados legados (estado_responsavel) |
| **Storage buckets** | Upload de arquivos com políticas de acesso |

**Valor isolado: R$ 15.000 – R$ 25.000**

---

## 4. Estimativa de Esforço (Horas de Trabalho)

### 4.1 Breakdown por Área

| Área de Trabalho | Horas Estimadas | % do Total |
|-----------------|----------------|-----------|
| **Arquitetura e Setup** (projeto, CI/CD, Vercel, Supabase) | 40h | 5% |
| **Design UI/UX** (layout, responsividade, temas por projeto) | 80h | 10% |
| **Frontend — Componentes base** (Dashboard, Header, Login) | 60h | 8% |
| **Frontend — Admin Dashboard** (mapa, CRUD, gestão) | 100h | 13% |
| **Frontend — Relatórios PDF** (5 builders + engine de fórmulas) | 200h | 26% |
| **Frontend — Formulários** (socioeconômico, meta, declarações) | 80h | 10% |
| **IA/OCR** (Gemini integration, CameraOCR, SmartCamera) | 60h | 8% |
| **Backend** (Supabase schema, RLS, migrations, services) | 60h | 8% |
| **Portal público** (formulários externos, tokens, sync) | 40h | 5% |
| **Testes, Debug e Otimização** | 40h | 5% |
| **Documentação e Suporte** | 20h | 3% |
| **TOTAL** | **780 horas** | **100%** |

### 4.2 Equivalência em Equipe Tradicional

Se este sistema fosse desenvolvido por uma **equipe convencional de software house**:

| Profissional | Meses | Valor Mensal | Subtotal |
|-------------|-------|-------------|----------|
| Desenvolvedor Frontend Sênior | 3,5 | R$ 15.000 | R$ 52.500 |
| Desenvolvedor Backend Sênior | 2 | R$ 14.000 | R$ 28.000 |
| Designer UI/UX | 1,5 | R$ 10.000 | R$ 15.000 |
| Engenheiro de IA/ML | 1 | R$ 18.000 | R$ 18.000 |
| DevOps/Infra | 0,5 | R$ 12.000 | R$ 6.000 |
| Gerente de Projeto (PM) | 3,5 | R$ 12.000 | R$ 42.000 |
| **TOTAL EQUIPE** | | | **R$ 161.500** |

---

## 5. Custos de Operação Mensal (TCO)

| Item | Custo Mensal |
|------|-------------|
| Supabase (free tier → Pro se necessário) | R$ 0 – R$ 130/mês |
| Vercel (hosting + CDN) | R$ 0 – R$ 100/mês |
| Google Gemini API (tokens de IA) | R$ 5 – R$ 50/mês |
| Domínio personalizado (.com.br) | ~R$ 3/mês |
| **Total operacional** | **R$ 8 – R$ 283/mês** |

> **Nota:** No cenário atual, o custo operacional mensal é **praticamente zero** usando free tiers.

---

## 6. Tokens de IA Gastos no Desenvolvimento

| Categoria | Tokens Estimados | Custo API (USD) |
|-----------|-----------------|----------------|
| **Sessões de desenvolvimento assistido por IA** | ~15 milhões de tokens | ~$45 |
| **Testes de OCR com Gemini** (imagens de boletins) | ~2 milhões de tokens | ~$20 |
| **Geração de código via LLM** | ~8 milhões de tokens | ~$30 |
| **Debug e refatoração assistida** | ~5 milhões de tokens | ~$15 |
| **Total estimado** | **~30 milhões de tokens** | **~$110 (≈ R$ 600)** |

> Estes tokens representam o custo de R&D. **O cliente não paga por isso** — é parte do investimento de desenvolvimento.

---

## 7. Proposta de Precificação

### 7.1 Modelo — Licenciamento + Customização

| Pacote | Incluso | Investimento |
|--------|---------|-------------|
| **Licença da Plataforma** | Código-fonte completo, deploy, treinamento | **R$ 95.000,00** |
| **Customização de Marca** (logo, cores, domínio) | White-label com identidade do cliente | R$ 5.000,00 |
| **Suporte + Manutenção** (6 meses) | Correções, atualizações, suporte via chat | R$ 12.000,00 |
| **Treinamento da equipe** (remoto, 8h) | Videoconferências de capacitação | R$ 4.000,00 |
| | **TOTAL** | **R$ 116.000,00** |

### 7.2 Opção — Assinatura Mensal (SaaS)

| Plano | Incluso | Mensalidade |
|-------|---------|------------|
| **Básico** (1 projeto, até 500 alunos) | Hosting, backup, suporte e-mail | R$ 2.500/mês |
| **Profissional** (3 projetos, ilimitado) | + IA ilimitada, relatórios avançados, suporte prioritário | R$ 4.500/mês |
| **Enterprise** (customizado) | + API própria, integrações, SLA 99.9% | Sob consulta |

---

## 8. Justificativa de Valor (Por que vale esse investimento?)

### 🏆 1. Elimina 100% do trabalho manual de prestação de contas
Os relatórios que antes levavam **semanas** para serem montados manualmente no Word/Excel agora são gerados automaticamente em **segundos**, com dados reais dos alunos, frequências e avaliações.

### 🤖 2. IA proprietária que ninguém mais tem
O sistema **lê boletins escolares com inteligência artificial** (Google Gemini Vision) e extrai automaticamente notas, frequência e dados do aluno. Isso **elimina o trabalho de 1 digitador em tempo integral**.

### 🗺️ 3. Gestão multi-nucleo com visão nacional
Mapa interativo mostrando **todos os núcleos do Brasil** com indicadores de estoque, status e dados em tempo real. Nenhum sistema genérico de gestão oferece isso.

### 📄 4. 5 relatórios governamentais oficiais automatizados
Cada relatório custaria **R$ 5.000–15.000** para ser desenvolvido isoladamente. São 5 builders complexos com:
- Pixel-perfect layout A4
- Drag-and-drop
- Fórmulas dinâmicas
- Filtros por SLI / núcleo / período

### 🔒 5. Segurança em nível bancário
22 políticas de Row Level Security (RLS) no PostgreSQL garantem que cada usuário **só vê os dados que tem permissão**. Admin do PR não vê dados do CE e vice-versa.

### 📱 6. Portal público para pais e responsáveis
Formulários acessíveis via link/QR Code — **sem necessidade de app ou login** para os pais. Isso reduz drasticamente o trabalho da secretaria.

### 💰 7. Custo de operação quase zero
Enquanto sistemas concorrentes cobram **R$ 5.000–15.000/mês** em servidor + licenças, este sistema roda na nuvem por **menos de R$ 300/mês** (e potencialmente R$ 0 no free tier).

### 📊 8. Comparação com o mercado

| Aspecto | Solução Genérica (SAP, Totvs) | Desenvolvimento Custom (Software House) | **Esta Plataforma** |
|---------|------------------------------|----------------------------------------|---------------------|
| Custo de implantação | R$ 200.000+ | R$ 150.000–300.000 | **R$ 95.000–116.000** |
| Tempo de entrega | 6–12 meses | 6–8 meses | **Pronto para uso** |
| Custo mensal | R$ 5.000–15.000 | R$ 3.000–8.000 | **R$ 0–283** |
| IA/OCR integrada | ❌ Não incluso | ⚠️ Custo extra | ✅ **Incluso** |
| Relatórios governamentais | ❌ Genéricos | ⚠️ Custo extra por relatório | ✅ **5 builders prontos** |
| Multi-projeto | ⚠️ Licença extra | ⚠️ Retrabalho | ✅ **3 projetos inclusos** |

---

## 9. Dados Técnicos para Due Diligence

| Métrica | Valor |
|---------|-------|
| Linhas de código TypeScript/React | 37.274 |
| Linhas de código SQL | 2.954 |
| Linhas CSS | 979 |
| Total de arquivos de código | ~70 |
| Tamanho do bundle compilado | ~2 MB (gzip: ~500 KB) |
| Componentes React | 45 |
| Serviços/módulos de lógica | 9 |
| Tipos TypeScript definidos | 509 linhas (~50 interfaces/types) |
| Commits de evolução | 247 |
| Primeiro commit | 18/Mar/2026 |
| Último commit | 02/Jun/2026 |
| Tempo de desenvolvimento | ~3,5 meses |
| Horas de desenvolvimento estimadas | ~780h |

---

## 10. Garantias e Entregáveis

### ✅ O que está incluído na entrega:
- [ ] Código-fonte completo com documentação
- [ ] Banco de dados estruturado e populado (19 migrações)
- [ ] Deploy funcional em produção (Vercel)
- [ ] Documentação técnica (README, schemas, diagramas)
- [ ] Sessão de treinamento (8h)
- [ ] 6 meses de suporte técnico

### ⚠️ O que NÃO está incluído (mas pode ser contratado à parte):
- Desenvolvimento de funcionalidades novas (sob demanda)
- Integração com sistemas legados do cliente
- App mobile nativo (iOS/Android)
- Consultoria de negócios/processos

---

*Documento gerado em: Junho/2026*
*Versão do Sistema: 1.0 — Produção*
*Contato técnico: [A definir pelo cliente]*
