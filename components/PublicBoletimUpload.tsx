import React, { useRef, useState } from 'react';
import { processSchoolReport } from '../services/geminiService';
import { DocumentLog } from '../types';

interface PublicBoletimUploadProps {
    onSave: (doc: DocumentLog) => void;
}

export const PublicBoletimUpload: React.FC<PublicBoletimUploadProps> = ({ onSave }) => {
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [inputName, setInputName] = useState('');
    const [errorStatus, setErrorStatus] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFile(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const cancelSelection = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            setErrorStatus('Por favor, anexe uma foto ou PDF do boletim.');
            return;
        }
        setErrorStatus(null);
        setLoading(true);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);

            reader.onloadend = async () => {
                const base64 = reader.result as string;

                // OCR Processing
                const ocrResult = await processSchoolReport(base64, selectedFile.type);

                // Monta o nome preferindo o que o usuário digitou, senão o OCR
                const finalStudentName = inputName.trim() || ocrResult.studentName || 'Nome não identificado';

                // Funções auxiliares para avaliar a nota (Escala 0 a 10)
                const getAvaliacaoConceito = (nota: number): 'Bom' | 'Regular' | 'Insatisfatório' | 'Péssimo' | undefined => {
                    if (nota === 0 || !nota) return undefined;
                    if (nota >= 6) return 'Bom';
                    if (nota >= 5) return 'Regular';
                    if (nota >= 3) return 'Insatisfatório';
                    return 'Péssimo';
                };

                const g1 = ocrResult.grade1 || 0;
                const g2 = ocrResult.grade2 || 0;
                const avaliacao = getAvaliacaoConceito(g2 > 0 ? g2 : g1);

                // Monta o payload final imitando o que o app faz
                const finalPayload: DocumentLog = {
                    id: `bol_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    type: 'BOLETIM',
                    title: `Boletim - ${finalStudentName}`,
                    description: `Boletim enviado via portal público. Classificação: ${ocrResult.periodType || 'PARCIAL'}`,
                    fileUrl: base64, // ideal era storage cloud, mas usa base64 como fallback igual resto do projeto
                    metaData: {
                        studentName: finalStudentName,
                        grade1: g1,
                        attendance1: ocrResult.attendance1,
                        grade2: g2,
                        attendance2: ocrResult.attendance2,
                        periodType: ocrResult.periodType,
                        status: (g2 && g1 && g2 > g1) ? 'MELHORA'
                            : (g2 && g1 && g2 < g1) ? 'PIORA'
                                : 'MANTEVE',
                        avaliacao: avaliacao
                    }
                };

                onSave(finalPayload);
            };

        } catch (err) {
            console.error(err);
            setErrorStatus("Erro ao processar o arquivo. Tente novamente.");
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 max-w-lg mx-auto mt-6 animate-fade-in">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-gray-800">Envio de Boletim Escolar</h2>
                <p className="text-sm text-gray-500 mt-2">Envie a foto ou o PDF do boletim do aluno. Nosso sistema lerá os dados automaticamente.</p>
            </div>

            {errorStatus && (
                <div className="mb-4 bg-red-50 text-red-600 text-sm font-medium p-3 rounded-lg border border-red-100 flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {errorStatus}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Aluno (Opcional)</label>
                    <input
                        type="text"
                        placeholder="Se vazio, tentaremos ler do documento"
                        value={inputName}
                        onChange={e => setInputName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Anexar Documento</label>

                    {!selectedFile ? (
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer flex flex-col items-center justify-center gap-3"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex justify-center items-center text-blue-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            </div>
                            <div>
                                <span className="font-bold text-blue-600">Clique para anexar</span>
                                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 10MB)</p>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 flex flex-col gap-3">
                            {previewUrl && (
                                <div className="h-40 w-full rounded-xl border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                                    {selectedFile.type.includes('image') ? (
                                        <img src={previewUrl} className="max-h-full max-w-full object-contain" alt="Preview do Boletim" />
                                    ) : (
                                        <div className="text-center text-gray-400 font-medium flex flex-col items-center gap-2">
                                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                            Arquivo PDF
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex items-center justify-between px-1">
                                <div className="text-sm font-semibold text-gray-700 truncate max-w-[200px]">{selectedFile.name}</div>
                                <button
                                    onClick={cancelSelection}
                                    disabled={loading}
                                    className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-widest disabled:opacity-50"
                                >
                                    Remover
                                </button>
                            </div>
                        </div>
                    )}

                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        accept=".pdf,image/*"
                        onChange={handleFileChange}
                        disabled={loading}
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!selectedFile || loading}
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processando Documento...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Enviar Boletim do Aluno
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
