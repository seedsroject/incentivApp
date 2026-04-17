import React, { useState, useMemo, useRef, useCallback } from 'react';
import { StudentDraft, DocumentLog, Nucleo } from '../types';

interface ServicoSocialDashboardProps {
    students: StudentDraft[];
    history: DocumentLog[];
    nucleos: Nucleo[];
    onBack: () => void;
    onUpdateHistory: (docs: DocumentLog[]) => void;
}

export const ServicoSocialDashboard: React.FC<ServicoSocialDashboardProps> = ({
    students,
    history,
    nucleos,
    onBack,
    onUpdateHistory
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterNucleo, setFilterNucleo] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<StudentDraft | null>(null);
    const [isRestrictedAreaOpen, setIsRestrictedAreaOpen] = useState(false);
    const [isEnteringPassword, setIsEnteringPassword] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [newReportText, setNewReportText] = useState('');
    const [birthdayCardStudent, setBirthdayCardStudent] = useState<StudentDraft | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    // --- BIRTHDAY DETECTION ---
    const todayBirthdays = useMemo(() => {
        const today = new Date();
        const d = today.getDate();
        const m = today.getMonth() + 1;
        return students.filter(s => {
            if (s.status === 'INATIVO' || !s.data_nascimento) return false;
            try {
                // Supports dd/mm/yyyy or yyyy-mm-dd
                let bDay: number, bMonth: number;
                if (s.data_nascimento.includes('/')) {
                    const parts = s.data_nascimento.split('/');
                    bDay = parseInt(parts[0], 10);
                    bMonth = parseInt(parts[1], 10);
                } else {
                    const dt = new Date(s.data_nascimento);
                    bDay = dt.getDate();
                    bMonth = dt.getMonth() + 1;
                }
                return bDay === d && bMonth === m;
            } catch { return false; }
        });
    }, [students]);

    const handleSendWhatsApp = useCallback((student: StudentDraft) => {
        let phone = (student.telefone || '').replace(/\D/g, '');
        if (phone.length === 11) phone = '55' + phone;
        else if (phone.length === 10) phone = '55' + phone;
        else if (!phone.startsWith('55')) phone = '55' + phone;
        const msg = encodeURIComponent(
            `🎂 Feliz Aniversário, ${student.nome?.split(' ')[0]}! 🎉\n\nHoje é um dia muito especial... é o SEU ANIVERSÁRIO!\n\nNós, da Escolinha de Triathlon Formando Campeões, não poderíamos deixar essa data passar em branco. Parabéns! Que seu novo ano seja cheio de vitórias!\n\nCom carinho,\nEquipe Escolinha de Triathlon Formando Campeões`
        );
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    }, []);

    // --- ALERTS LOGIC ---
    // A student gets a red border if they have >= 3 absences in any historical record OR an OCORRENCIA_DISCIPLINAR
    const studentAlerts = useMemo(() => {
        const alerts = new Set<string>();
        students.forEach(student => {
            const studentDocs = history.filter(doc => doc.metaData?.studentName === (student?.nome || ''));

            let hasAlert = false;
            for (const doc of studentDocs) {
                if (doc.type === 'OCORRENCIA_DISCIPLINAR') {
                    hasAlert = true;
                    break;
                }

                // Check absences in boletim/attendance records
                if (doc.type === 'BOLETIM' || doc.type === 'RELATORIO_ASSIDUIDADE') {
                    const subjects = doc.metaData?.subjects || [];
                    for (const subj of subjects) {
                        if ((subj.f1 || 0) >= 3 || (subj.f2 || 0) >= 3 || (subj.f3 || 0) >= 3 || (subj.f4 || 0) >= 3) {
                            hasAlert = true;
                            break;
                        }
                    }
                }
                if (hasAlert) break;
            }
            if (hasAlert && student?.id) alerts.add(student.id);
        });
        return alerts;
    }, [students, history]);

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            if (s.status === 'INATIVO') return false;
            if (filterNucleo && s.nucleo_id !== filterNucleo) return false;
            if (searchTerm && !(s.nome || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        });
    }, [students, filterNucleo, searchTerm]);

    const handleVerifyPassword = () => {
        if (passwordInput === 'social123') {
            setIsRestrictedAreaOpen(true);
            setIsEnteringPassword(false);
            setPasswordInput('');
            setPasswordError(false);
        } else {
            setPasswordError(true);
        }
    };

    const handleSaveReport = () => {
        if (!selectedStudent || !newReportText.trim()) return;

        const newDoc: DocumentLog = {
            id: `soc_${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'RELATORIO_SOCIAL',
            title: `Atendimento / Relatório Social`,
            description: `Registro sigiloso - Serviço Social`,
            metaData: {
                studentName: selectedStudent?.nome || '',
                text: newReportText
            }
        };

        onUpdateHistory([...history, newDoc]);
        setNewReportText('');
        alert('Relatório sigiloso salvo com sucesso no histórico.');
    };

    const socialReports = useMemo(() => {
        if (!selectedStudent) return [];
        return history
            .filter(d => d.type === 'RELATORIO_SOCIAL' && d.metaData?.studentName === (selectedStudent?.nome || ''))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [history, selectedStudent]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* CABEÇALHO */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10 border-b border-gray-200">
                <div className="w-full flex items-center gap-4">
                    <button onClick={onBack} className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1 font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                        Voltar
                    </button>
                    <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center">
                        Serviço Social
                    </h1>
                </div>
            </div>

            {/* CONTEÚDO */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Filtros */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Buscar aluno por nome..."
                            className="flex-1 border p-2 rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="border p-2 rounded-lg border-gray-300 bg-white min-w-[200px]"
                            value={filterNucleo}
                            onChange={e => setFilterNucleo(e.target.value)}
                        >
                            <option value="">Todos os Núcleos</option>
                            {nucleos.map(n => <option key={n.id} value={n.id}>{n.nome}</option>)}
                        </select>
                    </div>

                    {/* 🎂 BIRTHDAY BANNER */}
                    {todayBirthdays.length > 0 && (
                        <div className="bg-gradient-to-r from-yellow-50 via-pink-50 to-purple-50 border border-pink-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-3xl">🎂</span>
                                <div>
                                    <h2 className="text-lg font-bold text-pink-700">Aniversariantes de Hoje!</h2>
                                    <p className="text-xs text-pink-500">{todayBirthdays.length} aluno(s) fazem aniversário hoje</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {todayBirthdays.map(s => (
                                    <div key={s.id} className="bg-white rounded-lg p-3 border border-pink-100 flex items-center gap-3 shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">🎉</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-800 text-sm truncate">{s.nome}</p>
                                            <p className="text-[10px] text-gray-500">{s.data_nascimento}</p>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <button onClick={() => setBirthdayCardStudent(s)} className="bg-pink-100 hover:bg-pink-200 text-pink-700 p-2 rounded-lg transition-colors" title="Ver Cartinha">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            </button>
                                            <button onClick={() => handleSendWhatsApp(s)} className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors" title="Enviar via WhatsApp">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.236-1.208l-.304-.18-2.871.853.768-2.806-.198-.314A8 8 0 1112 20z"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Grid de Alunos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStudents.map(student => {
                            const nucleo = nucleos.find(n => n.id === student.nucleo_id);
                            const isAlert = student?.id ? studentAlerts.has(student.id) : false;

                            return (
                                <div
                                    key={student.id}
                                    className={`bg-white rounded-2xl p-5 cursor-pointer hover:shadow-md transition-shadow flex flex-col gap-3 relative overflow-hidden ${isAlert ? 'border-2 border-red-500 shadow-red-100 ring-2 ring-red-50' : 'border border-gray-200'}`}
                                    onClick={() => { setSelectedStudent(student); setIsRestrictedAreaOpen(false); setIsEnteringPassword(false); setPasswordInput(''); setPasswordError(false); }}
                                >
                                    {isAlert && (
                                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            Alerta / Aviso
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
                                            {(student?.nome || 'A').charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 leading-tight pr-12">{student.nome}</h3>
                                            <p className="text-xs text-gray-500">{nucleo?.nome || student.nucleo_id}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-2 space-y-1">
                                        <p><span className="font-semibold">Responsável:</span> {student.nome_responsavel}</p>
                                        <p><span className="font-semibold">Escola:</span> {student.escola_nome}</p>
                                    </div>
                                    <div className="mt-auto pt-3 border-t border-gray-100 text-right">
                                        <span className="text-purple-600 text-xs font-bold hover:underline">Ver Dossiê →</span>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredStudents.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                                Nenhum aluno encontrado para este filtro.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL DETALHES DO ALUNO */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in relative">
                        <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 p-2 rounded-full transition-colors z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className={`p-6 border-b flex items-start gap-4 ${selectedStudent?.id && studentAlerts.has(selectedStudent.id) ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="w-16 h-16 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-2xl shadow-md flex-shrink-0">
                                {(selectedStudent?.nome || 'A').charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{selectedStudent?.nome || ''}</h2>
                                <p className="text-gray-600">Responsável: {selectedStudent.nome_responsavel}</p>
                                {selectedStudent?.id && studentAlerts.has(selectedStudent.id) && (
                                    <span className="inline-block mt-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded border border-red-200">⚠️ Faltas Recorrentes ou Ocorrência Registrada</span>
                                )}
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <section>
                                <h3 className="font-bold text-gray-700 uppercase text-xs mb-3 border-b pb-1">Identificação & Contato</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-900 font-medium">
                                    <div><span className="block text-[10px] text-gray-500">Data Nasc.</span> {selectedStudent.data_nascimento}</div>
                                    <div><span className="block text-[10px] text-gray-500">Telefone</span> {selectedStudent.telefone}</div>
                                    <div className="col-span-2"><span className="block text-[10px] text-gray-500">Endereço</span> {selectedStudent.endereco}</div>
                                </div>
                            </section>

                            <section>
                                <h3 className="font-bold text-gray-700 uppercase text-xs mb-3 border-b pb-1">Escolaridade</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-900 font-medium">
                                    <div><span className="block text-[10px] text-gray-500">Nome da Escola</span> {selectedStudent.escola_nome}</div>
                                    <div><span className="block text-[10px] text-gray-500">Rede de Ensino</span> {selectedStudent.escola_tipo}</div>
                                </div>
                            </section>

                            <section className="bg-gray-100 rounded-xl p-5 border border-gray-200">
                                {!isRestrictedAreaOpen ? (
                                    <div className="text-center py-8">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        <h3 className="font-bold text-gray-800 text-lg">Área Protegida</h3>
                                        <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">Esta área contém anotações sensíveis e relatórios da Assistência Social sobre o panorama familiar ou pedagógico do aluno.</p>

                                        {!isEnteringPassword ? (
                                            <button
                                                onClick={() => setIsEnteringPassword(true)}
                                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold shadow transition-colors flex items-center justify-center gap-2 mx-auto"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                Acessar Histórico Sigiloso
                                            </button>
                                        ) : (
                                            <div className="max-w-xs mx-auto animate-fade-in flex flex-col gap-2 relative">
                                                <input
                                                    type="password"
                                                    placeholder="Digite a senha (social123)..."
                                                    value={passwordInput}
                                                    onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
                                                    onKeyDown={e => e.key === 'Enter' && handleVerifyPassword()}
                                                    autoFocus
                                                    className={`border p-2 rounded-lg text-sm text-center focus:outline-none focus:ring-2 ${passwordError ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'}`}
                                                />
                                                {passwordError && <span className="text-red-500 text-xs font-bold absolute -bottom-5 left-0 w-full text-center">Senha Incorreta</span>}
                                                <div className="flex gap-2 mt-2">
                                                    <button onClick={() => { setIsEnteringPassword(false); setPasswordError(false); setPasswordInput(''); }} className="flex-1 py-2 rounded-lg text-sm font-bold text-gray-500 bg-gray-200 hover:bg-gray-300 transition-colors">Cancelar</button>
                                                    <button onClick={handleVerifyPassword} className="flex-1 py-2 rounded-lg text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors">Entrar</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="animate-fade-in">
                                        <h3 className="font-bold text-purple-800 uppercase text-xs mb-4 flex items-center gap-2 border-b border-purple-200 pb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                            Histórico de Atendimentos Pessoais
                                        </h3>

                                        {/* Formulário Novo Relatório */}
                                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 relative">
                                            <label className="block text-xs font-bold text-gray-700 mb-2">Novo Relatório do Serviço Social</label>
                                            <textarea
                                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-purple-500 focus:border-purple-500 min-h-[100px] mb-3"
                                                placeholder="Descreva o atendimento, reunião com os pais ou ocorrência sigilosa..."
                                                value={newReportText}
                                                onChange={e => setNewReportText(e.target.value)}
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={handleSaveReport}
                                                    disabled={!newReportText.trim()}
                                                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 text-sm rounded-lg font-bold shadow-sm transition-colors"
                                                >
                                                    Salvar Registro (Timestamp Automático)
                                                </button>
                                            </div>
                                        </div>

                                        {/* Histórico Anterior */}
                                        <div className="space-y-4">
                                            {socialReports.length === 0 ? (
                                                <div className="text-center text-gray-400 text-sm py-4">Nenhum relatório sigiloso encontrado para este aluno.</div>
                                            ) : (
                                                socialReports.map(report => (
                                                    <div key={report.id} className="bg-yellow-50 p-4 border border-yellow-200 rounded-lg text-sm text-gray-800 shadow-sm relative">
                                                        <div className="text-[10px] uppercase font-bold text-gray-500 mb-2 flex justify-between items-center border-b border-yellow-200/50 pb-1">
                                                            <span>Serviço Social</span>
                                                            <span>{new Date(report.timestamp).toLocaleString('pt-BR')}</span>
                                                        </div>
                                                        <p className="whitespace-pre-wrap">{report.metaData?.text}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {/* BIRTHDAY CARD MODAL */}
            {birthdayCardStudent && (
                <BirthdayCardModal
                    student={birthdayCardStudent}
                    onClose={() => setBirthdayCardStudent(null)}
                    onSendWhatsApp={handleSendWhatsApp}
                    cardRef={cardRef}
                />
            )}
        </div>
    );
};

// ─── BIRTHDAY CARD COMPONENT ───
const BirthdayCardModal: React.FC<{ student: StudentDraft; onClose: () => void; onSendWhatsApp: (s: StudentDraft) => void; cardRef: React.RefObject<HTMLDivElement | null> }> = ({ student, onClose, onSendWhatsApp, cardRef }) => {
    const firstName = student.nome?.split(' ')[0] || 'Aluno';
    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                <div className="flex justify-between items-center p-4 border-b bg-pink-50">
                    <h3 className="font-bold text-pink-700 flex items-center gap-2">🎂 Cartinha de Aniversário</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                {/* CARD */}
                <div ref={cardRef} style={{ background: '#e8f5e9', padding: 28, fontFamily: "'Georgia', serif", fontSize: 15, lineHeight: 2, color: '#1a3a5c', position: 'relative', backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #c8e6c9 31px, #c8e6c9 32px)' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <span style={{ fontSize: 40 }}>🎂</span>
                        <img src="/logo.png" alt="Logo" style={{ height: 60, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span style={{ fontSize: 40 }}>🎁</span>
                    </div>
                    {/* Body */}
                    <p>Hoje é um dia muito especial... é o <strong style={{ color: '#0d47a1', textTransform: 'uppercase', textDecoration: 'underline' }}>SEU ANIVERSÁRIO!</strong></p>
                    <p style={{ marginTop: 8 }}>E nós, da Escolinha de Triathlon Formando Campeões, não poderíamos deixar essa data passar em branco. Queremos te desejar um novo ciclo cheio de conquistas, alegria, saúde e muitos aprendizados dentro e fora do esporte!</p>
                    <p style={{ marginTop: 8 }}>Você faz parte de um time incrível, que acredita no poder do triathlon para transformar vidas. A cada aula, a cada desafio superado, você está construindo algo muito maior: está se tornando um verdadeiro campeão na vida!</p>
                    <p style={{ marginTop: 8 }}>Continue se dedicando, acreditando em você e aproveitando cada momento dessa jornada. Temos muito orgulho de caminhar ao seu lado!</p>
                    <p style={{ marginTop: 8 }}><strong>Parabéns! Que seu novo ano seja cheio de vitórias!</strong></p>
                    <p style={{ marginTop: 16 }}>Com carinho,</p>
                    <p><strong>Equipe Escolinha de Triathlon Formando Campeões</strong></p>
                    <div style={{ position: 'absolute', bottom: 20, right: 20, fontSize: 50 }}>💪</div>
                </div>
                {/* Actions */}
                <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
                    <p className="text-xs text-gray-500">Para: <strong>{firstName}</strong> ({student.telefone})</p>
                    <div className="flex gap-2">
                        <button onClick={() => { if (cardRef.current) { const w = window.open('', '_blank'); if (w) { w.document.write('<html><body>' + cardRef.current.outerHTML + '</body></html>'); w.document.close(); w.print(); } } }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors">🖨️ Imprimir</button>
                        <button onClick={() => onSendWhatsApp(student)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition-colors flex items-center gap-2">📱 Enviar WhatsApp</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
