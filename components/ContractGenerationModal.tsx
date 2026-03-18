import React, { useState, useEffect } from 'react';
import { generateContractText } from '../services/geminiService';
import { Employee, Nucleo } from '../types';

interface ContractGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Partial<Employee>;
    nucleo: Nucleo;
    onSave?: (contractUrl: string) => void;
}

export const ContractGenerationModal: React.FC<ContractGenerationModalProps> = ({ isOpen, onClose, employee, nucleo, onSave }) => {
    // Contract Text State
    const [contractText, setContractText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Missing/Editable Data State
    const [additionalData, setAdditionalData] = useState({
        // Nucleo Data
        nucleoRazaoSocial: nucleo.razaoSocial || nucleo.nome,
        nucleoCnpj: nucleo.cnpj || '',
        nucleoAddress: nucleo.address || '',
        nucleoCity: (() => {
            if (nucleo.city) return nucleo.city;
            // Parse from nome: "Aquiraz | CE - Sec. de Esporte..."
            const parts = nucleo.nome.split('|');
            if (parts.length >= 2) {
                const city = parts[0].trim();
                const state = parts[1].trim().split(/[\s-]/)[0].trim();
                return `${city}/${state}`;
            }
            return nucleo.nome.split(' - ')[0] || 'Cidade/UF';
        })(),

        // Nucleo Representative
        nucleoResponsavelName: '',
        nucleoResponsavelCargo: 'Diretor(a)',
        nucleoResponsavelNacionalidade: 'Brasileiro(a)',
        nucleoResponsavelEstCivil: 'Casado(a)',
        nucleoResponsavelProfissao: 'Empresário(a)',
        nucleoResponsavelCPF: '',
        nucleoResponsavelRG: '',

        // Employee Data (Extras)
        employeeNacionalidade: employee.nationality || 'Brasileiro(a)',
        employeeEstadoCivil: employee.civilStatus || 'Solteiro(a)',
        employeeRG: employee.rg || '',
        employeeProfissao: employee.profession || employee.role || '',
        employeeAddress: employee.address || '',

        // Contract Financials
        contractValue: '',
        paymentDay: '05',

        // Witnesses
        witness1Name: '',
        witness1CPF: '',
        witness1Signature: '',
        witness2Name: '',
        witness2CPF: '',
        witness2Signature: '',

        digitalSignature: '', // Contractor Signature
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

    // Editor Ref (Legacy support/Global)
    const editorRef = React.useRef<HTMLDivElement>(null); // Optional now, or used for container
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Helper to parse Markdown to HTML
    const parseMarkdown = (text: string) => {
        if (!text) return '';
        let html = text
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            // Line Breaks (handle double newlines as paragraphs, single as br)
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br />');

        // Wrap in p if not already
        return `<p>${html}</p>`;
    };

    // Editor State
    const [fontSize, setFontSize] = useState(10);
    const [fontFamily, setFontFamily] = useState('Arial');
    const [isTyping, setIsTyping] = useState(false);
    const [fullText, setFullText] = useState('');
    const [lastUsage, setLastUsage] = useState<any>(null); // Store token usage

    const [isDataReady, setIsDataReady] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (!nucleo.cnpj || !nucleo.address) {
                setIsDataReady(false);
            } else {
                setIsDataReady(true);
                handleGenerate();
            }
        }
    }, [isOpen, nucleo]);

    const handleGenerate = async () => {
        setIsLoading(true);
        const data = {
            // Nucleo
            nucleoMatrixName: additionalData.nucleoRazaoSocial,
            nucleoName: nucleo.nome,
            nucleoCnpj: additionalData.nucleoCnpj,
            nucleoAddress: additionalData.nucleoAddress,
            nucleoCity: additionalData.nucleoCity,

            // Nucleo Representative
            nucleoRepName: additionalData.nucleoResponsavelName,
            nucleoRepCargo: additionalData.nucleoResponsavelCargo,
            nucleoRepNacionalidade: additionalData.nucleoResponsavelNacionalidade,
            nucleoRepEstCivil: additionalData.nucleoResponsavelEstCivil,
            nucleoRepProfissao: additionalData.nucleoResponsavelProfissao,
            nucleoRepCPF: additionalData.nucleoResponsavelCPF,
            nucleoRepRG: additionalData.nucleoResponsavelRG,

            // Employee
            employeeName: employee.name,
            employeeCpf: employee.documentCpf,
            employeeAddress: additionalData.employeeAddress,
            employeeNacionalidade: additionalData.employeeNacionalidade,
            employeeEstadoCivil: additionalData.employeeEstadoCivil,
            employeeRG: additionalData.employeeRG,
            employeeProfissao: additionalData.employeeProfissao,

            role: employee.role,

            // Contract Specs
            contractType: employee.contract?.type,
            startDate: employee.contract?.startDate ? new Date(employee.contract.startDate).toLocaleDateString() : '...',
            endDate: employee.contract?.endDate ? new Date(employee.contract.endDate).toLocaleDateString() : '...',
            contractValue: additionalData.contractValue,
            paymentDay: additionalData.paymentDay,

            // Witness
            witness1Name: additionalData.witness1Name,
            witness1CPF: additionalData.witness1CPF,
            witness2Name: additionalData.witness2Name,
            witness2CPF: additionalData.witness2CPF,
        };

        try {
            const { text, usage } = await generateContractText(data);
            const html = parseMarkdown(text);

            // Start Typewriter
            setFullText(html);
            setContractHtml(''); // Reset
            setLastUsage(usage);
            setIsTyping(true);

        } catch (err: any) {
            setContractText("Erro ao gerar contrato: " + err.message);
        } finally {
            setIsLoading(false);
            setIsDataReady(true);
        }
    };

    // Typewriter Effect (Simple - single page, no overflow detection)
    useEffect(() => {
        if (isTyping && fullText) {
            let currentIndex = 0;
            const interval = setInterval(() => {
                if (currentIndex >= fullText.length) {
                    clearInterval(interval);
                    setIsTyping(false);
                    // Also set contractText for copy/save
                    setContractText(fullText);
                    return;
                }

                const char = fullText[currentIndex];
                let nextChunk = char;
                let newIndex = currentIndex + 1;

                // Handle HTML tags as single chunks to preserve structure
                if (char === '<') {
                    const tagEnd = fullText.indexOf('>', currentIndex);
                    if (tagEnd !== -1) {
                        nextChunk = fullText.substring(currentIndex, tagEnd + 1);
                        newIndex = tagEnd + 1;
                    }
                }

                // Simply append to the single page
                setContractHtml(prev => prev + nextChunk);

                // Auto-scroll to bottom
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTo({
                        top: scrollContainerRef.current.scrollHeight,
                        behavior: 'auto'
                    });
                }

                currentIndex = newIndex;
            }, 5);

            return () => clearInterval(interval);
        }
    }, [isTyping, fullText]);

    if (!isOpen) return null;

    const generateHTML = () => {
        // Get content from the editor ref or from state
        const content = editorRef.current?.innerHTML || contractHtml;

        const currentDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

        return `
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Contrato - ${employee.name}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 20mm 30mm 20mm 20mm; /* Top Right (3cm) Bottom Left (2cm) */
                    }
                    body { font-family: '${fontFamily}', sans-serif; line-height: 1.5; font-size: ${fontSize}pt; text-align: justify; color: #000; margin: 0; }
                    .content { text-align: justify; }
                    .signature-section { margin-top: 50px; page-break-inside: avoid; page-break-before: always; }
                    .digital-sig-box { border: 1px dashed #ccc; padding: 20px; text-align: center; margin-top: 10px; }
                    .gov-sig { color: #007bfb; font-weight: bold; }
                    img.manual-sig { max-height: 80px; }
                    .gov-sig { color: #007bfb; font-weight: bold; }
                    img.manual-sig { max-height: 80px; }
                    /* Signature Layout */
                    .signature-block { text-align: center; margin-top: 40px; page-break-inside: avoid; }
                    .witness-section { margin-top: 40px; page-break-inside: avoid; display: flex; justify-content: space-between; gap: 20px; }
                    .witness-box { width: 48%; text-align: center; }
                    
                    /* Formatting Overrides (Ensure Markdown styles appear) */
                    strong, b { font-weight: 900 !important; color: #000; } /* Force heavy bold */
                    .page-container strong, .page-container b { font-weight: 900 !important; } /* Specificity */
                    h1, h2, h3, h4 { font-weight: 900 !important; margin-top: 20px; margin-bottom: 10px; color: #000; }
                    h1 { font-size: 14pt; text-transform: uppercase; text-align: center; }
                    h2 { font-size: 12pt; }
                    h3 { font-size: 11pt; }

                    /* Screen View Styling (Like Editor) */
                    @media screen {
                        body {
                            background-color: #f3f4f6; /* Gray-100 */
                            display: flex;
                            justify-content: center;
                            padding: 40px;
                        }
                        
                        /* Wrap content in a "page" div */
                        .page-container {
                            background-color: white;
                            width: 210mm;
                            min-height: 297mm;
                            height: auto;
                            padding: 20mm 30mm 20mm 20mm;
                            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                            margin: 0 auto;
                            word-wrap: break-word; /* Prevent overflow */
                            overflow-wrap: break-word;
                            white-space: pre-wrap; /* Preserve whitespace but wrap */
                            /* Visual Pagination for Preview */
                            background-image: linear-gradient(to bottom, transparent calc(297mm - 1px), #e5e7eb calc(297mm - 1px), #e5e7eb 297mm);
                            background-size: 100% 297mm;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="page-container">
                    <div class="content">
                    ${content}
                </div>
                
                <div class="signature-block">
                    <p style="text-align: right; margin-bottom: 40px;">${additionalData.nucleoCity || 'Curitiba'}, ${currentDate}</p>

                    <p><strong>Assinatura do Contratante:</strong></p>
                    ${additionalData.digitalSignature ? `
                        <div style="margin-top: 10px; margin-bottom: 20px;">
                             <img src="${additionalData.digitalSignature}" class="manual-sig" /><br/>
                             <small style="font-size: 9px; color: #666;">Assinado eletronicamente por Rep. Legal</small>
                        </div>
                    ` : '<br/><br/>'}
                    ________________________________________________<br/>
                    <strong>${additionalData.nucleoRazaoSocial.split(' - ')[0]}</strong><br/>
                    ${additionalData.nucleoCnpj}<br/>
                    ${additionalData.nucleoResponsavelName ? `Rep: ${additionalData.nucleoResponsavelName}` : ''}
                </div>

                <div class="signature-block" style="margin-top: 30px; page-break-before: auto;"> 
                    <p><strong>Assinatura do Contratado:</strong></p>
                    <br/><br/>
                    ________________________________________________<br/>
                    <strong>${employee.name}</strong><br/>
                    CPF: ${employee.documentCpf}
                </div>

                <div class="witness-section">
                        <div class="witness-box">
                            <p><strong>Testemunha 1:</strong></p>
                            <br/>
                             ${additionalData.witness1Signature ? `<img src="${additionalData.witness1Signature}" class="manual-sig" style="max-height: 40px;" /><br/>` : '<br/><br/>'}
                            ______________________________________<br/>
                            Nome: ${additionalData.witness1Name || '__________________'}<br/>
                            CPF: ${additionalData.witness1CPF || '__________________'}
                        </div>
                        
                        <div class="witness-box">
                            <p><strong>Testemunha 2:</strong></p>
                            <br/>
                            ${additionalData.witness2Signature ? `<img src="${additionalData.witness2Signature}" class="manual-sig" style="max-height: 40px;" /><br/>` : '<br/><br/>'}
                            ______________________________________<br/>
                            Nome: ${additionalData.witness2Name || '__________________'}<br/>
                            CPF: ${additionalData.witness2CPF || '__________________'}
                        </div>
                </div>
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
                            {lastUsage && (
                                <>
                                    💰 Custo Estimado: <strong>R$ {((lastUsage.promptTokenCount / 1000000 * 0.075 + lastUsage.candidatesTokenCount / 1000000 * 0.30) * 6).toFixed(4)}</strong>
                                    <span className="ml-2 opacity-75">(In: {lastUsage.promptTokenCount} | Out: {lastUsage.candidatesTokenCount})</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Status Indicator */}
                    {isTyping && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold animate-pulse">
                            ✍️ Digitando contrato...
                        </div>
                    )}

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
                                Contratante (Núcleo)
                            </h3>
                            <div className="space-y-2">
                                <input placeholder="Razão Social" value={additionalData.nucleoRazaoSocial} onChange={e => setAdditionalData({ ...additionalData, nucleoRazaoSocial: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="CNPJ" value={additionalData.nucleoCnpj} onChange={e => setAdditionalData({ ...additionalData, nucleoCnpj: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="Endereço Completo" value={additionalData.nucleoAddress} onChange={e => setAdditionalData({ ...additionalData, nucleoAddress: e.target.value })} className="w-full p-2 text-xs rounded border" />
                                <input placeholder="Cidade/Foro" value={additionalData.nucleoCity} onChange={e => setAdditionalData({ ...additionalData, nucleoCity: e.target.value })} className="w-full p-2 text-xs rounded border" />
                            </div>
                        </div>

                        {/* Seção 2: Representante Legal */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm uppercase">
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                Representante Legal
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <input placeholder="Nome Completo" className="col-span-2 w-full p-2 text-xs rounded border" value={additionalData.nucleoResponsavelName} onChange={e => setAdditionalData({ ...additionalData, nucleoResponsavelName: e.target.value })} />
                                <input placeholder="CPF" className="w-full p-2 text-xs rounded border" value={additionalData.nucleoResponsavelCPF} onChange={e => setAdditionalData({ ...additionalData, nucleoResponsavelCPF: e.target.value })} />
                                <input placeholder="RG" className="w-full p-2 text-xs rounded border" value={additionalData.nucleoResponsavelRG} onChange={e => setAdditionalData({ ...additionalData, nucleoResponsavelRG: e.target.value })} />
                                <input placeholder="Nacionalidade" className="w-full p-2 text-xs rounded border" value={additionalData.nucleoResponsavelNacionalidade} onChange={e => setAdditionalData({ ...additionalData, nucleoResponsavelNacionalidade: e.target.value })} />
                                <input placeholder="Est. Civil" className="w-full p-2 text-xs rounded border" value={additionalData.nucleoResponsavelEstCivil} onChange={e => setAdditionalData({ ...additionalData, nucleoResponsavelEstCivil: e.target.value })} />
                                <input placeholder="Profissão" className="w-full p-2 text-xs rounded border" value={additionalData.nucleoResponsavelProfissao} onChange={e => setAdditionalData({ ...additionalData, nucleoResponsavelProfissao: e.target.value })} />
                                <input placeholder="Cargo" className="w-full p-2 text-xs rounded border" value={additionalData.nucleoResponsavelCargo} onChange={e => setAdditionalData({ ...additionalData, nucleoResponsavelCargo: e.target.value })} />
                            </div>
                        </div>

                        {/* Seção 3: Contratado (Extras) */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm uppercase">
                                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                Dados do Contratado
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <input placeholder="RG" className="w-full p-2 text-xs rounded border" value={additionalData.employeeRG} onChange={e => setAdditionalData({ ...additionalData, employeeRG: e.target.value })} />
                                <input placeholder="Nacionalidade" className="w-full p-2 text-xs rounded border" value={additionalData.employeeNacionalidade} onChange={e => setAdditionalData({ ...additionalData, employeeNacionalidade: e.target.value })} />
                                <input placeholder="Est. Civil" className="w-full p-2 text-xs rounded border" value={additionalData.employeeEstadoCivil} onChange={e => setAdditionalData({ ...additionalData, employeeEstadoCivil: e.target.value })} />
                                <input placeholder="Profissão" className="w-full p-2 text-xs rounded border" value={additionalData.employeeProfissao} onChange={e => setAdditionalData({ ...additionalData, employeeProfissao: e.target.value })} />
                                <input placeholder="Endereço Completo" className="col-span-2 w-full p-2 text-xs rounded border" value={additionalData.employeeAddress} onChange={e => setAdditionalData({ ...additionalData, employeeAddress: e.target.value })} />
                            </div>
                        </div>

                        {/* Seção 4: Financeiro */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm uppercase">
                                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Pagamento
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <input placeholder="Valor Mensal (R$)" className="w-full p-2 text-xs rounded border" value={additionalData.contractValue} onChange={e => setAdditionalData({ ...additionalData, contractValue: e.target.value })} />
                                <input placeholder="Dia Pagamento (ex: 05)" className="w-full p-2 text-xs rounded border" value={additionalData.paymentDay} onChange={e => setAdditionalData({ ...additionalData, paymentDay: e.target.value })} />
                            </div>
                        </div>

                        {/* Seção 5: Testemunhas */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm uppercase">
                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                Testemunhas
                            </h3>
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <input placeholder="Nome Testemunha 1" className="w-full p-2 text-xs rounded border" value={additionalData.witness1Name} onChange={e => setAdditionalData({ ...additionalData, witness1Name: e.target.value })} />
                                    <input placeholder="CPF Testemunha 1" className="w-full p-2 text-xs rounded border" value={additionalData.witness1CPF} onChange={e => setAdditionalData({ ...additionalData, witness1CPF: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input placeholder="Nome Testemunha 2" className="w-full p-2 text-xs rounded border" value={additionalData.witness2Name} onChange={e => setAdditionalData({ ...additionalData, witness2Name: e.target.value })} />
                                    <input placeholder="CPF Testemunha 2" className="w-full p-2 text-xs rounded border" value={additionalData.witness2CPF} onChange={e => setAdditionalData({ ...additionalData, witness2CPF: e.target.value })} />
                                </div>
                            </div>
                        </div>



                        <div className="mt-2 text-center space-y-2">
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || isTyping}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-teal-600 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Gerando Minuta...
                                    </>
                                ) : isTyping ? (
                                    <span>...</span>
                                ) : 'ATUALIZAR CONTRATO'}
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
                            <p className="text-[10px] text-gray-400 mt-2">Preencha os dados acima e clique em Atualizar para regenerar o texto.</p>
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
                            className="bg-white shadow-2xl relative outline-none p-0 leading-relaxed text-justify text-gray-900 break-words whitespace-pre-wrap [&_strong]:font-black [&_b]:font-black"
                            style={{
                                width: '210mm',
                                minHeight: '297mm',
                                padding: '20mm 30mm 20mm 20mm', // Top 2cm, Right 3cm, Bottom 2cm, Left 2cm
                                fontFamily: fontFamily,
                                fontSize: `${fontSize}pt`,
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
                                            <span className={`w-3 h-3 rounded-full border border-white/20 ${additionalData.witness1Signature ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-500'}`}></span>
                                            Testemunha 1
                                        </button>
                                        <button
                                            onClick={() => { setCurrentSigField('witness2'); setShowSignaturePad(true); setIsFabOpen(false); }}
                                            className="px-4 py-3 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-xl hover:bg-black whitespace-nowrap flex items-center gap-3 transition-transform hover:-translate-x-1"
                                        >
                                            <span className={`w-3 h-3 rounded-full border border-white/20 ${additionalData.witness2Signature ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-500'}`}></span>
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
                                            if (currentSigField === 'contractor') {
                                                setAdditionalData({ ...additionalData, digitalSignature: sigData, signatureType: 'MANUAL' });
                                            } else if (currentSigField === 'witness1') {
                                                setAdditionalData({ ...additionalData, witness1Signature: sigData });
                                            } else if (currentSigField === 'witness2') {
                                                setAdditionalData({ ...additionalData, witness2Signature: sigData });
                                            }
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
