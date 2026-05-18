import React, { useRef, useState } from 'react';
import { DocumentLog, DeclaracaoMatriculaOCR } from '../types';
import { processDeclaracaoMatricula } from '../services/geminiService';

interface PublicDeclaracaoMatriculaUploadProps {
    studentName?: string;
    onSave: (doc: DocumentLog) => void;
}

const NIVEL_LABELS: Record<string, string> = {
    'FUNDAMENTAL': 'Ensino Fundamental',
    'MEDIO': 'Ensino Médio',
};
const TIPO_LABELS: Record<string, string> = {
    'PUBLICA': '🏛️ Escola Pública',
    'PARTICULAR': '🏫 Escola Particular',
};
const TURNO_LABELS: Record<string, string> = {
    'MATUTINO': '🌅 Matutino',
    'VESPERTINO': '☀️ Vespertino',
    'NOTURNO': '🌙 Noturno',
    'INTEGRAL': '🕐 Integral',
};
const SITUACAO_LABELS: Record<string, string> = {
    'MATRICULADO': '✅ Matriculado',
    'TRANSFERIDO': '🔄 Transferido',
    'FREQUENTANDO': '📚 Frequentando',
};
// Helper to check if OCR value is meaningful (not empty, not DESCONHECIDO)
const hasValue = (val?: string) => !!val && val !== 'DESCONHECIDO';

export const PublicDeclaracaoMatriculaUpload: React.FC<PublicDeclaracaoMatriculaUploadProps> = ({ studentName, onSave }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [ocrProcessing, setOcrProcessing] = useState(false);
    const [ocrData, setOcrData] = useState<DeclaracaoMatriculaOCR | null>(null);
    const [errorStatus, setErrorStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        setSelectedFile(file);
        setErrorStatus(null);
        setOcrData(null);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setPreviewUrl(base64);

            // Auto-run OCR
            setOcrProcessing(true);
            try {
                const result = await processDeclaracaoMatricula(base64, file.type || 'image/jpeg');
                setOcrData(result);
            } catch (err) {
                console.error('OCR failed:', err);
                setErrorStatus('OCR não conseguiu extrair os dados. Você pode salvar mesmo assim.');
            } finally {
                setOcrProcessing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const cancelSelection = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setOcrData(null);
        setOcrProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            setErrorStatus('Por favor, tire uma foto ou anexe a declaração de matrícula.');
            return;
        }
        setLoading(true);
        try {
            const finalName = ocrData?.nomeAluno || studentName || 'aluno';
            const doc: DocumentLog = {
                id: Date.now().toString(),
                type: 'DECLARACAO_MATRICULA',
                title: `Declaração de Matrícula - ${finalName}`,
                description: `Declaração de matrícula escolar de ${finalName}${ocrData?.nomeEscola ? ` — ${ocrData.nomeEscola}` : ''}`,
                timestamp: new Date().toISOString(),
                fileUrl: previewUrl || undefined,
                metaData: {
                    studentName: finalName,
                    uploadedAt: new Date().toISOString(),
                    imageUrl: previewUrl,
                    ocrData: ocrData || undefined,
                    // Flatten key fields for easy access
                    escolaNome: ocrData?.nomeEscola || '',
                    escolaTipo: ocrData?.tipoEscola || '',
                    nivelEnsino: ocrData?.nivelEnsino || '',
                    anoSerie: ocrData?.anoSerie || '',
                    turno: ocrData?.turno || '',
                },
            };
            onSave(doc);
        } catch (err) {
            setErrorStatus('Erro ao enviar o arquivo. Tente novamente.');
            setLoading(false);
        }
    };

    return (
        <div className="px-4 py-6 max-w-xl mx-auto">
            {/* Instrução */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 flex-shrink-0 bg-blue-50 rounded-xl flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-base mb-1">Declaração de Matrícula Escolar</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Tire uma foto ou faça o upload da declaração de matrícula do(a) aluno(a) em escola regular.
                            A <strong>inteligência artificial</strong> irá extrair automaticamente os dados do documento.
                            {studentName && <span className="font-semibold text-gray-700"> Aluno(a): {studentName}.</span>}
                        </p>
                    </div>
                </div>
            </div>

            {/* Upload area */}
            {!selectedFile ? (
                <div className="space-y-3">
                    {/* Camera button */}
                    <label className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-400 cursor-pointer transition-colors group">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-sm">Tirar Foto com a Câmera</p>
                            <p className="text-xs text-gray-400">Aponte para o documento e fotografe</p>
                        </div>
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>

                    {/* File upload button */}
                    <label className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 cursor-pointer transition-colors group">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-sm">Carregar do Dispositivo</p>
                            <p className="text-xs text-gray-400">Imagem ou PDF da declaração</p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>
                </div>
            ) : (
                /* Preview + OCR Results */
                <div className="space-y-4">
                    {/* Image Preview */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        {previewUrl && selectedFile.type.startsWith('image/') && (
                            <img src={previewUrl} alt="Declaração" className="w-full max-h-72 object-contain bg-gray-50" />
                        )}
                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-800 truncate max-w-[200px]">{selectedFile.name}</p>
                                <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                            </div>
                            <button
                                type="button"
                                onClick={cancelSelection}
                                className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                Remover
                            </button>
                        </div>
                    </div>

                    {/* OCR Processing State */}
                    {ocrProcessing && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                <span className="text-blue-700 font-bold text-sm">Analisando documento com IA...</span>
                            </div>
                            <p className="text-xs text-blue-500">Extraindo dados da declaração de matrícula</p>
                        </div>
                    )}

                    {/* OCR Results Card */}
                    {ocrData && !ocrProcessing && (
                        <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
                            <div className="bg-green-50 px-5 py-3 border-b border-green-200 flex items-center gap-2">
                                <span className="text-lg">🤖</span>
                                <span className="font-bold text-green-800 text-sm">Dados Extraídos via IA</span>
                                {ocrData.nomeAluno && <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">✓ Sucesso</span>}
                            </div>
                            <div className="p-4 space-y-3">
                                {/* Student Info */}
                                {ocrData.nomeAluno && (
                                    <div className="flex items-start gap-3">
                                        <span className="text-lg flex-shrink-0">👤</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-400 font-bold uppercase">Aluno(a)</p>
                                            <p className="text-sm font-bold text-gray-800 truncate">{ocrData.nomeAluno}</p>
                                        </div>
                                    </div>
                                )}

                                {/* School Info */}
                                {ocrData.nomeEscola && (
                                    <div className="flex items-start gap-3">
                                        <span className="text-lg flex-shrink-0">🏫</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-400 font-bold uppercase">Escola</p>
                                            <p className="text-sm font-bold text-gray-800">{ocrData.nomeEscola}</p>
                                            {hasValue(ocrData.tipoEscola) && (
                                                <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${ocrData.tipoEscola === 'PUBLICA' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                    {TIPO_LABELS[ocrData.tipoEscola] || ocrData.tipoEscola}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Education Level + Grade */}
                                <div className="grid grid-cols-2 gap-3">
                                    {hasValue(ocrData.nivelEnsino) && (
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Nível de Ensino</p>
                                            <p className="text-sm font-bold text-gray-800">
                                                {ocrData.nivelEnsino === 'FUNDAMENTAL' ? '📘' : '📗'} {NIVEL_LABELS[ocrData.nivelEnsino] || ocrData.nivelEnsino}
                                            </p>
                                        </div>
                                    )}
                                    {ocrData.anoSerie && (
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Ano / Série</p>
                                            <p className="text-sm font-bold text-gray-800">📐 {ocrData.anoSerie}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Turno + Turma */}
                                <div className="grid grid-cols-2 gap-3">
                                    {hasValue(ocrData.turno) && (
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Turno</p>
                                            <p className="text-sm font-bold text-gray-800">{TURNO_LABELS[ocrData.turno] || ocrData.turno}</p>
                                        </div>
                                    )}
                                    {ocrData.turma && (
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Turma</p>
                                            <p className="text-sm font-bold text-gray-800">🔤 {ocrData.turma}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Optional fields in compact grid */}
                                {(ocrData.anoLetivo || ocrData.matriculaNumero || hasValue(ocrData.situacaoAluno) || ocrData.dataNascimento) && (
                                    <div className="border-t border-gray-100 pt-3 space-y-2">
                                        <p className="text-xs text-gray-400 font-bold uppercase">Dados Complementares</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {ocrData.dataNascimento && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <span>🎂</span> <span className="font-semibold">{ocrData.dataNascimento}</span>
                                                </div>
                                            )}
                                            {ocrData.anoLetivo && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <span>📅</span> Ano Letivo: <span className="font-semibold">{ocrData.anoLetivo}</span>
                                                </div>
                                            )}
                                            {ocrData.matriculaNumero && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <span>🔢</span> Matrícula: <span className="font-semibold">{ocrData.matriculaNumero}</span>
                                                </div>
                                            )}
                                            {hasValue(ocrData.situacaoAluno) && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <span>{SITUACAO_LABELS[ocrData.situacaoAluno as string] || ocrData.situacaoAluno}</span>
                                                </div>
                                            )}
                                            {ocrData.nomeResponsavel && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600 col-span-2">
                                                    <span>👨‍👩‍👦</span> Responsável: <span className="font-semibold">{ocrData.nomeResponsavel}</span>
                                                </div>
                                            )}
                                            {ocrData.cidadeEstado && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600 col-span-2">
                                                    <span>📍</span> <span className="font-semibold">{ocrData.cidadeEstado}</span>
                                                </div>
                                            )}
                                            {ocrData.rgCpf && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600 col-span-2">
                                                    <span>🪪</span> RG/CPF: <span className="font-semibold">{ocrData.rgCpf}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Observações */}
                                {ocrData.observacoes && (
                                    <div className="border-t border-gray-100 pt-3">
                                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Observações</p>
                                        <p className="text-xs text-gray-600 leading-relaxed">{ocrData.observacoes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {errorStatus && (
                <p className="text-red-500 text-sm font-medium mt-3 text-center">{errorStatus}</p>
            )}

            {/* Submit */}
            {selectedFile && !ocrProcessing && (
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`mt-4 w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${loading
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-lg shadow-green-100'
                        }`}
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Enviando...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {ocrData?.nomeAluno ? `Confirmar — ${ocrData.nomeAluno}` : 'Confirmar e Avançar'}
                        </>
                    )}
                </button>
            )}
        </div>
    );
};
