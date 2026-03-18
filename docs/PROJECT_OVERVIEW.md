# Visão Geral do Projeto - WebApp Formando Campeões

Este documento fornece uma análise detalhada da arquitetura, serviços, fluxos de trabalho e estrutura de dados do sistema "Gestão de Núcleo - Formando Campeões".

## 1. Visão Geral do WebApp

O **WebApp Formando Campeões** é uma plataforma de gestão para núcleos esportivos, focada em:

- Gestão de Alunos (Inscrição, Documentação).
- Digitalização e OCR de Documentos Físicos (Fichas, Boletins).
- Monitoramento de Assiduidade e Desempenho Escolar.
- Gestão Administrativa e de Estoque.
- Geração Automatizada de Relatórios Oficiais.

### Principais Módulos

| Módulo | Descrição |
| :--- | :--- |
| **Dashboard de Serviços** | Interface principal para acesso rápido às funcionalidades de upload e cadastro. |
| **Painel Administrativo** | Visão gerencial (AdminMap) com mapa interativo dos núcleos, gestão de estoque e RH. |
| **OCR & IA** | Serviços de extração automática de dados de fotos e PDFs usando Google Gemini AI. |
| **Editor de PDF** | Ferramenta visual para composição de relatórios finais arrastando elementos (Drag & Drop). |
| **Cruzamento de Dados** | Algoritmos de "Merge" para unificar dados de diferentes fontes (Boletim, Ficha, Frequência) em um perfil único de aluno. |

---

## 2. Detalhamento dos Serviços (`/services`)

### `geminiService.ts`

Responsável pela integração com a IA Generativa (Google Gemini) para processamento inteligente de documentos.

- **Funções Principais:**
  - `extractStudentData`: OCR de Fichas de Inscrição (Extrai nome, data, escola, etc.).
  - `processSchoolReport`: OCR de Boletins Escolares (Extrai notas e frequência inicial/final).
  - `processFrequencyList`: Leitura de listas de chamada manuais (Conta presenças).
  - `refineText`: Melhoria textual assistida por IA para relatórios.

### 2.1. Painel de Serviços (Dashboard)

O **Painel de Serviços Principais** (`Dashboard.tsx`) é a tela inicial para o operador do núcleo, agrupando todas as tarefas essenciais de coleta de dados e gestão.

| Serviço | Subtítulo / Descrição | Ação do Sistema |
| :--- | :--- | :--- |
| **1. Ficha de Inscrição** | + Dados Cadastrais | Abre a câmera (`CameraOCR`) para digitalizar a ficha e extrair dados via Gemini AI. |
| **2. Declaração de Matrícula** | Upload de Comprovante | Upload de arquivo/foto da declaração para salvar no perfil do aluno. |
| **3. Boletins Escolares** | Início e Final do Ciclo | Upload de boletins para extração automática de notas e faltas. |
| **4. Relatório Assiduidade** | Upload de Planilha | Importação de planilhas de controle de presença externa. |
| **5. Listas de Frequência** | Digitalização ou Chamada | Digitalização de listas físicas de chamada para contagem de presença. |
| **6. Pesquisa Meta Continua** | Questionário Qualitativo | Formulário para avaliação qualitativa do impacto do projeto. |
| **Indicadores de Saúde** | Pesquisa Socioeconômica | Coleta de dados sobre saúde e condições socioeconômicas das famílias. |
| **Controle de Estoque** | Bens de Consumo (Lanches) | Acesso rápido ao módulo de entrada/saída de lanches e materiais. |
| **7. Rel. Beneficiados** | Planilha Gerada (PDF) | Gera relatório consolidado de todos os alunos beneficiados. |
| **8. Rel. Escolas** | Planilha Gerada (PDF) | Gera relatório agrupado por escolas parceiras. |
| **Evidências** | Fotos: Acessibilidade... | Upload de fotos para comprovação de execução (ex: aulas, eventos). |

### `dataMergeService.ts`

O "Cérebro" de dados do sistema. Responsável por receber dados fragmentados de diversas fontes e unificá-los.

- **Lógica de Matching:**
  - Normalização de nomes (remoção de acentos, uppercase).
  - Match exato e cálculo de similaridade para sugestões.
- **Fluxo de Merge:**
  1. Cria perfil base a partir da Ficha de Inscrição.
  2. Enriquece com dados de Boletins (Notas).
  3. Adiciona dados de Frequência e Socioeconômicos.
  4. Consolida tudo em um objeto `MergedStudentProfile`.

---

## 3. Modo de Trabalho e Fluxo de Informação

O sistema opera em um fluxo cíclico de **Coleta -> Processamento -> Consolidação -> Relatório**.

### Diagrama de Fluxo de Dados (Mermaid)

```mermaid
graph TD
    %% Fontes de Dados
    subgraph Inputs [Coleta de Dados]
        A[Ficha de Inscrição <br/> (Foto/PDF)] -->|OCR via Gemini| B(Dados Cadastrais)
        C[Boletins Escolares <br/> (Foto/PDF)] -->|OCR via Gemini| D(Notas e Frequência)
        E[Listas de Chamada <br/> (Foto)] -->|OCR via Gemini| F(Presença Mensal)
        G[Pesquisas] -->|Formulário| H(Dados Socioeconômicos)
    end

    %% Processamento Central
    subgraph Core [Processamento Inteligente]
        B --> MergeService{Data Merge Service}
        D --> MergeService
        F --> MergeService
        H --> MergeService
        
        MergeService -->|Normalização & Matching| I[Perfil Unificado do Aluno]
        I -->|Auditoria| J[Dashboard de Cruzamento]
    end

    %% Saídas
    subgraph Outputs [Geração de Valor]
        I -->|Drag & Drop| K[Editor de PDF]
        K --> L[Relatório Oficial]
        I -->|Estatísticas| M[Dashboard Admin]
        M --> N[Mapa de Núcleos]
    end

    %% Estilos
    style MergeService fill:#f9f,stroke:#333,stroke-width:2px
    style I fill:#bbf,stroke:#333,stroke-width:2px
    style K fill:#bfb,stroke:#333,stroke-width:2px
```

---

## 4. Estrutura de Arquivos Principal

- `App.tsx`: Roteador principal e gerenciador de estado global.
- `types.ts`: Definições de tipos TypeScript (Contratos de dados).
- `/components`:
  - `AdminDashboard.tsx`: Painel de gestão com abas de Estoque, Alunos e Núcleos.
  - `AdminMap.tsx`: Mapa interativo com clusterização e popups dinâmicos.
  - `NucleoDetailModal.tsx`: Detalhes do núcleo, gestão de RH e Contratos.
  - `PDFBuilder*.tsx`: Componentes do editor visual de relatórios.
  - `CameraOCR.tsx` / `DocumentUpload.tsx`: Interfaces de captura de dados.

## 5. Fluxos de Interação do Usuário

1. **Onboarding do Aluno**:
    - Usuário tira foto da ficha -> `CameraOCR` envia para `geminiService` -> Dados retornam preenchidos -> Usuário confirma -> Salva em `students`.

2. **Gestão Diária**:
    - Admin acessa `AdminDashboard` -> Visualiza mapa -> Clica em um Núcleo -> Vê status de estoque e equipe (`NucleoDetailModal`).

3. **Fechamento Mensal**:
    - Usuário faz upload de listas/boletins -> Sistema processa -> Usuário acessa "Cruzar Dados" -> Sistema gera tabela consolidada -> Usuário arrasta para o Editor PDF -> Exporta Relatório.

---

## 6. Detalhamento das Funcionalidades Chave

### 6.1. Editor de PDF (Drag & Drop)

Uma ferramenta visual poderosa para composição de relatórios finais, permitindo que o administrador monte documentos oficiais de forma intuitiva.

- **Interface Visual:** Área de canvas que simula folhas A4.
- **Drag & Drop (Arrastar e Soltar):**
  - O usuário arrasta elementos da barra lateral ou de modais (tabelas geradas, imagens, notas) diretamente para a página.
- **Funcionalidades:**
  - **Gestão de Páginas:** Adicionar novas páginas conforme a necessidade do relatório.
  - **Elementos Suportados:** Tabelas de dados cruzados, imagens de evidências, notas de texto, cabeçalhos automáticos.
  - **Exportação:** Gera um arquivo PDF final pronto para envio ao órgão financiador/governo.

### 6.2. Painel Administrativo e Mapa Interativo

O centro de comando para a gestão da rede de núcleos (AdminDashboard).

- **Mapa Georreferenciado (AdminMap):**
  - **Visualização Nacional:** Mapa do Brasil com marcadores para cada núcleo.
  - **Heatmap (Mapa de Calor):** Indica visualmente a densidade de núcleos por estado (Cores variam de Verde a Vermelho conforme a quantidade).
  - **Marcadores Dinâmicos:** Os pinos no mapa mudam de cor baseados no status do filtro ativo (ex: Estoque Crítico = Vermelho, Normal = Verde).
- **Popups Inteligentes:** Ao clicar em um núcleo, um popup exibe informações contextuais dependendo da aba selecionada:
  - **Aba Estoque:** Mostra itens em falta ou status de abastecimento.
  - **Aba Alunos:** Exibe contagem de alunos e lista rápida de matriculados.
  - **Aba Núcleos:** Exibe dados da equipe (RH) e coordenação.
- **Gestão de RH:**
  - Cadastro de funcionários (Professores, Coordenadores) diretamente pelo modal do núcleo.
  - Suporte a múltiplos tipos de contrato.
