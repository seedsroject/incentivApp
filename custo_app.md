# Documentação Técnica - WebApp Formando Campeões

## 1. Visão Geral do Sistema

**Nome do Projeto:** Formando Campeões - Gestão de Núcleo Esportivo  
**Tipo:** WebApp SPA (Single Page Application)  
**Stack Tecnológica:**
- Frontend: React 18 + TypeScript
- Build: Vite
- Estilização: Tailwind CSS
- IA: Google Gemini API (processamento de documentos)
- Persistência: localStorage (sem backend)
- Deploy: Vercel (SPA routing)

**Objetivo:** Sistema de gestão para projeto esportivo de triathlon que coordena múltiplos núcleos (centros de treinamento) pelo Brasil, com gestão de alunos, documentos, relatórios e evidências.

---

## 2. Todas as Funcionalidades do Sistema

### Módulos Principais (14 Serviços)

| # | Módulo | Descrição |
|---|--------|-----------|
| 0 | **Pré-cadastro e Fila de Espera** | Gestão de candidatos com fila de espera inteligente, geolocalização para sugestão de núcleo, notificação automática de vagas |
| 1 | **Ficha de Inscrição** | Captura de dados cadastrais via câmera/OCR, assinatura digital, laudo médico para PCD |
| 2 | **Declaração de Matrícula** | Upload de comprovante de matrícula escolar |
| 3 | **Boletins Escolares** | Upload em lote com OCR (Gemini AI), extração de notas e frequência, detecção parcial/final |
| 4 | **Relatório de Assiduidade** | Upload de planilhas, extração de dados de aproveitamento e frequência |
| 5 | **Listas de Frequência** | Chamada digital em tempo real, distribuição automática de estoque (lanches), relatórios mensais consolidados |
| 6 | **Pesquisa Meta Contínua** | Questionário qualitativo (aluno/pai/professor), escala de avaliação, histórico de respostas |
| 7 | **Indicadores de Saúde** | Pesquisa socioeconômica completa (49 perguntas), dados de saúde, peso/altura |
| 8 | **Controle de Estoque** | Gestão de estoque (kits lanche, uniformes), alerta automático (10% mínimo), previsões de consumo |
| 9 | **Relatório de Beneficiados** | Geração automática PDF (Relatório 7) com dados dos alunos |
| 10 | **Relatório de Escolas** | Geração automática PDF (Relatório 8) com dados das escolas |
| 11 | **Evidências Fotográficas** | Upload de fotos categorizadas: Acessibilidade, Divulgação, Materiais |
| 12 | **Acompanhamento Social** | Monitoramento de alunos com alertas (ocorrências disciplinares, 3+ ausências), relatórios sociais confidenciais |
| 13 | **Cruzamento de Dados** | Gráficos e tabelas comparativas: frequência x ausências, médias por núcleo, histórico |

### Funcionalidades Administrativas

- **AdminDashboard**: Painel central com mapa interativo dos núcleos, status de estoque (LOW/MEDIUM/HIGH), gerenciamento de alunos por núcleo
- **Mapa de Núcleos**: Visualização geolocalizada de todos os centros com indicadores de estoque
- **Geração de Relatórios PDF**: Arrastar-e-soltar para construir documentos customizados
- **Gestão de Núcleos**: CRUD de núcleos com dados completos (endereço, contato, turmas, durabilidade)
- **Gestão de RH**: Cadastro de funcionários com contratos (CLT, PJ, Bolsista, Voluntário, MEI)

### Funcionalidades Públicas (Acesso Externo)

- **Link Público via URL**: Sistema de token para pais/responsáveis acessarem formulários específicos
- **Formulários Públicos**: Pré-cadastro, Declaration de Matrícula, Boletim, Declaração de Uniformes
- **Notificações Automáticas**: Alertas de documentos faltantes, vagas disponíveis na fila

---

## 3. Fluxos de Dados e Conexões

### Fluxo Principal

```
[Login] → [Dashboard] → [Módulos de Serviço]
     ↓
[AdminDashboard] ↔ [Mapa de Núcleos]
     ↓
[PDF Builder] → [Relatórios Personalizados]
```

### Persistência de Dados

| Dado | Armazenamento | Descrição |
|------|---------------|------------|
| Alunos | localStorage (`students_v2`) | Cadastro completo com status, documentos, declarações |
| Pré-cadastros | localStorage (`preCadastros`) | Fila de espera com status e dados socioeconômicos |
| Documentos | localStorage (`collectedDocuments`) | Histórico de uploads (boletins, ocorrências, relatórios sociais) |
| Estoque | State React | Inventário com thresholds mínimos |

### Integrações Externas

1. **Google Gemini API**
   - Processamento em lote de boletins escolares
   - Extração de texto de documentos OCR
   - Geração de sumários executivos para relatórios

2. **Câmera Dispositivo**
   - SmartCamera: Captura de documentos
   - OCR: Conversão imagem → texto estruturado

3. **URL Tokens**
   - Acesso público via query params (`?service=ficha&token=xxx&studentId=xxx`)
   - Sincronização cross-tab via storage events

---

## 4. Estrutura de Componentes

### Categorias de Componentes (~33 arquivos)

| Categoria | Componentes |
|-----------|-------------|
| **Dashboard** | Dashboard.tsx, Header.tsx, Logo.tsx |
| **Administração** | AdminDashboard.tsx, AdminMap.tsx, NucleoAddModal.tsx, NucleoDetailModal.tsx |
| **Documentos** | DocumentUpload.tsx, CameraOCR.tsx, SmartCamera.tsx, EvidenceUpload.tsx |
| **Pré-cadastro** | PreCadastroDashboard.tsx, PublicPreCadastroForm.tsx |
| **Formulários** | SocioeconomicForm.tsx, MetaQualitativa.tsx, DeclaracaoProntidaoForm.tsx, DeclaracaoUniformesForm.tsx |
| **Relatórios** | CrossReferenceView.tsx, FrequencyReportBuilder.tsx, ReportPreview.tsx |
| **Estoque** | InventoryControl.tsx |
| **Serviço Social** | ServicoSocialDashboard.tsx |
| **PDF Builder** | PDFBuilderContext.tsx, PDFBuilderSidebar.tsx, ContractGenerationModal.tsx |
| **Público** | PublicFormView.tsx, PublicBoletimUpload.tsx, PublicDeclaracaoMatriculaUpload.tsx |

---

## 5. Últimas 5 Implementações

Com base no histórico de commits:

### 5.1 Anexo Meta Quantitativa 01 - Lista de Frequência
- **Commit:** `b047370` - "feat: Implementa Anexo Meta Quantitativa 01 - Lista de Frequência"
- **Descrição:** Implementação completa do relatório de frequência oficial com layout customizado, iterando sobre a duração do projeto (meses)

### 5.2 Tabela 5 - Frequência de Cada Mês (Layout Customizado)
- **Commit:** `8e9531b` - "feat: implementa Tabela 5 (Frequencia de cada mes) iterando sobre a duracao do projeto com layout customizado"
- **Descrição:** Tabela detalhada por mês com breakdown diário, padding dinâmico para meses futuros baseado na data do projeto

### 5.3 Cruzamento de Dados e Gráficos
- **Commits:** `cbac6ff`, `46d893b`, `665bd41`
- **Descrição:** Nova seção com abas (Frequência/Assiduidade), filtros dropdown, gráficos (pizza, barras), tabelas mensais detalhadas

### 5.4 Alertas de Documentos Faltantes
- **Commit:** `b7923d9` - "feat: alerta de documentos faltantes por aluno na Chamada Digital e AdminDashboard"
- **Descrição:** Sistema de alertas visuais para documentos pendentes, integrando com chamada digital e painel administrativo

### 5.5 Data de Início/Término e Notificações de Durabilidade
- **Commit:** `51bacfc` - "feat: adiciona Data de Início/Término e notificações de durabilidade aos núcleos"
- **Descrição:** Cadastro de período do projeto por núcleo com alertas de durabilidade

---

## 6. Implementações Futuras Planejadas

### 6.1 Carta de Aniversário Automática
**Descrição:** Sistema automatizado de envio de mensagens de aniversário para alunos cadastrados.
- Trigger: Data de nascimento do aluno
- Canal: WhatsApp/E-mail (integração futura)
- Template: Mensagem personalizada com dados do aluno e núcleo

**Benefícios:**
- Fortalecimento do vínculo emocional com as famílias
- Automação de comunicação repetitiva
- Registro de mensagens enviadas no histórico do aluno

---

### 6.2 Implementação de Novo Modelo Contratual
**Descrição:** Sistema de geração de contratos customizados para diferentes tipos de vínculo (CLT, PJ, MEI, Bolsista, Voluntário).
- Template dinâmico com campos variáveis
- Geração de PDF automático
- Assinatura digital (futuro)
- Controle de vigência com alertas de expiração

**Benefícios:**
- Padronização de documentos jurídicos
- Redução de erros em contratos manuais
- Controle centralizado de vigências
- Histórico de contratos por funcionário

---

## 7. Estimativa de Investimento

### Tempo de Desenvolvimento

| Período | Detail |
|---------|--------|
| **Duração** | 4 meses |
| **Carga Horária** | 5 horas/dia |
| **Total Estimado** | **~600 horas** |

### Estimate de Custo (Base: R$ 150,00/hora)

| Cenário | Valor |
|---------|-------|
| Mínimo (400h × R$150) | R$ 60.000,00 |
| **Estimado (600h × R$150)** | **R$ 90.000,00** |
| Máximo (800h × R$150) | R$ 120.000,00 |

> **Nota:** Esta estimativa considera desenvolvimento full-stack incluindo planejamento, implementação, testes e ajustes. Não inclui custos de infraestrutura (deploy Vercel) nem custos de API Gemini (cobrado separadamente por uso).

---

## 8. Resumo Executive

O WebApp **Formando Campeões** é um sistema completo de gestão esportiva com:

- **14 módulos de serviço** documentando alunos, documentos e evidências
- **Múltiplos núcleos** geograficamente distribuidos pelo Brasil
- **Geração automática de relatórios** em PDF
- **OCR + IA** para processamento de documentos
- **Interface administrativa** com mapa e dashboards
- **Acesso público** via link para pais/responsáveis

O sistema representa aproximadamente **600 horas de desenvolvimento** e um investimento estimado de **R$ 90.000,00** em desenvolvimento.

---

*Documento gerado em: Abril/2026*  
*Versão do Sistema: Demo (SKIN:DEMO)*