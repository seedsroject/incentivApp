
import { GoogleGenAI, Type } from "@google/genai";
import { StudentDraft, SchoolReportItem, AttendanceReportItem, FrequencyListItem } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Helper para limpar base64 (Remove qualquer cabeçalho data:image/xxx;base64, ou data:application/pdf;base64,)
const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:[^;]+;base64,/, "");
};

// Helper para limpar resposta JSON (remove markdown code blocks e isola o objeto)
const cleanJsonText = (text: string) => {
  if (!text) return "{}";

  // Remove ```json e ``` se existirem
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

  // Tenta encontrar o bloco JSON puro se houver texto em volta
  const firstOpen = cleaned.indexOf('{');
  const lastClose = cleaned.lastIndexOf('}');

  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    cleaned = cleaned.substring(firstOpen, lastClose + 1);
  }

  return cleaned;
};

export const refineText = async (originalText: string, instruction: string): Promise<string> => {
  try {
    const model = "gemini-3-flash-preview";
    const prompt = `
      Você é um assistente de redação para relatórios oficiais do governo.
      Texto original: "${originalText}"
      
      Instrução do usuário: "${instruction}"
      
      Reescreva o texto seguindo a instrução. Mantenha um tom formal e objetivo.
      Retorne APENAS o texto reescrito, sem aspas ou explicações.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt
    });

    return response.text || originalText;
  } catch (error) {
    console.error("Erro ao refinar texto com IA:", error);
    return originalText;
  }
};

export const extractStudentData = async (base64Image: string, mimeType: string = "image/jpeg"): Promise<StudentDraft> => {
  try {
    const model = "gemini-2.5-flash";
    const data = cleanBase64(base64Image);

    const prompt = `
      Analise esta Ficha de Inscrição de projeto esportivo.
      Extraia os dados com a maior precisão possível:
      - Nome do Aluno
      - Data de Nascimento (formato DD/MM/AAAA)
      - RG ou CPF
      - Nome do Responsável
      - Endereço Completo (Rua, numero, cidade)
      - Telefone/Celular
      - Email
      - Nome da Escola onde estuda
      - Tipo de escola: Se identificar 'Pública' ou 'Particular' (School Type).
      
      Retorne strings vazias se não encontrar.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 4000,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nome: { type: Type.STRING },
            data_nascimento: { type: Type.STRING },
            rg_cpf: { type: Type.STRING },
            nome_responsavel: { type: Type.STRING },
            endereco: { type: Type.STRING },
            telefone: { type: Type.STRING },
            email_contato: { type: Type.STRING },
            escola_nome: { type: Type.STRING },
            escola_tipo: { type: Type.STRING, enum: ["PUBLICA", "PARTICULAR", ""] }
          },
          required: ["nome"]
        }
      }
    });

    const text = cleanJsonText(response.text || "");
    if (!text || text === "{}") throw new Error("Não foi possível extrair dados.");

    return JSON.parse(text) as StudentDraft;

  } catch (error) {
    console.error("Erro no OCR Gemini:", error);
    throw new Error("Falha ao processar imagem. Garanta que a foto esteja legível.");
  }
};

export const processSchoolReport = async (fileBase64: string, mimeType: string): Promise<Partial<SchoolReportItem>> => {
  try {
    const model = "gemini-2.5-flash";
    const data = cleanBase64(fileBase64);

    const prompt = `
      Analise este Boletim Escolar.
      O objetivo é comparar o desempenho no INÍCIO do ciclo com o FIM do ciclo apresentado neste documento.
      
      Parte 1: Extração Resumida (Global)
      1. Nome do Aluno.
      2. Aproveitamento 01: A média geral de notas do PRIMEIRO bimestre/trimestre disponível.
      3. Assiduidade 01: A porcentagem de frequência do PRIMEIRO bimestre/trimestre disponível (0 a 100).
      4. Aproveitamento 02: A média geral de notas do ÚLTIMO bimestre/trimestre disponível.
      5. Assiduidade 02: A porcentagem de frequência do ÚLTIMO bimestre/trimestre disponível (0 a 100).
      6. periodType: Baseado nos trimestres/bimestres avaliados, classifique como "PARCIAL" se houver apenas notas do 1º ou 2º período, ou "FINAL" se contiver notas de todos os períodos do ano (ex: 3º/4º bimestre ou 3º trimestre). Responda estritamente "PARCIAL" ou "FINAL".
      
      Parte 2: Detalhamento por Disciplina (Subjects)
      Extraia a lista de todas as disciplinas listadas. Para cada disciplina, extraia a nota numérica de cada Bimestre (1º, 2º, 3º, 4º) nas propriedades b1, b2, b3 e b4.
      MUITO IMPORTANTE: Você OBRIGATORIAMENTE deve rastrear e extrair a quantidade de FALTAS numéricas de cada disciplina por bimestre em f1, f2, f3 e f4. O boletim frequentemente possui uma coluna "Faltas" ou "F" ao lado da "Nota" de cada bimestre.
      Se não houver nota para um bimestre, retorne null. Da mesma forma para as faltas, se o campo for vazio, retorne null. Se houver o número 0 (zero faltas), retorne 0 numérico inteiro.

      Se as notas estiverem em formato de conceitos ou letras, você OBRIGATORIAMENTE deve convertê-las para números usando a seguinte tabela de equivalência exata:
      - A, Excelente, Plenamente satisfatório = 10.00
      - Aprovado médio superior = 9.00
      - A- ou B+, Ótimo, Muito bom = 8.75
      - Aprovado médio inferior = 8.00
      - B, Bom, Significativo, Aprovado, Atingiu os objetivos = 7.50
      - C+ ou B-, Regular para bom = 6.25
      - C, Satisfatório, Regular, Suficiente = 5.00
      - C- ou D+, Promovido parcialmente, Aprovado com dependência = 3.75
      - D, Sofrível, Necessita de intervenção = 2.50
      - D- ou E+ = 1.25
      - E, Não satisfatório, Insatisfatório, Reprovado, Não promovido, Progressão não avaliada = 0.00
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8000,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentName: { type: Type.STRING },
            grade1: { type: Type.NUMBER },
            attendance1: { type: Type.NUMBER },
            grade2: { type: Type.NUMBER },
            attendance2: { type: Type.NUMBER },
            periodType: { type: Type.STRING },
            subjects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  discipline: { type: Type.STRING },
                  b1: { type: Type.NUMBER, nullable: true },
                  b2: { type: Type.NUMBER, nullable: true },
                  b3: { type: Type.NUMBER, nullable: true },
                  b4: { type: Type.NUMBER, nullable: true },
                  f1: { type: Type.NUMBER, nullable: true },
                  f2: { type: Type.NUMBER, nullable: true },
                  f3: { type: Type.NUMBER, nullable: true },
                  f4: { type: Type.NUMBER, nullable: true }
                }
              }
            }
          }
        }
      }
    });

    const text = cleanJsonText(response.text || "");
    if (!text || text === "{}") throw new Error("Falha na extração");
    return JSON.parse(text);

  } catch (error) {
    console.error("Erro OCR Boletim:", error);
    return { studentName: "Não identificado", grade1: 0, attendance1: 0, grade2: 0, attendance2: 0, periodType: 'PARCIAL' };
  }
};

export const processAttendanceReport = async (fileBase64: string, mimeType: string): Promise<Partial<AttendanceReportItem>> => {
  try {
    const model = "gemini-2.5-flash";
    const data = cleanBase64(fileBase64);

    const prompt = `
      Analise este documento escolar (Boletim ou Relatório de Assiduidade).
      
      Parte 1: Extração Resumida (Global)
      - Nome do Aluno.
      - Grade1: Nota média geral do início do período.
      - Attendance1: % Presença início.
      - Grade2: Nota média geral final do período.
      - Attendance2: % Presença final.
      - periodType: Baseado nos períodos avaliados (bimestres ou semestres), classifique como "PARCIAL" se as notas não cobrirem o fim do ano (ex: apenas 1º e 2º bimestre), ou "FINAL" se contiver notas finais de todos os períodos. Responda estritamente "PARCIAL" ou "FINAL".
      
      Parte 2: Detalhamento por Disciplina (Subjects)
      Extraia a lista de todas as disciplinas listadas. Para cada disciplina, extraia a nota numérica de cada Bimestre (1º, 2º, 3º, 4º) nas propriedades b1, b2, b3 e b4.
      MUITO IMPORTANTE: Você OBRIGATORIAMENTE deve rastrear e extrair a quantidade de FALTAS numéricas de cada disciplina por bimestre em f1, f2, f3 e f4. O documento frequentemente possui uma coluna "Faltas" ou "F" ao lado da "Nota".
      Se não houver nota para um bimestre específico, retorne null. Da mesma forma para as faltas, se o campo for vazio, retorne null. Se houver 0 faltas, retorne o número 0.
      Se as notas estiverem em formato de conceitos ou letras, você OBRIGATORIAMENTE deve convertê-las para números usando a seguinte tabela de equivalência exata:
      - A, Excelente, Plenamente satisfatório = 10.00
      - Aprovado médio superior = 9.00
      - A- ou B+, Ótimo, Muito bom = 8.75
      - Aprovado médio inferior = 8.00
      - B, Bom, Significativo, Aprovado, Atingiu os objetivos = 7.50
      - C+ ou B-, Regular para bom = 6.25
      - C, Satisfatório, Regular, Suficiente = 5.00
      - C- ou D+, Promovido parcialmente, Aprovado com dependência = 3.75
      - D, Sofrível, Necessita de intervenção = 2.50
      - D- ou E+ = 1.25
      - E, Não satisfatório, Insatisfatório, Reprovado, Não promovido, Progressão não avaliada = 0.00
      
      
      Exemplo de output subjects: [{ discipline: "Matemática", b1: 8.5, f1: 2, b2: 9.0, f2: 0, b3: null, f3: null, b4: null, f4: null }, ...]
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8000,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentName: { type: Type.STRING },
            grade1: { type: Type.NUMBER },
            attendance1: { type: Type.NUMBER },
            grade2: { type: Type.NUMBER },
            attendance2: { type: Type.NUMBER },
            periodType: { type: Type.STRING },
            subjects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  discipline: { type: Type.STRING },
                  b1: { type: Type.NUMBER, nullable: true },
                  b2: { type: Type.NUMBER, nullable: true },
                  b3: { type: Type.NUMBER, nullable: true },
                  b4: { type: Type.NUMBER, nullable: true },
                  f1: { type: Type.NUMBER, nullable: true },
                  f2: { type: Type.NUMBER, nullable: true },
                  f3: { type: Type.NUMBER, nullable: true },
                  f4: { type: Type.NUMBER, nullable: true }
                }
              }
            }
          }
        }
      }
    });

    const text = cleanJsonText(response.text || "");
    if (!text || text === "{}") throw new Error("Falha na extração de assiduidade");
    return JSON.parse(text);

  } catch (error) {
    console.error("Erro OCR Assiduidade:", error);
    return { studentName: "Não identificado", grade1: 0, attendance1: 0, grade2: 0, attendance2: 0, periodType: 'PARCIAL', subjects: [] };
  }
};

export const processFrequencyList = async (fileBase64: string, mimeType: string): Promise<Partial<FrequencyListItem>> => {
  try {
    const model = "gemini-2.5-flash";
    const data = cleanBase64(fileBase64);

    const prompt = `
      Analise esta Lista de Presença Física/Manual.
      A lista deve conter nomes de alunos e marcações de presença (X, P, ou vistos) em dias do mês.
      
      Extraia:
      1. Nome do Aluno (studentName).
      2. Mês de Referência (month): Ex: "Março", "03/2024". Se não houver, tente identificar pela data.
      3. Total de Presenças (totalPresences): Conte quantas marcações de presença este aluno possui na linha.
      
      Se a imagem estiver cortada e só aparecer uma linha, extraia os dados dessa linha.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 4000,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentName: { type: Type.STRING },
            month: { type: Type.STRING },
            totalPresences: { type: Type.NUMBER }
          }
        }
      }
    });

    const text = cleanJsonText(response.text || "");
    if (!text || text === "{}") throw new Error("Falha na extração da lista de frequência");
    return JSON.parse(text);

  } catch (error) {
    console.error("Erro OCR Lista Frequencia:", error);
    return { studentName: "Não identificado", month: "-", totalPresences: 0 };
  }
};

export const extractContractData = async (base64Image: string, mimeType: string = "image/jpeg"): Promise<any> => {
  try {
    const model = "gemini-2.5-flash";
    const data = cleanBase64(base64Image);

    const prompt = `
      Analise este Contrato de Trabalho ou Prestação de Serviços assinado.
      Extraia os seguintes dados das partes envolvidas (Contratante e Contratado):
      
      - Nome do Contratado (Employee Name)
      - CPF do Contratado
      - Cargo / Função
      - Data de Início
      - Data de Fim (ou Vigência)
      - Valor do Contrato (Salário/Bolsa)
      - Tipo de Contrato (CLT, PJ, MEI, Voluntário, Bolsista)
      
      Retorne JSON.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 2000,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            documentCpf: { type: Type.STRING },
            role: { type: Type.STRING },
            startDate: { type: Type.STRING },
            endDate: { type: Type.STRING },
            contractType: { type: Type.STRING },
            contractValue: { type: Type.STRING }
          }
        }
      }
    });

    const text = cleanJsonText(response.text || "");
    if (!text || text === "{}") throw new Error("Não foi possível extrair dados do contrato.");

    return JSON.parse(text);

  } catch (error) {
    console.error("Erro OCR Contrato:", error);
    throw new Error("Falha ao ler contrato.");
  }
};

export const generateContractText = async (data: any): Promise<{ text: string, usage?: any }> => {
  // 1. Definição das Cláusulas Específicas por Cargo
  const clauses: { [key: string]: string } = {
    'COORDENADOR': "Prestação de serviços de coordenação técnica e gestão de projetos na área de {{AREA_ATUACAO}}. As entregas consistem em: elaboração de cronogramas, validação de processos, supervisão de entregáveis da equipe terceirizada, planejamento estratégico do setor e apresentação de relatórios de desempenho mensal. A CONTRATADA possui autonomia para definir as metodologias de gestão aplicadas.",
    'MONITOR': "Prestação de serviços de monitoria e suporte operacional em {{AREA_ATUACAO}}. As atividades englobam: acompanhamento das atividades dos usuários/alunos, esclarecimento de dúvidas pontuais, organização de ambientes (físicos ou virtuais) de aprendizagem e reporte de incidentes à coordenação. O foco da prestação é a manutenção da fluidez das atividades programadas.",
    'PROFESSOR': "Prestação de serviços educacionais especializados para ministração de aulas/conteúdos sobre {{DISCIPLINA}}. O escopo inclui: preparação de material didático autoral, condução das explanações técnicas, aplicação de métodos avaliativos de aprendizado e entrega de pautas de frequência e notas. A CONTRATADA possui liberdade de cátedra para definir a melhor didática a ser aplicada.",
    'ADMINISTRATIVO': "Prestação de serviços de suporte administrativo e back-office. As entregas compreendem: organização de arquivos digitais e físicos, gestão de fluxo de contas a pagar e receber, elaboração de planilhas de controle, atendimento a fornecedores e suporte logístico às operações da CONTRATANTE. Os serviços serão medidos por entregas de tarefas e processos finalizados.",
    'PSICOLOGO': "Prestação de serviços de psicologia organizacional/clínica (conforme o caso). O escopo abrange: realização de triagens, acolhimento técnico, elaboração de pareceres psicológicos, condução de dinâmicas de grupo e suporte à saúde mental no ambiente corporativo/escolar. A atuação respeitará rigorosamente o Código de Ética Profissional do Psicólogo, com total autonomia técnica sobre as intervenções realizadas.",
    'ASSISTENTE_SOCIAL': "Prestação de serviços de Serviço Social. As atividades incluem: elaboração de diagnósticos sociais, acompanhamento de casos, visitas técnicas (se necessário), articulação com a rede de proteção social e emissão de relatórios sociais. A atuação da CONTRATADA pauta-se pela autonomia técnica garantida pela Lei de Regulamentação da Profissão, visando a garantia de direitos do público-alvo."
  };

  // Seleciona a cláusula baseada no cargo ou usa uma genérica
  const roleKey = Object.keys(clauses).find(k => data.role?.toUpperCase().includes(k)) || 'GENERICO';
  const specificClause = clauses[roleKey] || "Prestação de serviços profissionais na área de competência da CONTRATADA, com autonomia técnica e operacional.";

  // Formatações opcionais para evitar undefined
  const repText = data.nucleoRepName
    ? `neste ato representada por ${data.nucleoRepName}, ${data.nucleoRepNacionalidade || ''}, ${data.nucleoRepEstCivil || ''}, ${data.nucleoRepProfissao || 'Representante Legal'}, portador(a) do CPF nº ${data.nucleoRepCPF || '...'} e RG nº ${data.nucleoRepRG || '...'}`
    : 'neste ato representada na forma de seu Contrato Social';

  const employeeDetails = `${data.employeeNacionalidade || 'Brasileiro(a)'}, ${data.employeeEstadoCivil || ''}, ${data.employeeProfissao || data.role || 'Profissional'}`;

  // 2. Modelo Mestre (Template)
  const masterTemplate = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS TÉCNICOS PROFISSIONAIS

DAS PARTES:

CONTRATANTE: ${data.nucleoMatrixName || data.nucleoName}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${data.nucleoCnpj || 'CNPJ NÃO INFORMADO'}, com sede em ${data.nucleoAddress || data.nucleoCity || 'ENDEREÇO NÃO INFORMADO'}, ${repText}.

CONTRATADA: ${data.employeeName}, ${employeeDetails}, inscrito(a) no CPF sob o nº ${data.employeeCpf || '...'} e no RG nº ${data.employeeRG || '...'}, residente e domiciliado(a) em ${data.employeeAddress || '...'}, CEP: ....

Resolvem celebrar o presente Contrato mediante as seguintes cláusulas:

CLÁUSULA PRIMEIRA – DO OBJETO
1.1. O presente contrato tem por objeto a prestação de serviços de ${data.role}, consistindo especificamente nas seguintes atividades:
"${specificClause}"
1.2. Os serviços serão prestados com total autonomia técnica e operacional pela CONTRATADA, sem subordinação jurídica ou hierárquica à CONTRATANTE.

CLÁUSULA SEGUNDA – DAS OBRIGAÇÕES DA CONTRATADA
2.1. Executar os serviços contratados com zelo, diligência e técnica adequada.
2.2. Emitir as respectivas Notas Fiscais para fins de pagamento (se aplicável) ou Recibo de Pagamento Autônomo (RPA).
2.3. Manter a confidencialidade de todas as informações da CONTRATANTE a que tiver acesso.
2.4. A CONTRATADA declara estar regular perante seu órgão de classe (se aplicável) e apta legalmente para exercer a função.

CLÁUSULA TERCEIRA – DO PREÇO E PAGAMENTO
3.1. Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor mensal bruto de R$ ${data.contractValue || '.......'} (valor por extenso).
3.2. O pagamento será efetuado mensalmente, até o dia ${data.paymentDay || '05'} do mês subsequente ao da prestação dos serviços, mediante apresentação de Nota Fiscal ou Recibo emitida até 5 dias antes.

CLÁUSULA QUARTA – DA AUSÊNCIA DE VÍNCULO EMPREGATÍCIO
4.1. As partes declaram que este contrato é de natureza civil/empresarial. Não há entre as partes vínculo empregatício, não se aplicando as disposições da Consolidação das Leis do Trabalho (CLT), ausentes os requisitos de subordinação, horário controlado e pessoalidade (a CONTRATADA poderá fazer-se substituir por sócio ou preposto, desde que com qualificação equivalente, mediante aviso prévio).

CLÁUSULA QUINTA – DA VIGÊNCIA E RESCISÃO
5.1. O contrato terá vigência de ${data.startDate} até ${data.endDate}.
5.2. Poderá ser rescindido por qualquer das partes, mediante aviso prévio por escrito de 30 (trinta) dias.

CLÁUSULA SEXTA – DA PROTEÇÃO DE DADOS (LGPD)
6.1. As partes comprometem-se a tratar dados pessoais envolvidos neste contrato em estrita observância à Lei 13.709/2018 (LGPD).

CLÁUSULA SÉTIMA – DO FORO
7.1. Fica eleito o foro da Comarca de ${data.nucleoCity || '...'} para dirimir quaisquer dúvidas oriundas deste contrato.
  `;

  try {
    const model = "gemini-2.5-flash";

    // 3. Prompt para Refinamento com IA
    const prompt = `
      Você é um especialista jurídico em contratos de prestação de serviços.
      
      Abaixo está um RASCUNHO completo de um contrato já preenchido com dados.
      Sua tarefa é REVISAR e FINALIZAR este contrato.
      
      Diretrizes:
      1. Substitua quaisquer placeholders restantes (ex: {{AREA_ATUACAO}}, {{DISCIPLINA}}) pelo contexto do cargo: ${data.role}.
      2. Mantenha os dados preenchidos (Nomes, CPFs, Valores, Datas) exatamente como estão no rascunho.
      3. Se a "CONTRATADA" for tratada no masculino no rascunho, ajuste a concordância gramatical do texto se necessário.
      4. Mantenha a CLÁUSULA QUARTA (Ausência de Vínculo) intacta.
      5. Retorne o texto final formatado em Markdown limpo (sem tags de código) e DEIXE APENAS TITULOS E ITENS DESTACADOS EM NEGRITO.
      
      RASCUNHO BASE:
      """
      ${masterTemplate}
      """
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt
    });

    const aiText = response.text;
    const usage = response.usageMetadata; // Capture usage

    if (!aiText) return { text: masterTemplate, usage };

    // Remove markdown quote usually returned by AI
    const cleanedText = aiText.replace(/```markdown/g, '').replace(/```/g, '').trim();

    return { text: cleanedText, usage };

  } catch (error) {
    console.error("Erro Gerar Contrato (IA), usando template padrão:", error);
    // Fallback: Retorna o template preenchido se a IA falhar
    return { text: masterTemplate };
  }
};
