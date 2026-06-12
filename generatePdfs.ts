export const generateSocioeconomicaPDF = (data: any) => {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pesquisa Socioeconômica - ${data.nome || 'Aluno'}</title>
<style>body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.6;margin:40px 50px;color:#111}
h1{text-align:center;font-size:16pt;margin-bottom:20px}
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
th { background: #f5f5f5; width: 40%; }
</style></head><body>
<h1>Pesquisa Socioeconômica</h1>
<table>
  <tbody>
    ${Object.entries(data).filter(([k]) => k !== 'isScan' && k !== 'url').map(([key, val]) => `<tr><th>${key.replace(/_/g, ' ').toUpperCase()}</th><td>${val || '-'}</td></tr>`).join('')}
  </tbody>
</table>
<script>window.onload = () => { setTimeout(() => { window.print(); }, 500); }</script>
</body></html>`;
  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
};

export const generateQuantitativoPDF = (data: any, headerImage: string = '', returnHtml: boolean = false) => {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Questionário Quantitativo</title>
<style>body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.6;margin:40px 50px;color:#111}
h1{text-align:center;font-size:16pt;margin-bottom:20px}
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
th { background: #f5f5f5; width: 70%; }
</style></head><body>
${headerImage ? `<div style="text-align:center;margin-bottom:20px"><img src="${headerImage}" style="max-height:80px;max-width:100%" /></div>` : ''}
<h1>Questionário Quantitativo</h1>
<table>
  <tbody>
    ${Object.entries(data).filter(([k]) => k !== 'isScan' && k !== 'url' && k !== 'nome').map(([key, val]) => `<tr><th>${key.replace(/_/g, ' ').toUpperCase()}</th><td>${val || '-'}</td></tr>`).join('')}
  </tbody>
</table>
<script>window.onload = () => { setTimeout(() => { window.print(); }, 500); }</script>
</body></html>`;
  const htmlClean = html.replace(/<script>.*?<\/script>/gs, '').replace(/setTimeout.*?;/gs, '');
  if (returnHtml) return htmlClean;
  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
  return htmlClean;
};

export const generateDeclaracaoRelatorioUnicoPDF = (student: any, headerImage: string = '', returnHtml: boolean = false): string => {
  const dataHoje = new Date();
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const dataFormatada = `Curitiba, ${dataHoje.getDate().toString().padStart(2, '0')} de ${meses[dataHoje.getMonth()]} de ${dataHoje.getFullYear()}.`;

  const projetoNome = student.projectId === 'DANIEL_DIAS' ? 'Nadando com Daniel Dias' 
                    : student.projectId === 'FUTEBOL' ? 'Meninas do Futebol' 
                    : 'Formando Campeões'; // Triathlon ou padrão

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Declaração - ${student.nome}</title>
<style>
  body { font-family: 'Times New Roman', Times, serif; font-size: 14pt; line-height: 1.8; margin: 60px 80px; color: #000; text-align: justify; }
  .header-logos { text-align: center; margin-bottom: 60px; }
  .header-logos img { max-height: 100px; max-width: 100%; object-fit: contain; }
  h1 { text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 50px; margin-top: 0; }
  .signature { text-align: center; margin-top: 100px; line-height: 1.4; }
  .date { text-align: right; margin-top: 60px; margin-bottom: 60px; }
</style></head><body>
  ${headerImage ? `<div class="header-logos"><img src="${headerImage}" alt="Logos" onerror="this.style.display='none';" /></div>` : ''}
  
  <h1>DECLARAÇÃO</h1>
  
  <p>
    Declaramos para os devidos fins, que o aluno(a) ${student.nome || ''}, inscrito no CPF/RG n° ${student.rg_cpf || ''}, está regularmente matriculado no projeto ${projetoNome}, no período das ${student.turma_horario || '___ ás ___'}, nas terças e quintas-feiras.
  </p>
  
  ${student.pne_necessita_supervisao ? `
  <p>
    Declaramos ainda que o aluno necessita de acompanhamento de sua mãe ${student.pne_supervisor_nome || student.nome_responsavel || ''} CPF: ${student.pne_supervisor_cpf || ''}, durante todo o periodo das atividades, devido ás sua necessidades de apoio e supervisão.
  </p>
  ` : ''}
  
  <p style="margin-top: 40px;">
    Por ser expressão da verdade, assino a presente
  </p>
  
  <div class="date">${dataFormatada}</div>
  
  <div class="signature">
    Inayara Michele Xavier<br>
    Cref 050083- G/PR
  </div>

  <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); }</script>
</body></html>`;

  const htmlClean = html.replace(/<script>.*?<\/script>/gs, '').replace(/setTimeout.*?;/gs, '');
  if (returnHtml) return htmlClean;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  return htmlClean;
};

