import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Nucleo, ProjectId } from '../types';

interface ContractGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Partial<Employee>;
    nucleo: Nucleo;
    onSave?: (contractUrl: string) => void;
    projectId?: ProjectId;
}

export const ContractGenerationModal: React.FC<ContractGenerationModalProps> = ({ isOpen, onClose, employee, nucleo, onSave, projectId }) => {
    // Project-aware assets
    const projectAssets = useMemo(() => {
        if (projectId === 'DANIEL_DIAS') return { name: 'Instituto Daniel Dias', header: '/Banner_Relatorio_Daniel.png' };
        if (projectId === 'FUTEBOL') return { name: 'Instituto Escolinha de Futebol', header: '/Banner_relatorio_futebol.png' };
        return { name: 'Instituto Escolinha de Triathlon', header: '/header_full.png' };
    }, [projectId]);
    // Contract State
    const [contractText, setContractText] = useState('');
    const [isLoading] = useState(false);

    // Missing/Editable Data State
    const [additionalData, setAdditionalData] = useState({
        // Contratante (Instituto)
        contratanteRazaoSocial: nucleo.razaoSocial || 'Instituto Escolinha de Triathlon',
        contratanteCnpj: nucleo.cnpj || '41.332.163/0001-59',
        contratanteAddress: nucleo.address || 'Rua Al. Doutor Carlos de Carvalho, nº 68, sala 102, CEP: 80.410-180, Centro, Curitiba-PR',
        contratanteCity: (() => {
            if (nucleo.city) return nucleo.city;
            const parts = nucleo.nome.split('|');
            if (parts.length >= 2) {
                const city = parts[0].trim();
                const state = parts[1].trim().split(/[\s-]/)[0].trim();
                return `${city}/${state}`;
            }
            return nucleo.nome.split(' - ')[0] || 'Curitiba-PR';
        })(),

        // Contratada (Empresa prestadora)
        contratadaRazaoSocial: '',
        contratadaCnpj: '',
        contratadaAddress: '',
        contratadaRepName: '',
        contratadaRepCPF: '',

        // Objeto do Contrato
        cargoFuncao: employee.role || 'ASSISTENTE SOCIAL',
        termoCompromisso: '',
        processo: '',
        sli: '',
        nomeProjetoContrato: '',

        // Vigência
        startDate: employee.contract?.startDate ? new Date(employee.contract.startDate).toLocaleDateString('pt-BR') : '',
        endDate: employee.contract?.endDate ? new Date(employee.contract.endDate).toLocaleDateString('pt-BR') : '',

        // Valor
        contractValue: '',
        contractValueExtenso: '',

        // Carga Horária
        cargaHoraria: '10 horas semanais de segunda a sexta-feira',

        // Foro
        foro: 'Curitiba-PR',
        dataAssinatura: new Date().toLocaleDateString('pt-BR'),

        // Signatures
        digitalSignature: '',
        signatureType: null as 'GOV' | 'MANUAL' | null
    });

    // Signature Modal State
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [currentSigField, setCurrentSigField] = useState<'contractor' | 'witness1' | 'witness2'>('contractor');
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isFabOpen, setIsFabOpen] = useState(false);

    // Editor State
    const [contractHtml, setContractHtml] = useState('');

    // Editor Ref
    const editorRef = React.useRef<HTMLDivElement>(null);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Editor State
    const [fontSize, setFontSize] = useState(10);
    const [fontFamily, setFontFamily] = useState('Arial');

    const [isDataReady, setIsDataReady] = useState(true);

    const d = additionalData;
    const inst = projectAssets.name;

    // Build the fixed contract HTML from the template
    const buildContractHtml = () => {
        const V = (v: string, fallback = '_______________') => v?.trim() || fallback;
        return `
<p style="text-align:center;font-weight:bold;font-size:12pt;margin-bottom:20px;">Contrato de Prestação de Serviços de Mão de Obra Terceirizada</p>

<p>O presente instrumento particular de contrato de prestação de serviços, que entre si fazem de um lado, <strong>${V(inst)}</strong>, com sede na ${V(d.contratanteAddress)}, inscrita no CNPJ/MF sob o nº ${V(d.contratanteCnpj)}, neste ato representada conforme seus atos constitutivos, doravante simplesmente denominada "CONTRATANTE";</p>

<p>e, de outro lado,</p>

<p><strong>${V(d.contratadaRazaoSocial)}</strong>, com sede na ${V(d.contratadaAddress)}, inscrita no CNPJ/MF sob o nº ${V(d.contratadaCnpj)}, neste ato representada conforme seus atos constitutivos, doravante simplesmente denominada "CONTRATADA", nas cláusulas e condições descritas no presente instrumento.</p>

<p>As partes identificadas e qualificadas acima declaram estar aqui devidamente representadas na forma de seus vigentes instrumentos legais.</p>

<p style="font-weight:bold;margin-top:16px;">"OBJETO DO CONTRATO"</p>
<p>Este contrato tem por objeto a prestação de serviços de <strong>${V(d.cargoFuncao)}</strong>, em projeto aprovado através da Lei de Incentivo ao Esporte Federal, vinculada ao Termo de Compromisso nº ${V(d.termoCompromisso)}, Processo nº ${V(d.processo)} SLI ${V(d.sli)} "${V(d.nomeProjetoContrato)}" do Ministério do Esporte, que serão executados pela CONTRATADA à CONTRATANTE por seu representante legal e/ou empregados registrados, vinculados e com qualificação técnica necessária para execução.</p>

<p style="font-weight:bold;margin-top:16px;">"DA VIGÊNCIA DO CONTRATO"</p>
<p>O presente contrato inicia em ${V(d.startDate)} e findará em ${V(d.endDate)}.</p>

<p style="font-weight:bold;margin-top:16px;">"DO PREÇO"</p>
<p>O valor mensal a ser pago será de R$ ${V(d.contractValue)} (${V(d.contractValueExtenso, 'valor por extenso')}).</p>

<p style="font-weight:bold;margin-top:16px;">"DA DOCUMENTAÇÃO NECESSÁRIA PARA PAGAMENTO"</p>
<p>O pagamento só poderá ser liberado mediante a nota fiscal da prestação de serviço, bem como poderá ser solicitado apresentação de recibo, das certidões de tributos municipais, certidão de tributos estaduais, certidão da dívida ativa da união, certificado de regularidade do FGTS e certidão da Justiça do Trabalho.</p>

<p style="font-weight:bold;margin-top:16px;">"DA FORMA DE PAGAMENTO"</p>
<p>A CONTRATANTE pagará a CONTRATADA os valores, conforme condições estabelecidas mediante Transferência Bancária.</p>

<p style="font-weight:bold;margin-top:16px;">"DA RESCISÃO"</p>
<p>O presente contrato poderá ser rescindido, sem qualquer indenização, bastando simples notificação por escrito com antecedência mínima de 10 (dez) dias, ou nos casos de descumprimento de qualquer cláusula ora avençada, o que se dará de forma imediata, mediante notificação por escrito;</p>
<p>O presente contrato poderá ainda ser rescindido por razões de força maior, caso fortuito, fato príncipe, falência, recuperação judicial ou extrajudicial de uma das partes, interdição de estabelecimento, revogação ou suspensão das licenças de funcionamento de qualquer das partes pelas autoridades que possam impedir o exercício legal da atividade objeto do presente contrato;</p>
<p>O contrato poderá ainda ser rescindido sem nenhuma indenização e independentemente de notificação nos seguintes casos:</p>
<ul style="margin-left:20px;"><li>Prestação de serviço inadequada, sem planejamento;</li><li>Na ausência imotivada no momento da prestação de serviços;</li><li>Postura inadequada na prestação de serviços.</li></ul>

<p style="font-weight:bold;margin-top:16px;">"EQUIPAMENTOS"</p>
<p>A CONTRATANTE fornecerá os materiais esportivos necessários a prestação de serviços da CONTRATADA, que deverá devolvê-los ao final do contrato;</p>
<p>Todos os materiais esportivos necessários para a prestação dos serviços serão de responsabilidade exclusiva da CONTRATADA, que deverá utilizá-los com zelo. No momento da reposição do material, a CONTRATADA deverá apresentar o material antigo.</p>

<p style="font-weight:bold;margin-top:16px;">"DAS OBRIGAÇÕES DA CONTRATANTE"</p>
<p>Efetuar os pagamentos devidos à CONTRATADA rigorosamente nos prazos estabelecidos;</p>
<p>Comunicar a CONTRATADA qualquer irregularidade que venha a constatar, tanto na execução dos serviços como no recebimento das notas e cobranças emitidas, de modo a viabilizar a correção necessária no menor tempo possível;</p>
<p>Fornecer à CONTRATADA todas as informações necessárias, inclusive material esportivo à realização dos serviços, devendo especificar os detalhes necessários à perfeita consecução dos mesmos e a forma como eles deverão ser entregues;</p>
<p>Fornecer informações e/ou dados necessários para que a CONTRATADA possa cumprir o objeto deste instrumento em tempo hábil.</p>

<p style="font-weight:bold;margin-top:16px;">"DAS OBRIGAÇÕES DA CONTRATADA"</p>
<p>Assumir todos os encargos trabalhistas, civis, previdenciários e securitários relativos aos seus empregados, prepostos ou sócios, que estejam prestando serviço na CONTRATANTE, inclusive salários, indenização, aviso prévio, 13º salário, FGTS, seguros e outros, sem qualquer ônus para a CONTRATANTE;</p>
<p>Obedecer a todas as leis, normas, e regulamentos federais, estaduais e municipais relacionados com o trabalho executado;</p>
<p>Fornecer a ${V(d.cargoFuncao)} com qualidade, com planejamento, dentro dos padrões técnicos de qualidade, que totalizam ${V(d.cargaHoraria)};</p>
<p>Se responsabilizar pela guarda e manutenção dos materiais objeto desta prestação de serviço que lhe forem entregues ou fornecidos pela própria CONTRATANTE;</p>
<p>Disponibilizar profissionais e/ou colaboradores identificados e qualificados para execução do objeto deste instrumento, de forma a não deixar os núcleos esportivos sem assistência, sob pena de arcar com os prejuízos causados ou sofrer descontos no valor da prestação de serviços;</p>
<p>Responsabilizar-se pelos danos e/ou prejuízos que seus profissionais e/ou colaboradores que vierem a causar à CONTRATANTE por imprudência, imperícia ou negligência;</p>
<p>Executar suas obrigações sem vícios, garantindo o devido cumprimento de suas obrigações, nos estritos termos do Contrato e normas em vigor, cumprindo todos os prazos e/ou datas acordadas por escrito com a Contratante para realização de etapas, fases e entregas dos Serviços;</p>
<p>Abster-se de praticar quaisquer atos que possam interferir negativamente na imagem da CONTRATANTE, responsabilizando-se integralmente pelas consequências de qualquer eventual descumprimento;</p>
<p>Arcar com todos os tributos de sua responsabilidade que incidam ou venham a incidir sobre o objeto deste Contrato, conforme o disposto na legislação aplicável sejam eles de natureza federal, estadual e/ou municipal, responsabilizando-se, inclusive, pelas infrações a que der causa em virtude da não observância do disposto nesta cláusula;</p>
<p>Fica expressamente estipulado que não se estabelece, por força desta contratação, qualquer vínculo empregatício ou de responsabilidade, mesmo por salário, por parte da CONTRATANTE em relação aos empregados que a CONTRATADA empregar diretamente ou indiretamente, para a execução dos serviços ora ajustados, correndo por conta exclusiva da CONTRATADA todas as despesas com esse pessoal, inclusive encargos de legislação trabalhista, previdenciária, securitária ou qualquer outra, obrigando-se a Contratada ao cumprimento das disposições legais, quer seja quanto à remuneração de seus empregados, quer seja quanto aos demais encargos de qualquer natureza, em especial aqueles referentes a acidente de trabalho;</p>
<p>O representante legal da empresa deverá providenciar ${V(d.cargoFuncao, 'profissional').toLowerCase()} substituto em caso de ausência do titular.</p>

<p style="font-weight:bold;margin-top:16px;">"DISPOSIÇÕES GERAIS"</p>
<p>O presente instrumento constitui título executivo extrajudicial, nos termos do artigo 784 do Código de Processo Civil/15.</p>
<p>Em qualquer hipótese, será sempre a CONTRATADA responsável por todos os serviços prestados e por todas as obrigações assumidas no presente instrumento.</p>
<p>O presente contrato contém o acordo integral estabelecido entre as partes com relação ao objeto deste instrumento. Quaisquer documentos, compromissos e avenças anteriores, orais, escritos ou de outra forma estabelecidos entre as partes e referentes ao objeto deste pacto serão considerados cancelados e não afetarão ou modificarão quaisquer termos ou obrigações.</p>
<p>Qualquer alteração ou notificação entre as partes só será válida se prévia e expressamente acordado por escrito entre as partes.</p>
<p>A rescisão do presente contrato não libera as partes das obrigações devidas até a data da rescisão, que não afetará ou limitará qualquer direito, que expressamente ou por sua natureza, deva permanecer em vigor após a rescisão do presente contrato ou que decorra de tal rescisão.</p>
<p>Qualquer postergação no exercício de direito ou prerrogativa prevista neste contrato significará mera liberalidade e não novação. A tolerância, a inércia ou a demora, de qualquer das partes no exercício de quaisquer direitos e atribuições ou na obtenção de qualquer reparação, conforme previsto no presente contrato, não impedirão o exercício de quaisquer direitos e não constituirão a renúncia por tal PARTE ao seu direito de exercê-lo a qualquer tempo.</p>
<p>A tolerância, por uma das Partes, à infração das Cláusulas e disposições contidas neste Contrato, bem como a prática de quaisquer atos ou procedimentos não previstos de forma expressa neste Contrato, será considerada mera liberalidade, não se configurando como precedente ou novação contratual.</p>

<p style="font-weight:bold;margin-top:16px;">"FORO"</p>
<p>As partes elegem o Foro da cidade de ${V(d.foro)}, para dirimir quaisquer dúvidas ou litígios relacionados a este contrato, renunciando a qualquer outro por mais privilegiado que seja. O presente contrato obriga as partes e sucessoras, a cumprirem e a fazerem cumprir, a qualquer tempo, as cláusulas ora pactuadas.</p>

<p>E por estarem justas e contratadas, firmam o presente instrumento.</p>

<p style="text-align:right;margin-top:30px;">${V(d.foro)}, ${V(d.dataAssinatura)}.</p>

<div style="margin-top:50px;text-align:center;">
<p>______________________</p>
<p><strong>CONTRATANTE</strong></p>
<p>${V(inst)}</p>
</div>

<div style="margin-top:40px;text-align:center;">
<p>_______________________</p>
<p><strong>CONTRATADA</strong></p>
<p>${V(d.contratadaRazaoSocial, 'Nome da Empresa')}</p>
${d.contratadaRepName ? `<p>Por ${d.contratadaRepName}${d.contratadaRepCPF ? ` CPF ${d.contratadaRepCPF}` : ''}</p>` : ''}
</div>
`;
    };

    // Regenerate contract when data changes
    useEffect(() => {
        if (isOpen) {
            setContractHtml(buildContractHtml());
            setContractText(buildContractHtml());
        }
    }, [isOpen]);

    const handleGenerate = () => {
        const html = buildContractHtml();
        setContractHtml(html);
        setContractText(html);
    };

    if (!isOpen) return null;

    const generateHTML = () => {
        const content = editorRef.current?.innerHTML || contractHtml;
        return `
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Contrato - ${employee.name}</title>
                <style>
                    @page { size: A4; margin: 20mm 30mm 20mm 20mm; }
                    body { font-family: '${fontFamily}', sans-serif; line-height: 1.6; font-size: ${fontSize}pt; text-align: justify; color: #000; margin: 0; }
                    .content { text-align: justify; }
                    strong, b { font-weight: 900 !important; }
                    ul { margin-left: 20px; }
                    @media screen {
                        body { background-color: #f3f4f6; display: flex; justify-content: center; padding: 40px; }
                        .page-container {
                            background-color: white; width: 210mm; min-height: 297mm; padding: 20mm 30mm 20mm 20mm;
                            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); margin: 0 auto;
                            word-wrap: break-word; overflow-wrap: break-word;
                            background-image: linear-gradient(to bottom, transparent calc(297mm - 1px), #e5e7eb calc(297mm - 1px), #e5e7eb 297mm);
                            background-size: 100% 297mm;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="page-container">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="${projectAssets.header}" alt="Header" style="width: 100%; max-height: 80px; object-fit: contain;" onerror="this.style.display='none'" />
                    </div>
                    <div class="content">${content}</div>
                </div>
            </body>
            </html>
        `;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(contractText);
        alert('Texto copiado para a área de transferência!');
    };

    const handleExportPDF = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(generateHTML());
            printWindow.document.close();
            // Wait for images to load before printing if signatures exist
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    const handleSave = () => {
        if (onSave) {
            // Converts the HTML content to a data URL (simulating a saved file path)
            const htmlContent = generateHTML();
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            onSave(url);
            alert("Minuta salva com sucesso! Você pode visualizá-la no perfil do funcionário.");
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Gerador de Contratos (IA)</h2>
                            <p className="text-gray-500 text-sm">Minuta Jurídica Personalizada</p>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* Sidebar: Dados do Contrato */}
                    {/* Sidebar: Dados do Contrato */}
                    <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto space-y-6">

                        {/* Seção 1: Contratante */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm uppercase">
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                Contratante
                            </h3>
                            <div className="space-y-2">
                                <div className="p-2 text-xs rounded border bg-gray-100 text-gray-600 font-semibold">{projectAssets.name}</div>
                                <input placeholder="Endereço Sede" value={d.contratanteAddress} onChange={e => setAdditionalData({ ...additionalData, contratanteAddress: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="CNPJ" value={d.contratanteCnpj} onChange={e => setAdditionalData({ ...additionalData, contratanteCnpj: e.target.value })} className="w-full p-2 text-xs rounded border" />
                            </div>
                        </div>

                        {/* Seção 2: Contratada */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm uppercase">
                                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                Contratada (Empresa)
                            </h3>
                            <div className="space-y-2">
                                <input placeholder="Razão Social" value={d.contratadaRazaoSocial} onChange={e => setAdditionalData({ ...additionalData, contratadaRazaoSocial: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="CNPJ" value={d.contratadaCnpj} onChange={e => setAdditionalData({ ...additionalData, contratadaCnpj: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="Endereço Completo" value={d.contratadaAddress} onChange={e => setAdditionalData({ ...additionalData, contratadaAddress: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="Rep. Legal (Nome)" value={d.contratadaRepName} onChange={e => setAdditionalData({ ...additionalData, contratadaRepName: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="CPF do Rep. Legal" value={d.contratadaRepCPF} onChange={e => setAdditionalData({ ...additionalData, contratadaRepCPF: e.target.value })} className="w-full p-2 text-xs rounded border" />
                            </div>
                        </div>

                        {/* Seção 3: Objeto do Contrato */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm uppercase">
                                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Objeto do Contrato
                            </h3>
                            <div className="space-y-2">
                                <input placeholder="Cargo/Função (ex: ASSISTENTE SOCIAL)" value={d.cargoFuncao} onChange={e => setAdditionalData({ ...additionalData, cargoFuncao: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="Termo de Compromisso nº" value={d.termoCompromisso} onChange={e => setAdditionalData({ ...additionalData, termoCompromisso: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="Processo nº" value={d.processo} onChange={e => setAdditionalData({ ...additionalData, processo: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="SLI" value={d.sli} onChange={e => setAdditionalData({ ...additionalData, sli: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="Nome do Projeto no Contrato" value={d.nomeProjetoContrato} onChange={e => setAdditionalData({ ...additionalData, nomeProjetoContrato: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="Carga Horária" value={d.cargaHoraria} onChange={e => setAdditionalData({ ...additionalData, cargaHoraria: e.target.value })} className="w-full p-2 text-xs rounded border" />
                            </div>
                        </div>

                        {/* Seção 4: Vigência e Valor */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm uppercase">
                                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Vigência e Valor
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <input placeholder="Início (dd/mm/aaaa)" value={d.startDate} onChange={e => setAdditionalData({ ...additionalData, startDate: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="Fim (dd/mm/aaaa)" value={d.endDate} onChange={e => setAdditionalData({ ...additionalData, endDate: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="Valor Mensal (R$)" value={d.contractValue} onChange={e => setAdditionalData({ ...additionalData, contractValue: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="Valor por Extenso" value={d.contractValueExtenso} onChange={e => setAdditionalData({ ...additionalData, contractValueExtenso: e.target.value })} className="w-full p-2 text-xs rounded border" />
                            </div>
                        </div>

                        {/* Seção 5: Foro e Data */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm uppercase">
                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                                Foro e Assinatura
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <input placeholder="Foro (Cidade-UF)" value={d.foro} onChange={e => setAdditionalData({ ...additionalData, foro: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="Data Assinatura" value={d.dataAssinatura} onChange={e => setAdditionalData({ ...additionalData, dataAssinatura: e.target.value })} className="w-full p-2 text-xs rounded border" />
                            </div>
                        </div>

                        <div className="mt-2 text-center space-y-2">
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-teal-600 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                📄 ATUALIZAR CONTRATO
                            </button>

                            {onSave && (
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading || !contractText}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-teal-600 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                    SALVAR MINUTA
                                </button>
                            )}
                            <p className="text-[10px] text-gray-400 mt-2">Preencha os dados e clique em Atualizar para regenerar.</p>
                        </div>
                    </div>

                    {/* Main: Visual Editor (A4) */}
                    <div ref={scrollContainerRef} className="flex-1 flex flex-col bg-gray-100 p-8 overflow-y-auto items-center relative">

                        {/* Toolbar */}
                        <div className="sticky top-6 z-40 bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg rounded-full px-6 py-2 flex items-center gap-4 mb-8">
                            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                                <span className="text-xs font-bold text-gray-500 uppercase">Fonte</span>
                                <select
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                    className="text-sm bg-transparent border-none font-medium focus:ring-0 cursor-pointer"
                                >
                                    <option value="Arial">Arial</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Helvetica">Helvetica</option>
                                    <option value="Roboto">Roboto</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">Tamanho</span>
                                <select
                                    value={fontSize}
                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                    className="text-sm bg-transparent border-none font-medium focus:ring-0 cursor-pointer"
                                >
                                    <option value={10}>10pt</option>
                                    <option value={11}>11pt</option>
                                    <option value={12}>12pt</option>
                                    <option value={14}>14pt</option>
                                </select>
                            </div>
                        </div>

                        {/* Single A4 Editor - auto-growing with CSS page break lines */}
                        <div
                            ref={editorRef}
                            contentEditable
                            className="bg-white shadow-2xl relative outline-none p-0 leading-relaxed text-justify text-gray-900 [&_strong]:font-black [&_b]:font-black"
                            style={{
                                width: '210mm',
                                minHeight: '297mm',
                                height: 'auto',
                                padding: '20mm 25mm 40mm 20mm',
                                fontFamily: fontFamily,
                                fontSize: `${fontSize}pt`,
                                lineHeight: '1.6',
                                wordWrap: 'break-word' as const,
                                overflowWrap: 'break-word' as const,
                                whiteSpace: 'normal' as const,
                                // Visual A4 page break lines every 297mm
                                backgroundImage: 'linear-gradient(to bottom, transparent calc(297mm - 1px), #d1d5db calc(297mm - 1px), #d1d5db 297mm)',
                                backgroundSize: '100% 297mm',
                            }}
                            dangerouslySetInnerHTML={{ __html: contractHtml }}
                            onInput={(e) => {
                                setContractHtml(e.currentTarget.innerHTML);
                            }}
                        />

                        {/* Floating Signature Action INSIDE the Document Awareness */}
                        <div className="absolute bottom-8 right-8 flex flex-col gap-2">
                            <div className="relative">
                                <button
                                    onClick={() => setIsFabOpen(!isFabOpen)}
                                    className={`w-14 h-14 rounded-full text-white shadow-xl transition-all flex items-center justify-center ${isFabOpen ? 'bg-red-500 rotate-45' : 'bg-purple-600 hover:bg-purple-700 hover:scale-110'}`}
                                    title="Assinar Documento"
                                >
                                    {isFabOpen ? (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    )}
                                </button>

                                {/* Menu for Signatures */}
                                {isFabOpen && (
                                    <div className="absolute bottom-full right-0 mb-4 flex flex-col gap-2 origin-bottom-right">
                                        <button
                                            onClick={() => { setCurrentSigField('contractor'); setShowSignaturePad(true); setIsFabOpen(false); }}
                                            className="px-4 py-3 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-xl hover:bg-black whitespace-nowrap flex items-center gap-3 transition-transform hover:-translate-x-1"
                                        >
                                            <span className={`w-3 h-3 rounded-full border border-white/20 ${additionalData.digitalSignature ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></span>
                                            Contratante (Núcleo)
                                        </button>
                                        <button
                                            onClick={() => { setCurrentSigField('witness1'); setShowSignaturePad(true); setIsFabOpen(false); }}
                                            className="px-4 py-3 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-xl hover:bg-black whitespace-nowrap flex items-center gap-3 transition-transform hover:-translate-x-1"
                                        >
                                            <span className={`w-3 h-3 rounded-full border border-white/20 bg-gray-500`}></span>
                                            Testemunha 1
                                        </button>
                                        <button
                                            onClick={() => { setCurrentSigField('witness2'); setShowSignaturePad(true); setIsFabOpen(false); }}
                                            className="px-4 py-3 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-xl hover:bg-black whitespace-nowrap flex items-center gap-3 transition-transform hover:-translate-x-1"
                                        >
                                            <span className={`w-3 h-3 rounded-full border border-white/20 bg-gray-500`}></span>
                                            Testemunha 2
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center">
                    <button onClick={onClose} className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors">
                        Cancelar
                    </button>
                    <div className="flex gap-2">
                        <button onClick={handleCopy} className="px-4 py-2 text-blue-600 font-bold hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100">
                            Copiar Texto
                        </button>
                        <button onClick={handleExportPDF} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg shadow hover:shadow-lg hover:from-blue-700 hover:to-teal-600 transition-all flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Exportar PDF
                        </button>
                    </div>
                </div>
            </div>


            {/* Modal de Assinatura Manual */}
            {
                showSignaturePad && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">
                                {currentSigField === 'contractor' ? 'Assinatura do Contratado' :
                                    currentSigField === 'witness1' ? 'Assinatura Testemunha 1' :
                                        'Assinatura Testemunha 2'}
                            </h3>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 touch-none">
                                <canvas
                                    ref={canvasRef}
                                    width={400}
                                    height={200}
                                    onMouseDown={(e) => {
                                        const canvas = canvasRef.current;
                                        if (!canvas) return;
                                        const ctx = canvas.getContext('2d');
                                        if (!ctx) return;
                                        setIsDrawing(true);
                                        const rect = canvas.getBoundingClientRect();
                                        ctx.beginPath();
                                        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                                    }}
                                    onMouseMove={(e) => {
                                        if (!isDrawing) return;
                                        const canvas = canvasRef.current;
                                        const ctx = canvas?.getContext('2d');
                                        if (!ctx || !canvas) return;
                                        const rect = canvas.getBoundingClientRect();
                                        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                                        ctx.stroke();
                                    }}
                                    onMouseUp={() => setIsDrawing(false)}
                                    onMouseLeave={() => setIsDrawing(false)}
                                    // Touch events
                                    onTouchStart={(e) => {
                                        const canvas = canvasRef.current;
                                        if (!canvas) return;
                                        const ctx = canvas.getContext('2d');
                                        if (!ctx) return;
                                        setIsDrawing(true);
                                        const rect = canvas.getBoundingClientRect();
                                        const touch = e.touches[0];
                                        ctx.beginPath();
                                        ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
                                    }}
                                    onTouchMove={(e) => {
                                        if (!isDrawing) return;
                                        const canvas = canvasRef.current;
                                        const ctx = canvas?.getContext('2d');
                                        if (!ctx || !canvas) return;
                                        const rect = canvas.getBoundingClientRect();
                                        const touch = e.touches[0];
                                        ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
                                        ctx.stroke();
                                    }}
                                    onTouchEnd={() => setIsDrawing(false)}
                                    className="w-full h-48 cursor-crosshair rounded-xl"
                                />
                            </div>
                            <div className="flex justify-between mt-4">
                                <button onClick={() => {
                                    const canvas = canvasRef.current;
                                    const ctx = canvas?.getContext('2d');
                                    ctx?.clearRect(0, 0, canvas?.width || 400, canvas?.height || 200);
                                }} className="text-red-500 font-bold text-sm hover:underline">Limpar</button>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowSignaturePad(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-bold">Cancelar</button>
                                    <button onClick={() => {
                                        const canvas = canvasRef.current;
                                        if (canvas) {
                                            const sigData = canvas.toDataURL();
                                            setAdditionalData({ ...additionalData, digitalSignature: sigData, signatureType: 'MANUAL' });
                                            setShowSignaturePad(false);
                                        }
                                    }} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold shadow hover:bg-purple-700">Confirmar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
