
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

  // 2. Modelo Mestre (Template baseado no documento fornecido)
  const masterTemplate = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS TÉCNICOS PROFISSIONAIS

DAS PARTES:

CONTRATANTE: ${data.nucleoMatrixName || data.nucleoName}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${data.nucleoCnpj || 'CNPJ NÃO INFORMADO'}, com sede em ${data.nucleoAddress || data.nucleoCity || 'ENDEREÇO NÃO INFORMADO'}, ${repText}.

CONTRATADA: ${data.employeeName}, ${employeeDetails}, inscrito(a) no CPF sob o nº ${data.employeeCpf || '...'} e no RG nº ${data.employeeRG || '...'}, residente e domiciliado(a) em ${data.employeeAddress || '...'}, CEP: ....

As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.

**“DO OBJETO DO CONTRATO”**
O presente instrumento tem por objeto a prestação de serviços como ${data.role}, atuando especificamente com as seguintes atividades:
"${specificClause}"
A prestação de serviço não gera qualquer vínculo empregatício entre as partes, uma vez que a atividade não é essencial para o funcionamento da empresa contratante, e a prestadora realizará as atividades com liberdade de horário, respondendo somente pelas atividades combinadas.

**“DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO”**
A CONTRATADA receberá, a título de prestação de serviço o valor bruto de R$ ${data.contractValue || '.......'} mensais.
O pagamento será realizado no dia ${data.paymentDay || '05'} do mês subsequente ao trabalhado.
O pagamento só poderá ser liberado mediante a nota fiscal da prestação de serviço, bem como poderá ser solicitado apresentação de recibo, das certidões de tributos municipais, certidão de tributos estaduais, certidão da dívida ativa da união, certificado de regularidade do FGTS e certidão da Justiça do Trabalho.

**“DA FORMA DE PAGAMENTO”**
A CONTRATANTE pagará a CONTRATADA os valores, conforme condições estabelecidas mediante Transferência Bancária.

**“DA RESCISÃO”**
O presente contrato poderá ser rescindido, sem qualquer indenização, bastando simples notificação por escrito com antecedência mínima de 10 (dez) dias, ou nos casos de descumprimento de qualquer cláusula ora avençada, o que se dará de forma imediata, mediante notificação por escrito;
O presente contrato poderá ainda ser rescindido por razões de força maior, caso fortuito, fato príncipe, falência, recuperação judicial ou extrajudicial de uma das partes, interdição de estabelecimento, revogação ou suspensão das licenças de funcionamento de qualquer das partes pelas autoridades que possam impedir o exercício legal da atividade objeto do presente contrato;
O contrato poderá ainda ser rescindido sem nenhuma indenização e independentemente de notificação nos seguintes casos:
- Prestação de serviço inadequada, sem planejamento;
- Na ausência imotivada no momento da prestação de serviços;
- Postura inadequada na prestação de serviços.

**“EQUIPAMENTOS”**
A CONTRATANTE fornecerá os materiais esportivos necessários a prestação de serviços da CONTRATADA, que deverá devolvê-los ao final do contrato;
Todos os materiais esportivos necessários para a prestação dos serviços serão de responsabilidade exclusiva da CONTRATADA, que deverá utilizá-los com zelo. No momento da reposição do material, a CONTRATADA deverá apresentar o material antigo.

**“DAS OBRIGAÇÕES DA CONTRATANTE”**
- Efetuar os pagamentos devidos à CONTRATADA rigorosamente nos prazos estabelecidos;
- Comunicar a CONTRATADA qualquer irregularidade que venha a constatar, tanto na execução dos serviços como no recebimento das notas e cobranças emitidas, de modo a viabilizar a correção necessária no menor tempo possível;
- Fornecer à CONTRATADA todas as informações necessárias, inclusive material esportivo à realização dos serviços, devendo especificar os detalhes necessários à perfeita consecução dos mesmos e a forma como eles deverão ser entregues;
- Fornecer informações e/ou dados necessários para que a CONTRATADA possa cumprir o objeto deste instrumento em tempo hábil.

**“DAS OBRIGAÇÕES DA CONTRATADA”**
- Assumir todos os encargos trabalhistas, civis, previdenciários e securitários relativos aos seus empregados, prepostos ou sócios, que estejam prestando serviço na CONTRATANTE, inclusive salários, indenização, aviso prévio, 13º salário, FGTS, seguros e outros, sem qualquer ônus para a CONTRATANTE;
- Obedecer a todas as leis, normas, e regulamentos federais, estaduais e municipais relacionados com o trabalho executado;
- Fornecer a atividade com qualidade, com planejamento, dentro dos padrões técnicos de qualidade, que totalizam a carga horária de prestação de serviços;
- Se responsabilizar pela guarda e manutenção dos materiais objeto desta prestação de serviço que lhe forem entregues ou fornecidos pela própria CONTRATANTE;
- Disponibilizar profissionais e/ou colaboradores identificados e qualificados para execução do objeto deste instrumento, de forma a não deixar os núcleos esportivos sem assistência, sob pena de arcar com os prejuízos causados ou sofrer descontos no valor da prestação de serviços;
- Responsabilizar-se pelos danos e/ou prejuízos que seus profissionais e/ou colaboradores que vierem a causar à CONTRATANTE por imprudência, imperícia ou negligência;
- Executar suas obrigações sem vícios, garantindo o devido cumprimento de suas obrigações, nos estritos termos do Contrato e normas em vigor, cumprindo todos os prazos e/ou datas acordadas por escrito com a Contratante para realização de etapas, fases e entregas dos Serviços;
- Abster-se de praticar quaisquer atos que possam interferir negativamente na imagem da CONTRATANTE, responsabilizando-se integralmente pelas consequências de qualquer eventual descumprimento;
- Arcar com todos os tributos de sua responsabilidade que incidam ou venham a incidir sobre o objeto deste Contrato, conforme o disposto na legislação aplicável sejam eles de natureza federal, estadual e/ou municipal, responsabilizando-se, inclusive, pelas infrações a que der causa em virtude da não observância do disposto nesta cláusula;
- Fica expressamente estipulado que não se estabelece, por força desta contratação, qualquer vínculo empregatício ou de responsabilidade, mesmo por salário, por parte da CONTRATANTE em relação aos empregados que a CONTRATADA empregar diretamente ou indiretamente, para a execução dos serviços ora ajustados, correndo por conta exclusiva da CONTRATADA todas as despesas com esse pessoal, inclusive encargos de legislação trabalhista, previdenciária, securitária ou qualquer outra, obrigando-se a Contratada ao cumprimento das disposições legais, quer seja quanto à remuneração de seus empregados, quer seja quanto aos demais encargos de qualquer natureza, em especial aqueles referentes a acidente de trabalho;
- O representante legal da empresa deverá providenciar substituto em caso de ausência do titular.

**“VIGÊNCIA”**
O contrato terá vigência de ${data.startDate} até ${data.endDate}.

**“DISPOSIÇÕES GERAIS”**
O presente instrumento constitui título executivo extrajudicial, nos termos do artigo 784 do Código de Processo Civil/15.
Em qualquer hipótese, será sempre a CONTRATADA responsável por todos os serviços prestados e por todas as obrigações assumidas no presente instrumento.
O presente contrato contém o acordo integral estabelecido entre as partes com relação ao objeto deste instrumento. Quaisquer documentos, compromissos e avenças anteriores, orais, escritos ou de outra forma estabelecidos entre as partes e referentes ao objeto deste pacto serão considerados cancelados e não afetarão ou modificarão quaisquer termos ou obrigações.
Qualquer alteração ou notificação entre as partes só será válida se prévia e expressamente acordado por escrito entre as partes.
A rescisão do presente contrato não libera as partes das obrigações devidas até a data da rescisão, que não afetará ou limitará qualquer direito, que expressamente ou por sua natureza, deva permanecer em vigor após a rescisão do presente contrato ou que decorra de tal rescisão.
Qualquer postergação no exercício de direito ou prerrogativa prevista neste contrato significará mera liberalidade e não novação. A tolerância, a inércia ou a demora, de qualquer das partes no exercício de quaisquer direitos e atribuições ou na obtenção de qualquer reparação, conforme previsto no presente contrato, não impedirão o exercício de quaisquer direitos e não constituirão a renúncia por tal PARTE ao seu direito de exercê-lo a qualquer tempo.
A tolerância, por uma das Partes, à infração das Cláusulas e disposições contidas neste Contrato, bem como a prática de quaisquer atos ou procedimentos não previstos de forma expressa neste Contrato, será considerada mera liberalidade, não se configurando como precedente ou novação contratual.

**“FORO”**
As partes elegem o Foro da cidade de ${data.nucleoCity || '...'}, para dirimir quaisquer dúvidas ou litígios relacionados a este contrato, renunciando a qualquer outro por mais privilegiado que seja. O presente contrato obriga as partes e sucessoras, a cumprirem e a fazerem cumprir, a qualquer tempo, as cláusulas ora pactuadas.

E por estarem justas e contratadas, firmam o presente instrumento.
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

// ─── FREQUÊNCIA REPORT: AI ANALYSIS GENERATOR ───
export const generateFrequencyReportAnalysis = async (
  reportData: {
    cityLabel: string;
    period: string;
    totalStudents: number;
    avgFreqPct: number;
    avgFaltaPct: number;
    monthlyTrends: { month: string; freq: number; faltas: number }[];
    totalDays: number;
  }
): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";

    const dataPayload = JSON.stringify({
      cidade: reportData.cityLabel,
      periodo: reportData.period,
      total_alunos: reportData.totalStudents,
      media_frequencia_pct: reportData.avgFreqPct,
      media_faltas_pct: reportData.avgFaltaPct,
      total_dias_aula: reportData.totalDays,
      tendencias_mensais: reportData.monthlyTrends
    }, null, 2);

    const prompt = `Você é um analista técnico especializado em projetos esportivos sociais do governo brasileiro, especificamente da Lei de Incentivo ao Esporte.

Baseado nos dados quantitativos de frequência abaixo, escreva um RESUMO EXECUTIVO formal (4-5 parágrafos) para o "Anexo da Meta Quantitativa 01 — Lista de Frequência" do projeto Escolinha de Triathlon.

DADOS DO RELATÓRIO:
${dataPayload}

O resumo deve:
1. Apresentar o contexto do relatório (monitoramento de participação ao longo do período)
2. Analisar o desempenho geral de frequência em comparação com a meta de 70%
3. Identificar tendências mensais (meses com maior/menor frequência)
4. Destacar que o indicador utilizado é a "Lista de Presença" com marcação "PP" (Presença Participativa)
5. Concluir com avaliação do cumprimento da meta e impacto social

Formato: Texto formal, objetivo, em português brasileiro. Sem markdown, sem bullets, apenas parágrafos contínuos.
No final, adicione "Palavras-chave:" com 3 termos relevantes.

RETORNE APENAS O TEXTO, sem aspas nem explicações adicionais.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt
    });

    return response.text || 'Erro ao gerar texto. Por favor, tente novamente.';
  } catch (error) {
    console.error("Erro ao gerar análise de frequência com IA:", error);
    throw error;
  }
};
