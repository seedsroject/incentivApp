# 📚 Documentação Completa do Sistema

Bem-vindo à documentação oficial do **Sistema de Gestão Esportiva e Projetos Sociais** (suportando os projetos *Formando Campeões*, *Nadando com Daniel Dias*, *Escolinha de Futebol* e *IncentivApp*).

Este documento detalha todas as funcionalidades, módulos, telas e serviços integrados na plataforma.

---

## 📑 Sumário

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Acesso e Autenticação (Login & Seleção de Projetos)](#2-acesso-e-autenticação-login--seleção-de-projetos)
3. [Painel de Serviços do Núcleo (Dashboard)](#3-painel-de-serviços-do-núcleo-dashboard)
4. [Painel Administrativo & Mapa Gerencial (AdminDashboard)](#4-painel-administrativo--mapa-gerencial-admindashboard)
5. [Gestão de RH & Gerador de Contratos via IA](#5-gestão-de-rh--gerador-de-contratos-via-ia)
6. [Portal do Aluno e Formulários Públicos (Wizard de Inscrição)](#6-portal-do-aluno-e-formulários-públicos-wizard-de-inscrição)
7. [Cruzamento de Dados & Unificação de Perfis](#7-cruzamento-de-dados--unificação-de-perfis)
8. [Editor de PDF & Relatórios Oficiais (Drag & Drop)](#8-editor-de-pdf--relatórios-oficiais-drag--drop)
9. [Resumo da Arquitetura Técnica](#9-resumo-da-arquitetura-técnica)

---

## 1. Visão Geral do Sistema

O sistema é uma plataforma **multi-projeto** e **multi-tenant** desenvolvida para gerenciar núcleos esportivos e sociais incentivados. A plataforma centraliza todo o ciclo de vida do projeto:

- **Assistência Social:** Captação, triagem e fila de espera inteligente.
- **Secretaria & Alunos:** Digitalização de documentos com OCR inteligente via IA, matrículas e controle de frequência.
- **Gestão Operacional:** Controle de estoque de lanches/materiais e inventário de bens.
- **Recursos Humanos:** Gestão da equipe do núcleo e minutas de contratos terceirizados (PJ).
- **Prestação de Contas:** Emissão de relatórios consolidados e evidências fotográficas para órgãos governamentais e patrocinadores.

---

## 2. Acesso e Autenticação (Login & Seleção de Projetos)

### 2.1. Tela de Login e Carrossel Multi-Projeto
A tela inicial possui um **carrossel dinâmico** que permite selecionar o projeto ativo antes de realizar o acesso:

- 🏊 **Formando Campeões** (Escolinha de Triathlon - Tema Azul/Verde Água)
- 🏊‍♂️ **Nadando com Daniel Dias** (Tema Azul Céu / Sky)
- ⚽ **Escolinha de Futebol** (Tema Verde Esmeralda)
- 🚀 **IncentivApp** (Gestão de Projetos - Tema Índigo/Azul)

### 2.2. Adaptabilidade Visual Automática
Ao alterar o projeto no login, todo o sistema ajusta instantaneamente:
- Logotipos principais e banners de cabeçalho.
- Cores de fundo, degradês dos botões e iluminação radial.
- Nomes dos relatórios e minutas contratuais.

### 2.3. Perfil de Acesso
- **Usuário de Núcleo (Professor/Coordenador):** Acesso direto ao Dashboard do núcleo para coleta de documentos e registros diários.
- **Super Admin / Coordenador Geral:** Acesso ao mapa nacional georreferenciado, visão consolidada de todos os núcleos, RH global e estoque centralizado.

---

## 3. Painel de Serviços do Núcleo (Dashboard)

O **Dashboard Principal** agrupa os módulos de trabalho divididos em serviços sequenciais e especializados:

### 0. Pré-cadastro e Fila de Espera Inteligente
- **Função:** Gerenciamento da fila de candidatos para garantir 100% de ocupação nos núcleos.
- **Destaques:**
  - Triagem automatizada com cálculo de geolocalização e núcleo mais próximo.
  - Transferência automática de histórico de presença em caso de desistência/inativação de alunos.
  - Link externo para envio dos formulários aos pais via WhatsApp.

### 1. Ficha de Inscrição (+ Dados Cadastrais com OCR via IA)
- **Função:** Captura e digitalização instantânea de fichas físicas.
- **Destaques:**
  - Uso da câmera do dispositivo ou upload de foto/PDF.
  - Extração automática de texto via **Google Gemini AI** (Nome, data de nascimento, CPF, responsável, endereço, escola).
  - Suporte completo a alunos **PNE** (Portadores de Necessidades Especiais), incluindo prescrição médica e dados do acompanhante/supervisor.

### 2. Declaração de Matrícula
- **Função:** Upload e armazenamento do comprovante de escolaridade regular do beneficiado exigido por lei.

### 3. Boletins Escolares
- **Função:** Leitura e digitalização de boletins de início e final de ciclo letivo.
- **Destaques:** Extração automática de notas e faltas via OCR para monitoramento do rendimento escolar do aluno.

### 4. Relatório de Assiduidade
- **Função:** Importação e upload de planilhas externas de acompanhamento de frequência mensal.

### 5. Listas de Frequência
- **Função:** Digitalização de listas de chamada físicas ou lançamento manual das aulas.
- **Destaques:** Contagem automática de presenças/faltas mensais por turma.

### 6. Pesquisa Meta Qualitativa
- **Função:** Questionário qualitativo para mensurar o impacto do projeto na vida do aluno, na família e no convívio escolar.

### Indicadores de Saúde & Socioeconômicos
- **Função:** Levantamento do perfil socioeconômico da família.
- **Dados Coletados:** Renda familiar, habitação, transporte, benefícios sociais (Bolsa Família/BPC), histórico de vacinação, peso e altura.

### Controle de Estoque (Bens de Consumo)
- **Função:** Gestão em tempo real de itens de consumo diário (ex: lanches, bebidas, suprimentos).
- **Alertas:** Badges visuais no menu indicando estoque moderado (amarelo) ou reposição crítica (vermelho em 10%).

### 7. Relatório de Beneficiados & 8. Relatório de Escolas
- **Função:** Emissão de documentos consolidados em PDF com listagem completa dos alunos matriculados e mapeamento das escolas parceiras. *(Ocultado automaticamente no projeto IncentivApp)*.

### Evidências Fotográficas
- **Função:** Galeria de comprovação de execução contendo upload de fotos categorizadas (Acessibilidade, Divulgação, Aulas e Entrega de Materiais).

### Acompanhamento do Serviço Social
- **Função:** Registro de atendimentos individuais, visitas domiciliares e acompanhamento socioassistencial dos estudantes.

---

## 4. Painel Administrativo & Mapa Gerencial (AdminDashboard)

Disponível para a coordenação geral e Super Admins para gestão estratégica da rede:

### 4.1. Mapa Georreferenciado Interativo (AdminMap)
- **Visualização Nacional:** Exibe todos os núcleos espalhados pelo país com marcadores coloridos dinâmicos.
- **Heatmap (Mapa de Calor):** Visualização de densidade por estado.
- **Popups Informativos:** Ao clicar no núcleo, exibe dados instantâneos de acordo com o filtro selecionado (Status do Estoque, Quantidade de Alunos ou Equipe de RH).

### 4.2. Seletor e Filtro Global de Núcleos
- Permite filtrar todas as métricas da plataforma por um núcleo específico ou visualizar dados consolidados do projeto.

### 4.3. Detalhamento e Gestão do Núcleo (NucleoDetailModal)
- **Informações Gerais:** Razão social, CNPJ, número SLI do Ministério do Esporte, endereço e turmas.
- **Vínculos de SLI:** Associação de múltiplos núcleos em um mesmo projeto SLI.
- **Inventário de Bens Permanentes:** Cadastro e controle de bens (bolas, bicicletas, uniformes, materiais esportivos).

---

## 5. Gestão de RH & Gerador de Contratos via IA

Módulo especializado em gestão da equipe de profissionais dos núcleos:

- **Funções Atendidas:** Coordenadores, Professores, Monitores, Administrativo, Psicólogos e Assistentes Sociais.
- **Gerador de Contratos Inteligente (ContractGenerationModal):**
  - Geração automática de minutas jurídicas para prestação de serviços terceirizados (PJ) em conformidade com as exigências da Lei de Incentivo ao Esporte.
  - Ajuste dinâmico do cabeçalho oficial do projeto.
  - Leitura de contratos enviados via OCR para preenchimento automático.
  - Coleta e inserção de **Assinaturas Digitais / Manuais** na própria minuta.
  - Exportação direta para PDF ou impressão A4 perfeitamente paginada.

---

## 6. Portal do Aluno e Formulários Públicos (Wizard de Inscrição)

Permite que os responsáveis realizem o preenchimento completo dos dados pelo celular sem necessidade de formulários impressos:

- **Compartilhamento por Link/QR Code:** Envio de links diretos com o ID do núcleo e professor.
- **Wizard de 7 Etapas:**
  1. **Ficha de Inscrição:** Dados pessoais, responsável, endereço e escola.
  2. **Declaração de Matrícula:** Scan ou foto do comprovante escolar.
  3. **Autorização de Viagem:** Termo de autorização para deslocamentos esportivos com assinatura na tela.
  4. **Questionário Socioeconômico:** Perfil da família.
  5. **Declaração de Uniformes:** Recibo de recebimento dos kits esportivos.
  6. **Questionário PAR-Q:** Avaliação de prontidão para atividade física e saúde.
  7. **Pesquisa Meta Qualitativa:** Percepção de desenvolvimento.

---

## 7. Cruzamento de Dados & Unificação de Perfis

O motor de integração (`dataMergeService.ts`) funciona como o cérebro do sistema:

1. **Captura Fragmentada:** Coleta dados originados da ficha de inscrição, boletim escolar, chamadas e pesquisas.
2. **Algoritmo de Matching:** Utiliza algoritmos de similaridade e normalização de texto para vincular registros com variações de grafia.
3. **Perfil Unificado do Aluno (`MergedStudentProfile`):** Consolida todo o histórico do estudante em uma única ficha cadastral completa pronta para auditoria.

---

## 8. Editor de PDF & Relatórios Oficiais (Drag & Drop)

Ferramenta visual desenvolvida para a montagem de relatórios de prestação de contas finais:

- **Canvas A4 em Tempo Real:** Visualização idêntica à impressão final.
- **Arrastar e Soltar (Drag & Drop):** Adição de tabelas consolidadas, gráficos de desempenho escolar, fotos de evidências e blocos de texto.
- **Exportação Oficial:** Geração de arquivo PDF padronizado para apresentação ao Ministério do Esporte e patrocinadores do projeto.

---

## 9. Resumo da Arquitetura Técnica

- **Frontend:** React, TypeScript, Tailwind CSS.
- **Processamento de Imagens e IA:** Google Gemini Generative AI (Vision OCR & NLP).
- **Geolocalização & Mapas:** Leaflet / OpenStreetMap.
- **Persistência de Dados:** Integrado com Supabase & LocalStorage de alta performance.
- **Ferramentas de Build:** Vite (Tempo de build < 10s).

---

*Documentação atualizada em: Agosto de 2026.*
