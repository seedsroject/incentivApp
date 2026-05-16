const fs = require('fs');
let file = fs.readFileSync('components/PesquisaReportBuilder.tsx', 'utf8');

file = file.replace(/AssiduidadeReportBuilderProps/g, 'PesquisaReportBuilderProps');
file = file.replace(/AssiduidadeReportBuilder/g, 'PesquisaReportBuilder');
file = file.replace(/ASSIDUIDADE E APROVEITAMENTO ESCOLAR/g, 'PESQUISA');
file = file.replace(/Assiduidade e Aproveitamento Escolar/g, 'Pesquisa');
file = file.replace(/Assiduidade e Aproveitamento/g, 'Pesquisa');

fs.writeFileSync('components/PesquisaReportBuilder.tsx', file);
console.log('Done replacing strings.');
