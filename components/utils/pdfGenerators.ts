export const generateSocioeconomicaPDF = (data: any, headerImage: string = '/header_full.png') => {
  const { nome, genero, faixa_etaria, ...otherData } = data;
  const sName = nome || 'Não informado';
  const sGender = genero || 'Não informado';
  const sAge = faixa_etaria || 'Não informado';

  const questions = [
    { id: 'cor_raca', label: 'Cor ou Raça do(a) atleta' },
    { id: 'deficiencia', label: 'O(a) atleta possui alguma deficiência?' },
    { id: 'responsavel_transporte', label: 'Quem é o responsável por levar o(a) atleta para os treinos?' },
    { id: 'meio_transporte', label: 'Qual o meio de transporte que o(a) atleta vai ao treino?' },
    { id: 'freq_atividade_anterior', label: 'Antes de conhecer o projeto, qual era a frequência de atividades físicas do(a) atleta?' },
    { id: 'matricula_escola', label: 'Atleta matriculado em:' },
    { id: 'detalhe_escola_particular', label: 'No caso de estar matriculado em escola particular:' },
    { id: 'escolaridade', label: 'Grau de escolaridade' },
    { id: 'periodo_estudo', label: 'Qual o período em que o(a) aluno(a) estuda na ESCOLA' },
    { id: 'area_residencia', label: 'Reside em área' },
    { id: 'tipo_moradia', label: 'Tipo de Moradia' },
    { id: 'num_pessoas_casa', label: 'Qual o número de pessoas que residem na casa?' },
    { id: 'renda_familiar', label: 'Qual a renda bruta familiar?' },
    { id: 'resp_nucleo_familiar', label: 'Responsável pelo núcleo familiar' },
    { id: 'beneficio_social', label: 'Recebem algum benefício social?' },
    { id: 'tipo_beneficio', label: 'Tipo de benefício social' },
    { id: 'sistema_saude', label: 'Qual o sistema de saúde utilizado?' },
    { id: 'acompanhamento_medico', label: 'Atleta realiza algum acompanhamento médico?' },
    { id: 'vacinas_completas', label: 'As vacinas estão completas para a faixa etária?' },
    { id: 'peso', label: 'Informe o PESO do(a) atleta (Kg)' },
    { id: 'altura', label: 'Informe a ALTURA do(a) atleta (m)' }
  ];

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Indicadores Socioeconômicos</title>
<style>
  body { font-family: Arial, sans-serif; color: #000; margin: 40px auto; max-width: 800px; padding: 20px; }
  .header-logos { text-align: center; margin-bottom: 20px; }
  .header-logos img { max-height: 60px; max-width: 100%; object-fit: contain; }
  h1 { text-align: center; font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; margin-top: 0; }
  h2 { text-align: center; font-size: 13px; font-weight: bold; color: #444; margin-top: 0; margin-bottom: 20px; text-transform: uppercase; }
  .header-line { border-top: 2px solid #000; margin-bottom: 20px; }
  
  .id-box { background-color: #f4f6f8; border: 1px solid #ced4da; border-radius: 4px; padding: 15px; margin-bottom: 30px; display: flex; }
  .id-col { flex: 1; }
  .id-label { font-size: 9px; font-weight: bold; color: #6c757d; text-transform: uppercase; display: block; margin-bottom: 4px; }
  .id-value { font-size: 14px; font-weight: bold; color: #000; display: block; }
  
  .grid { display: flex; flex-wrap: wrap; gap: 20px 40px; }
  .grid-item { width: calc(50% - 20px); border-bottom: 1px solid #e9ecef; padding-bottom: 8px; margin-bottom: 8px; }
  .item-label { font-size: 9px; font-weight: bold; color: #6c757d; text-transform: uppercase; display: block; margin-bottom: 4px; }
  .item-value { font-size: 12px; font-weight: bold; color: #000; display: block; }
  .item-value.empty { color: #adb5bd; font-style: italic; font-weight: normal; }
</style>
</head><body>
  <div class="header-logos">
    <img src="${headerImage}" alt="Logos" onerror="this.style.display='none';" />
  </div>
  <h1>INDICADORES SOCIOECONÔMICOS E DE SAÚDE</h1>
  <h2>ESCOLINHA DE TRIATHLON - NÚCLEO CAMPINAS</h2>
  
  <div class="header-line"></div>

  <div class="id-box">
    <div class="id-col" style="flex: 2;">
      <span class="id-label">NOME DO ATLETA</span>
      <span class="id-value">${sName}</span>
    </div>
    <div class="id-col">
      <span class="id-label">GÊNERO</span>
      <span class="id-value">${sGender}</span>
    </div>
    <div class="id-col">
      <span class="id-label">IDADE</span>
      <span class="id-value">${sAge}</span>
    </div>
  </div>

  <div class="grid">
    ${questions.map(q => {
      const val = otherData[q.id];
      const isMissing = !val || val.trim() === '';
      const displayVal = isMissing ? 'Não informado' : val;
      const valClass = isMissing ? 'item-value empty' : 'item-value';
      return `
      <div class="grid-item">
        <span class="item-label">${q.label}</span>
        <span class="${valClass}">${displayVal}</span>
      </div>
      `;
    }).join('')}
  </div>

  <div style="margin-top: 40px; text-align: center; font-size: 9px; color: #adb5bd; border-top: 1px solid #e9ecef; padding-top: 15px;">
    Documento gerado digitalmente via Sistema de Gestão Gov.br
  </div>

  <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); }</script>
</body></html>`;
  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
};

export const generateQuantitativoPDF = (data: any, headerImage: string = '/header_full.png') => {
  const { studentName, responsibleName, professorName, answers = {} } = data;
  const sName = studentName || data.nome || '';
  const rName = responsibleName || '';
  const pName = professorName || '';

  const questions = [
    { id: 'q1', target: 'ALUNO', text: 'O QUE VOCÊ ACHOU DAS ATIVIDADES ESPORTIVAS OFERECIDAS NO PROJETO "ESCOLINHA DE TRIATHLON"?' },
    { id: 'q2', target: 'SR(A). RESPONSÁVEL PELO ALUNO', text: 'VOCÊ PERCEBEU MELHORIA NA QUALIDADE DE VIDA/SAÚDE DA CRIANÇA/ADOLESCENTE DURANTE O PROJETO?' },
    { id: 'q3', target: 'SR(A). RESPONSÁVEL PELO ALUNO', text: 'VOCÊ PERCEBEU MELHORA NO DESEMPENHO ESCOLAR DA CRIANÇA/ADOLESCENTE DURANTE O PROJETO?' },
    { id: 'q4', target: 'PROFESSOR', text: 'VOCÊ PERCEBEU MELHORA NO CONVÍVIO SOCIAL DESTE ALUNO DURANTE O PROJETO?' }
  ];

  const renderOption = (opt: string, ans: string) => {
    const isSelected = opt === ans;
    const label = opt === 'MUITO_BOM' ? 'Muito Bom' : opt.charAt(0) + opt.slice(1).toLowerCase();
    return `<div style="margin-bottom: 6px;">
      <span style="font-family: monospace; font-weight: bold; font-size: 13px;">${isSelected ? '( x )' : '(  )'}</span>
      <span style="font-size: 13px; margin-left: 4px; ${isSelected ? 'font-weight: bold;' : ''}">${label}</span>
    </div>`;
  };

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Questionário de Meta Qualitativa</title>
<style>
  body { font-family: Arial, sans-serif; color: #000; margin: 40px auto; max-width: 800px; padding: 20px; }
  .header-logos { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 20px; }
  .header-logos img { max-height: 60px; max-width: 100%; object-fit: contain; }
  h1 { text-align: center; font-size: 16px; font-weight: bold; text-decoration: underline; text-underline-offset: 4px; margin-bottom: 5px; text-transform: uppercase; margin-top: 0; }
  h2 { text-align: center; font-size: 16px; font-weight: bold; margin-top: 0; margin-bottom: 30px; text-transform: uppercase; }
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 2px solid #000; }
  .info-table td { border: 1px solid #000; padding: 10px; font-size: 13px; text-transform: uppercase; }
  .info-table td.label { width: 40%; font-weight: bold; }
  .question { margin-bottom: 30px; font-size: 13px; font-weight: bold; text-transform: uppercase; line-height: 1.4; }
  .target { color: #d32f2f; }
  .options { margin-top: 12px; margin-left: 20px; font-weight: normal; text-transform: none; }
</style>
</head><body>
  <div class="header-logos">
    <img src="${headerImage}" alt="Logos" onerror="this.style.display='none';" />
  </div>
  <h1>QUESTIONÁRIO DE META QUALITATIVA</h1>
  <h2>ESCOLINHA DE TRIATHLON</h2>
  
  <table class="info-table">
    <tbody>
      <tr><td class="label">Nome completo do Aluno</td><td>${sName}</td></tr>
      <tr><td class="label">Nome do Responsável</td><td>${rName}</td></tr>
      <tr><td class="label">Nome do Professor</td><td>${pName}</td></tr>
    </tbody>
  </table>

  <div>
    ${questions.map((q, idx) => `
      <div class="question">
        ${idx + 1}. <span class="target">${q.target}</span>, ${q.text}
        <div class="options">
          ${['MUITO_BOM', 'BOM', 'REGULAR', 'RUIM'].map(opt => renderOption(opt, answers[q.id])).join('')}
        </div>
      </div>
    `).join('')}
  </div>

  <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); }</script>
</body></html>`;
  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
};
