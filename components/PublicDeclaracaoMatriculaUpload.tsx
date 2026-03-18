import React, { useRef, useState } from 'react';
import { DocumentLog } from '../types';

interface PublicDeclaracaoMatriculaUploadProps {
    studentName?: string;
    onSave: (doc: DocumentLog) => void;
}

export const PublicDeclaracaoMatriculaUpload: React.FC<PublicDeclaracaoMatriculaUploadProps> = ({ studentName, onSave }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorStatus, setErrorStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setErrorStatus(null);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
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
            const doc: DocumentLog = {
                id: Date.now().toString(),
                type: 'DECLARACAO_MATRICULA',
                title: 'Declaração de Matrícula',
                description: `Declaração de matrícula enviada pelo responsável de ${studentName || 'aluno'}`,
                timestamp: new Date().toISOString(),
                fileUrl: previewUrl || undefined,
                metaData: { studentName, uploadedAt: new Date().toISOString() },
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
                /* Preview */
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
            )}

            {errorStatus && (
                <p className="text-red-500 text-sm font-medium mt-3 text-center">{errorStatus}</p>
            )}

            {/* Submit */}
            {selectedFile && (
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
                            Confirmar e Avançar
                        </>
                    )}
                </button>
            )}
        </div>
    );
};
