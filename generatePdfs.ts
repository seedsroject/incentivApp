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

export const generateQuantitativoPDF = (data: any) => {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Questionário Quantitativo</title>
<style>body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.6;margin:40px 50px;color:#111}
h1{text-align:center;font-size:16pt;margin-bottom:20px}
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
th { background: #f5f5f5; width: 70%; }
</style></head><body>
<h1>Questionário Quantitativo</h1>
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
