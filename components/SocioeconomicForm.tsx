
import React, { useState, useMemo } from 'react';
import { DocumentLog, SocioeconomicData, PDFItemType } from '../types';
import { SmartCamera } from './SmartCamera';

interface SocioeconomicFormProps {
    onBack: () => void;
    onSave: (data: DocumentLog) => void;
    initialMode?: 'MENU' | 'DIGITAL_FORM' | 'HISTORY';
    history?: DocumentLog[];
}

type QuestionField = keyof SocioeconomicData;

interface QuestionConfig {
    id: QuestionField;
    label: string;
    type: 'text' | 'radio' | 'number';
    options?: string[];
    hasOther?: boolean;
}

// Constante exportada ou movida para fora para uso no Template
const QUESTIONS: QuestionConfig[] = [
    { id: 'nome', label: '1. Nome completo do(a) atleta', type: 'text' },
    { id: 'genero', label: '2. Gênero do(a) atleta', type: 'radio', options: ['Masculino', 'Feminino', 'Prefiro não dizer'], hasOther: true },
    { id: 'cor_raca', label: '3. Cor ou Raça do(a) atleta', type: 'radio', options: ['Amarela', 'Branca', 'Indígena', 'Parda', 'Preta'] },
    { id: 'faixa_etaria', label: '4. Faixa Etária', type: 'radio', options: ['Igual ou menor que 7 anos', '8 a 12 anos', '13 a 17 anos', 'Igual ou maior que 18 anos'] },
    { id: 'deficiencia', label: '5. O(a) atleta possui alguma deficiência?', type: 'radio', options: ['Não possui nenhuma deficiência', 'Deficiência física/motora', 'Deficiência auditiva', 'Deficiência visual', 'Deficiência Intelectual', 'Deficiência mental'] },
    { id: 'responsavel_transporte', label: '6. Quem é o responsável por levar o(a) atleta para os treinos?', type: 'radio', options: ['Mãe/Pai', 'Responsável Legal', 'Membro da família', 'Não membro da família'] },
    { id: 'meio_transporte', label: '7. Qual o meio de transporte que o(a) atleta vai ao treino?', type: 'radio', options: ['Andando', 'Bicicleta', 'Ônibus', 'Veículo Particular'], hasOther: true },
    { id: 'freq_atividade_anterior', label: '8. Antes de conhecer o projeto, qual era a frequência de atividades físicas do(a) atleta?', type: 'radio', options: ['Não praticava atividade física', 'Praticava uma vez na semana', 'Praticava 2 a 3 vezes na semana'] },
    { id: 'matricula_escola', label: '9. Atleta matriculado em:', type: 'radio', options: ['Escola Pública', 'Escola Particular'] },
    { id: 'detalhe_escola_particular', label: '10. No caso de estar matriculado em escola particular:', type: 'radio', options: ['Estuda em escola pública', 'Paga a mensalidade integral', 'Possui bolsa integral', 'Possui bolsa parcial'] },
    { id: 'escolaridade', label: '11. Grau de escolaridade', type: 'radio', options: ['Ensino Fundamental I (1º ao 5º ano)', 'Ensino Fundamental II (6º ao 9º ano)', 'Ensino Médio'] },
    { id: 'periodo_estudo', label: '12. Qual o período em que o(a) aluno(a) estuda na ESCOLA', type: 'radio', options: ['Manhã', 'Tarde', 'Integral'] },
    { id: 'area_residencia', label: '13. Reside em área', type: 'radio', options: ['Urbana', 'Rural'] },
    { id: 'tipo_moradia', label: '14. Tipo de Moradia', type: 'radio', options: ['Alugada', 'Cedida', 'Própria', 'Financiada'], hasOther: true },
    { id: 'num_pessoas_casa', label: '15. Qual o número de pessoas que residem na casa?', type: 'radio', options: ['2 a 3 pessoas', '4 pessoas', '5 pessoas', '6 pessoas', '7 ou mais pessoas'] },
    { id: 'renda_familiar', label: '16. Qual a renda bruta familiar?', type: 'radio', options: ['Até 1 Salário Mínimo', '2 a 3 Salários Mínimos', '4 a 5 Salários Mínimos', '6 ou mais Salários Mínimos'] },
    { id: 'resp_nucleo_familiar', label: '17. Responsável pelo núcleo familiar', type: 'radio', options: ['Mulher chefe de família', 'Mãe solteira', 'Mulher e Homem chefe de família', 'Homem chefe de família', 'Homem solteiro'] },
    { id: 'beneficio_social', label: '18. Recebem algum benefício social?', type: 'radio', options: ['Sim', 'Não'] },
    { id: 'tipo_beneficio', label: '19. Tipo de benefício social', type: 'radio', options: ['Não recebe', 'Bolsa Família', 'BPC'], hasOther: true },
    { id: 'sistema_saude', label: '20. Qual o sistema de saúde utilizado?', type: 'radio', options: ['Público (SUS)', 'Privado (Particular)', 'Privado (Plano de saúde)', 'Rede pública e privada'] },
    { id: 'acompanhamento_medico', label: '21. Atleta realiza algum acompanhamento médico?', type: 'radio', options: ['Não', 'Sim'], hasOther: true },
    { id: 'vacinas_completas', label: '22. As vacinas estão completas para a faixa etária?', type: 'radio', options: ['Sim', 'Não'] },
    { id: 'peso', label: '23. Informe o PESO do(a) atleta (Kg)', type: 'text' },
    { id: 'altura', label: '24. Informe a ALTURA do(a) atleta (m)', type: 'text' },
];

// --- TEMPLATE DE VISUALIZAÇÃO INTEGRAL ---
const SocioTemplate: React.FC<{ data: SocioeconomicData }> = ({ data }) => {
    return (
        <div className="bg-white text-black font-sans h-full p-2">
            {/* CABEÇALHO OFICIAL */}
            <div className="flex flex-col items-center justify-center mb-6 border-b-2 border-gray-800 pb-4">
                <img src="/header_full.png" alt="Header" className="h-20 object-contain mb-4 w-full max-w-[210mm]" />
                <div className="text-center">
                    <h1 className="text-lg font-bold text-black uppercase">Indicadores Socioeconômicos e de Saúde</h1>
                    <h2 className="text-sm font-bold text-gray-600 uppercase">Escolinha de Triathlon - Núcleo Campinas</h2>
                </div>
            </div>

            {/* IDENTIFICAÇÃO EM DESTAQUE */}
            <div className="bg-gray-100 p-3 rounded mb-6 border border-gray-300">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="block text-[10px] font-bold text-gray-500 uppercase">Nome do Atleta</span>
                        <span className="block text-sm font-bold text-black">{data.nome}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="block text-[10px] font-bold text-gray-500 uppercase">Gênero</span>
                            <span className="block text-sm font-bold text-black">{data.genero}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-gray-500 uppercase">Idade</span>
                            <span className="block text-sm font-bold text-black">{data.faixa_etaria}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* GRADEL DE RESPOSTAS */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {QUESTIONS.slice(2).map((q) => ( // Pula Nome e Gênero que já estão no destaque
                    <div key={q.id} className="border-b border-gray-100 pb-1 page-break-inside-avoid">
                        <p className="text-[9px] font-bold text-gray-500 uppercase mb-0.5">{q.label.replace(/^\d+\.\s*/, '')}</p>
                        <p className="text-xs font-medium text-black">
                            {data[q.id] || <span className="text-gray-300 italic">Não informado</span>}
                        </p>
                    </div>
                ))}
            </div>

            {/* RODAPÉ */}
            <div className="mt-8 pt-4 border-t border-gray-300 text-center">
                <p className="text-[9px] text-gray-400">Documento gerado digitalmente via Sistema de Gestão Gov.br</p>
            </div>
        </div>
    );
};

type FormMode = 'MENU' | 'DIGITAL_FORM' | 'HISTORY' | 'CAMERA_SCAN' | 'SCAN_PREVIEW';

export const SocioeconomicForm: React.FC<SocioeconomicFormProps> = ({ onBack, onSave, initialMode = 'MENU', history = [] }) => {
    const [mode, setMode] = useState<FormMode>(initialMode);

    // State for Form Data
    const [formData, setFormData] = useState<SocioeconomicData>({
        nome: '',
        genero: '',
        cor_raca: '',
        faixa_etaria: '',
        deficiencia: '',
        responsavel_transporte: '',
        meio_transporte: '',
        freq_atividade_anterior: '',
        matricula_escola: '',
        detalhe_escola_particular: '',
        escolaridade: '',
        periodo_estudo: '',
        area_residencia: '',
        tipo_moradia: '',
        num_pessoas_casa: '',
        renda_familiar: '',
        resp_nucleo_familiar: '',
        beneficio_social: '',
        tipo_beneficio: '',
        sistema_saude: '',
        acompanhamento_medico: '',
        vacinas_completas: '',
        peso: '',
        altura: ''
    });

    // Upload/Scan State
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    // Viewer State
    const [selectedDoc, setSelectedDoc] = useState<DocumentLog | null>(null);

    // State to handle "Outro" inputs specifically before merging
    const [otherInputs, setOtherInputs] = useState<Record<string, string>>({});

    const handleChange = (id: QuestionField, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleOtherChange = (id: QuestionField, value: string) => {
        setOtherInputs(prev => ({ ...prev, [id]: value }));
        setFormData(prev => ({ ...prev, [id]: `Outro: ${value}` }));
    };

    // --- SUBMIT DIGITAL ---
    const handleSubmit = () => {
        // Validação Básica
        for (const q of QUESTIONS) {
            if (q.id === 'detalhe_escola_particular' && formData.matricula_escola !== 'Escola Particular') {
                continue;
            }
            if (!formData[q.id]) {
                alert(`Por favor, responda a pergunta: ${q.label}`);
                return;
            }
        }

        const docData: DocumentLog = {
            id: `saude_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type: 'INDICADORES_SAUDE',
            title: 'Indicadores Socioeconômico e de Saúde',
            description: `Pesquisa Digital: ${formData.nome}`,
            metaData: formData
        };

        onSave(docData);
        if (initialMode === 'MENU') {
            alert("Salvo com sucesso!");
            setMode('HISTORY');
        }
    };

    // --- SUBMIT SCAN ---
    const handleSaveScan = () => {
        if (!formData.nome) {
            alert("Por favor, digite o nome do atleta para identificar o arquivo.");
            return;
        }

        const docData: DocumentLog = {
            id: `saude_scan_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type: 'INDICADORES_SAUDE',
            title: 'Indicadores Socioeconômico (Scan)',
            description: `Digitalização: ${formData.nome}`,
            fileUrl: capturedImage || undefined,
            metaData: {
                ...formData, // Salva o nome e outros campos vazios para consistência
                isScan: true
            }
        };

        onSave(docData);
        alert("Digitalização salva com sucesso!");
        setMode('HISTORY');
        setCapturedImage(null);
        setFormData({ ...formData, nome: '' }); // Reset name
    };

    const handleSmartCapture = (base64: string) => {
        setCapturedImage(base64);
        setMode('SCAN_PREVIEW');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                setCapturedImage(ev.target?.result as string);
                setMode('SCAN_PREVIEW');
            };
            reader.readAsDataURL(f);
        }
    };

    const handleViewDetails = (doc: DocumentLog) => {
        setSelectedDoc(doc);
    };

    const handleDragStart = (e: React.DragEvent, item: DocumentLog) => {
        const payload = {
            type: item.fileUrl ? 'IMAGE' : 'SOCIOECONOMIC_CARD',
            data: item.fileUrl ? { url: item.fileUrl } : item.metaData,
            title: `Socio: ${item.metaData?.nome || 'Item'}`
        };
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDownloadPDF = () => {
        const originalTitle = document.title;
        const name = selectedDoc?.metaData?.nome || "Aluno";
        const dateFormatted = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        document.title = `SOCIOECONOMICO - ${name} - ${dateFormatted}`;
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.title = originalTitle;
            }, 1000);
        }, 100);
    };

    // --- RENDERIZADORES DE CAMPO ---
    const renderField = (q: QuestionConfig) => {
        if (q.type === 'text' || q.type === 'number') {
            return (
                <input
                    type={q.type}
                    value={formData[q.id]}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    className="w-full border border-gray-300 rounded p-3 text-gray-800 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors outline-none"
                    placeholder="Sua resposta"
                />
            );
        }

        if (q.type === 'radio' && q.options) {
            return (
                <div className="space-y-2">
                    {q.options.map(opt => (
                        <label key={opt} className="flex items-center space-x-3 p-3 rounded border border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors bg-white">
                            <input
                                type="radio"
                                name={q.id}
                                value={opt}
                                checked={formData[q.id] === opt}
                                onChange={() => handleChange(q.id, opt)}
                                className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700 font-medium">{opt}</span>
                        </label>
                    ))}

                    {q.hasOther && (
                        <div className={`flex items-center space-x-3 p-3 rounded border transition-colors ${formData[q.id]?.startsWith('Outro:') ? 'bg-blue-50 border-blue-300' : 'border-gray-200 bg-white'}`}>
                            <input
                                type="radio"
                                name={q.id}
                                checked={formData[q.id]?.startsWith('Outro:') || formData[q.id] === 'Sim' && q.id === 'acompanhamento_medico'}
                                onChange={() => handleChange(q.id, 'Outro:')}
                                className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <span className="text-gray-700 font-medium block mb-1">Outro / Especificar:</span>
                                <input
                                    type="text"
                                    value={otherInputs[q.id] || ''}
                                    onClick={() => handleChange(q.id, `Outro: ${otherInputs[q.id] || ''}`)}
                                    onChange={(e) => handleOtherChange(q.id, e.target.value)}
                                    className="w-full border-b border-gray-400 bg-transparent py-1 text-gray-800 focus:border-blue-600 focus:outline-none"
                                    placeholder="Digite aqui..."
                                />
                            </div>
                        </div>
                    )}
                </div>
            );
        }
    };

    // --- DETAIL VIEW (MODAL) ---
    if (selectedDoc) {
        const isScan = !!selectedDoc.fileUrl;

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-start overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
                <div className="relative w-full max-w-[210mm] my-8 mx-4 print:mx-0 print:my-0 print:w-full">
                    {/* Controles Flutuantes */}
                    <div className="absolute top-0 -right-16 flex flex-col gap-3 print:hidden">
                        <button onClick={() => setSelectedDoc(null)} className="bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors" title="Fechar">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <button onClick={handleDownloadPDF} className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors" title="Imprimir">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        </button>
                    </div>

                    <div className="bg-white min-h-[297mm] p-8 shadow-2xl print:shadow-none print:p-0 box-border">
                        {isScan ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4">
                                <h2 className="text-xl font-bold uppercase border-b-2 border-black pb-2 mb-4 w-full text-center">Indicadores Socioeconômicos (Digitalizado)</h2>
                                <img src={selectedDoc.fileUrl} alt="Scan" className="max-w-full max-h-[250mm] object-contain" />
                                <p className="text-sm font-bold text-gray-600">Aluno: {selectedDoc.metaData?.nome}</p>
                            </div>
                        ) : (
                            <SocioTemplate data={selectedDoc.metaData} />
                        )}
                    </div>
                </div>
                <style>{`@media print { body { background-color: white !important; margin: 0 !important; } .fixed { position: static !important; overflow: visible !important; background: none !important; } body > *:not(.fixed) { display: none !important; } .print\\:hidden { display: none !important; } }`}</style>
            </div>
        );
    }

    // --- VISUALIZAÇÃO DE HISTÓRICO ---
    if (mode === 'HISTORY') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                <div className="bg-white p-4 shadow-sm flex items-center gap-4 border-b">
                    <button onClick={() => setMode('MENU')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
                    <h1 className="font-bold text-lg text-gray-800">Indicadores Coletados</h1>
                </div>

                <div className="p-4 md:p-8 flex-1 overflow-auto">
                    {history.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">Nenhum indicador registrado ainda.</div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-4">
                            {history.filter(h => h.type === 'INDICADORES_SAUDE').map(doc => (
                                <div
                                    key={doc.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, doc)}
                                    onClick={() => handleViewDetails(doc)}
                                    className="bg-white p-4 rounded-lg shadow border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-400 transition-all group relative"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg">{doc.metaData?.nome || "Nome não identificado"}</h3>
                                            <p className="text-sm text-gray-500 mb-2">Data: {new Date(doc.timestamp).toLocaleDateString()}</p>

                                            {doc.fileUrl ? (
                                                <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    Arquivo Digitalizado
                                                </div>
                                            ) : (
                                                <div className="text-xs grid grid-cols-2 gap-2 mt-2 bg-gray-50 p-2 rounded text-gray-700">
                                                    <span><b>Idade:</b> {doc.metaData?.faixa_etaria}</span>
                                                    <span><b>Gênero:</b> {doc.metaData?.genero}</span>
                                                    <span><b>Escola:</b> {doc.metaData?.matricula_escola}</span>
                                                    <span><b>Saúde:</b> {doc.metaData?.sistema_saude}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${doc.fileUrl ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                                                {doc.fileUrl ? 'Scan' : 'Digital'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 mt-2 flex items-center gap-1 group-hover:text-blue-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                                                Arraste ou Clique
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- MENU INICIAL ---
    if (mode === 'MENU') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                <div className="bg-white p-4 shadow-sm flex items-center gap-4">
                    <button onClick={onBack} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
                    <h1 className="font-bold text-lg text-gray-800">Indicadores de Saúde</h1>
                </div>
                <div className="flex-1 p-6 flex flex-col justify-center gap-6 max-w-md mx-auto w-full">
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold text-blue-900">Como deseja preencher?</h2>
                        <p className="text-gray-600 text-sm mt-2">Escolha o formato da pesquisa.</p>
                    </div>

                    <button onClick={() => setMode('DIGITAL_FORM')} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-purple-100 rounded-xl shadow-sm hover:border-purple-500 hover:shadow-md transition-all group">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01 2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <span className="font-bold text-gray-800">Formulário Digital</span>
                        <span className="text-xs text-gray-500 mt-1">Preencher agora no App</span>
                    </button>

                    <div className="relative"><div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300"></div></div><div className="relative flex justify-center"><span className="px-2 bg-gray-50 text-sm text-gray-500">OU</span></div></div>

                    <button onClick={() => setMode('CAMERA_SCAN')} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-green-100 rounded-xl shadow-sm hover:border-green-500 hover:shadow-md transition-all group">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <span className="font-bold text-gray-800">Digitalizar Papel</span>
                        <span className="text-xs text-gray-500 mt-1">Usar Câmera Inteligente</span>
                    </button>

                    <div className="relative mt-2"><div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300"></div></div></div>

                    <button onClick={() => setMode('HISTORY')} className="flex items-center justify-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:bg-white hover:border-gray-400 transition-all text-gray-700 font-bold text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Ver Respostas Coletadas
                    </button>

                    <label className="text-center text-blue-600 text-sm font-semibold mt-2 cursor-pointer">
                        Carregar foto do dispositivo
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>
        );
    }

    // --- CAMERA MODE ---
    if (mode === 'CAMERA_SCAN') {
        return <SmartCamera onCapture={handleSmartCapture} onClose={() => setMode('MENU')} title="Digitalizar Indicadores" />;
    }

    // --- SCAN PREVIEW MODE ---
    if (mode === 'SCAN_PREVIEW') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                <div className="bg-white p-4 shadow-sm flex items-center gap-4">
                    <button onClick={() => setMode('MENU')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
                    <h1 className="font-bold text-lg text-gray-800">Revisar Digitalização</h1>
                </div>
                <div className="p-4 flex-1 flex flex-col items-center max-w-lg mx-auto w-full">
                    <img src={capturedImage || ''} alt="Scan" className="w-full h-64 object-contain bg-gray-200 rounded shadow mb-6" />

                    <div className="w-full bg-white p-4 rounded shadow-sm border border-gray-200 mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Identifique o Atleta</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded p-3 text-gray-800"
                            placeholder="Nome completo do atleta..."
                            value={formData.nome}
                            onChange={(e) => handleChange('nome', e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">Necessário para organizar no histórico.</p>
                    </div>

                    <div className="w-full space-y-3">
                        <button onClick={handleSaveScan} className="w-full bg-green-600 text-white py-4 rounded-lg font-bold shadow-lg hover:bg-green-700">Salvar Documento</button>
                        <button onClick={() => setMode('CAMERA_SCAN')} className="w-full text-blue-600 font-bold py-2">Tirar outra foto</button>
                    </div>
                </div>
            </div>
        );
    }

    // --- FORMULÁRIO DIGITAL ---
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">
            <div className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-40 border-b border-gray-200">
                <button onClick={() => setMode('MENU')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
                <div>
                    <h1 className="font-bold text-base text-gray-800 leading-tight">Indicadores Socioeconômicos</h1>
                </div>
            </div>

            <div className="p-4 flex-1 max-w-2xl mx-auto w-full pb-24 space-y-6">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800 leading-relaxed">
                    <p><b>Descrição:</b> A Escolinha de Triathlon – Núcleo Campinas está realizando a Pesquisa Socioeconômica e de Saúde referente ao 2º semestre de 2025. Essa pesquisa é muito importante para mantermos nossos registros atualizados e garantindo a continuidade do projeto.</p>
                </div>

                {QUESTIONS.map((q) => {
                    // Renderização Condicional: Oculta pergunta 10 se não for escola particular
                    if (q.id === 'detalhe_escola_particular' && formData.matricula_escola !== 'Escola Particular') {
                        return null;
                    }

                    return (
                        <div key={q.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 animate-fade-in">
                            <label className="block font-bold text-gray-800 mb-3 text-sm">{q.label}</label>
                            {renderField(q)}
                        </div>
                    );
                })}

                <button
                    onClick={handleSubmit}
                    className="w-full py-4 bg-green-600 text-white rounded-lg font-bold shadow-lg hover:bg-green-700 transition-all text-lg"
                >
                    Enviar Pesquisa
                </button>
            </div>
        </div>
    );
};
