
import React, { useState, useMemo } from 'react';
import { DocumentLog, DocumentType, SchoolReportItem, AttendanceReportItem, FrequencyListItem, StudentDraft, PDFItemType, InventoryItem, SubjectGrade, Nucleo } from '../types';
import { processSchoolReport, processAttendanceReport, processFrequencyList } from '../services/geminiService';
import { normalizeStudentName } from '../services/dataMergeService';
import leiDocImg from '../assets/lei_do_incentivo.png';
import { SmartCamera } from './SmartCamera';

interface DocumentUploadProps {
    docType: DocumentType;
    title: string;
    students?: StudentDraft[];
    history?: DocumentLog[];
    inventory?: InventoryItem[];
    nucleos?: Nucleo[];          // Lista de núcleos para obter informações de agenda
    currentNucleoId?: string;   // ID do núcleo atual (para exibir agenda na chamada)
    onBack: () => void;
    onSave: (data: DocumentLog) => void;
    onUpdateHistory?: (docs: DocumentLog[]) => void;
}

type Mode = 'MENU'
    | 'CAMERA'
    | 'FORM'
    | 'BOLETIM_MASS_UPLOAD' | 'BOLETIM_PREVIEW' | 'BOLETIM_VIEW'
    | 'ATTENDANCE_MASS_UPLOAD' | 'ATTENDANCE_PREVIEW' | 'ATTENDANCE_VIEW'
    | 'FREQUENCY_OPTIONS' | 'FREQUENCY_DIGITAL' | 'FREQUENCY_MASS_UPLOAD' | 'FREQUENCY_PREVIEW' | 'FREQUENCY_CONSOLIDATED'
    | 'DECLARACAO_MENU' | 'DECLARACAO_CAMERA' | 'DECLARACAO_VIEW';

// Disciplinas padrão para fallback caso o OCR falhe
const DEFAULT_SUBJECTS = [
    "Língua Portuguesa", "Arte", "Educação Física", "Língua Inglesa",
    "Matemática", "Ciências", "Geografia", "História", "Ensino Religioso"
];

// Helper para converter base64 da câmera em objeto File
const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

// Helper para calcular média de uma lista de notas (ignorando nulos)
const calculateAverage = (values: (number | null | undefined)[]) => {
    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v as number)) as number[];
    if (validValues.length === 0) return 0;
    const sum = validValues.reduce((a, b) => a + b, 0);
    return sum / validValues.length;
};

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ docType, title, students = [], history = [], inventory = [], nucleos = [], currentNucleoId, onBack, onSave, onUpdateHistory }: DocumentUploadProps) => {
    // Inicialização do Modo baseado no Tipo de Documento
    const [mode, setMode] = useState<Mode>(() => {
        if (docType === 'BOLETIM') return 'BOLETIM_MASS_UPLOAD';
        if (docType === 'RELATORIO_ASSIDUIDADE') return 'ATTENDANCE_MASS_UPLOAD';
        if (docType === 'LISTA_FREQUENCIA') return 'FREQUENCY_OPTIONS';
        if (docType === 'DECLARACAO_MATRICULA') return 'DECLARACAO_MENU';
        return 'MENU';
    });

    const [previousMode, setPreviousMode] = useState<Mode>('MENU');

    // Standard Form Data
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [finalImage, setFinalImage] = useState<string | null>(null);

    // Declaração Data
    const [studentName, setStudentName] = useState('');
    const [declaracaoFilter, setDeclaracaoFilter] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<DocumentLog | null>(null);

    // Boletim Data
    const [reportFiles, setReportFiles] = useState<File[]>([]);
    const [processedReports, setProcessedReports] = useState<SchoolReportItem[]>([]);

    // Boletim View Filters
    const [boletimFilterName, setBoletimFilterName] = useState('');
    const [boletimFilterDate, setBoletimFilterDate] = useState('');

    // Attendance Data
    const [attendanceFiles, setAttendanceFiles] = useState<File[]>([]);
    const [processedAttendance, setProcessedAttendance] = useState<AttendanceReportItem[]>([]);
    const [attendanceFilterName, setAttendanceFilterName] = useState('');
    const [attendanceFilterNucleoId, setAttendanceFilterNucleoId] = useState('');
    const [selectedAttendanceItem, setSelectedAttendanceItem] = useState<AttendanceReportItem | null>(null);
    const [isEditingDetalhado, setIsEditingDetalhado] = useState(false);
    const [editingSubjects, setEditingSubjects] = useState<SubjectGrade[]>([]);

    // Global Table Editing for Attendance
    const [isEditingTable, setIsEditingTable] = useState(false);
    const [editData, setEditData] = useState<Record<string, { grade1: number | null, grade2: number | null }>>({});

    // Frequency Data
    const [frequencyFiles, setFrequencyFiles] = useState<File[]>([]);
    const [processedFrequency, setProcessedFrequency] = useState<FrequencyListItem[]>([]);
    
    // Chamada Digital State
    const [digitalCallMap, setDigitalCallMap] = useState<Record<string, { present: boolean, items: string[] }>>({});
    const [callDate, setCallDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedInventoryItems, setSelectedInventoryItems] = useState<string[]>([]);
    const [distributeItem, setDistributeItem] = useState(false);
    const [selectedTurmaFilter, setSelectedTurmaFilter] = useState(''); // '' = todas as turmas

    // Turma filter - filteredByTurma (safe - only depends on students/selectedTurmaFilter)
    const filteredByTurma = useMemo(() =>
        selectedTurmaFilter ? (students || []).filter(s => s.turma_id === selectedTurmaFilter) : (students || []),
        [students, selectedTurmaFilter]
    );

    // Relatório Consolidado State
    const [viewMonth, setViewMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [expectedClasses, setExpectedClasses] = useState(8); // Default 8 aulas/mês

    const [processingIndex, setProcessingIndex] = useState<number>(-1);
    const [isUploading, setIsUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    // --- HELPERS ---
    const monthDates = useMemo(() => {
        const [year, month] = viewMonth.split('-').map(Number);
        const days = [];
        const date = new Date(year, month - 1, 1);
        while (date.getMonth() === month - 1) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [viewMonth]);

    const handleDragStart = (e: React.DragEvent, type: PDFItemType | 'TABLE_FREQUENCY_MONTHLY', data: any, dragTitle: string) => {
        const payload = { type, data, title: dragTitle };
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const declaracaoHistory = useMemo(() =>
        history?.filter(d => d.type === 'DECLARACAO_MATRICULA') || [],
        [history]);

    const consolidatedBoletins = useMemo(() => {
        if (!history) return [];
        const boletimDocs = history.filter(doc => doc.type === 'BOLETIM');

        const allItems = boletimDocs.flatMap(doc => {
            let reports: SchoolReportItem[] = [];

            if (doc.metaData?.reports && Array.isArray(doc.metaData.reports)) {
                reports = doc.metaData.reports as SchoolReportItem[];
            }
            else if (doc.metaData && doc.metaData.studentName) {
                reports = [{
                    id: doc.id || `bol_ext_${Date.now()}`,
                    fileName: doc.title || 'Boletim Upload Externo',
                    studentName: doc.metaData.studentName,
                    grade1: doc.metaData.grade1 || 0,
                    attendance1: doc.metaData.attendance1 || 0,
                    grade2: doc.metaData.grade2 || 0,
                    attendance2: doc.metaData.attendance2 || 0,
                    periodType: doc.metaData.periodType || 'PARCIAL',
                    status: doc.metaData.status || 'MANTEVE',
                    avaliacao: doc.metaData.avaliacao
                }];
            }
            return reports.map(r => ({ ...r, originalDate: doc.timestamp, docTitle: doc.title }));
        });

        // Agrupar por aluno para mesclar PARCIAL e FINAL
        const groupedMap = allItems.reduce((acc, curr) => {
            const key = (curr.studentName || '').trim().toLowerCase();
            if (!key) return acc;

            if (!acc[key]) {
                acc[key] = { ...curr };
            } else {
                const existing = acc[key];
                // Se curr for FINAL, ele sobrepõe notas do 2 semestre e status.
                if (curr.periodType === 'FINAL') {
                    existing.grade2 = curr.grade2 || existing.grade2;
                    existing.attendance2 = curr.attendance2 || existing.attendance2;
                    existing.periodType = 'FINAL';
                    existing.avaliacao = curr.avaliacao || existing.avaliacao;
                    existing.originalDate = curr.originalDate; // Traz data do documento mais recente
                } else if (existing.periodType !== 'FINAL') {
                    // Se chegar outro PARCIAL e ainda for PARCIAL, tenta cobrir os vazios
                    if (!existing.grade1 && curr.grade1) existing.grade1 = curr.grade1;
                    if (!existing.grade2 && curr.grade2) existing.grade2 = curr.grade2;
                } else {
                    // Se curr for PARCIAL mas já existe um FINAL, o PARCIAL pode atualizar os dados do 1º semestre
                    if (curr.grade1 && !existing.grade1) existing.grade1 = curr.grade1;
                    if (curr.attendance1 && !existing.attendance1) existing.attendance1 = curr.attendance1;
                }

                // Recalcula status geral 
                if (existing.grade2 && existing.grade1) {
                    existing.status = existing.grade2 > existing.grade1 ? 'MELHORA' : existing.grade2 < existing.grade1 ? 'PIORA' : 'MANTEVE';
                }
            }
            return acc;
        }, {} as Record<string, SchoolReportItem>);

        const mergedList = Object.values(groupedMap);

        return mergedList.filter(item => {
            const matchName = boletimFilterName ? (item.studentName || '').toLowerCase().includes(boletimFilterName.toLowerCase()) : true;
            const matchDate = boletimFilterDate ? (item.originalDate || '').startsWith(boletimFilterDate) : true;
            return matchName && matchDate;
        });
    }, [history, boletimFilterName, boletimFilterDate]);

    const consolidatedAttendance = useMemo(() => {
        if (!history) return [];
        const attendanceDocs = history.filter(doc => doc.type === 'RELATORIO_ASSIDUIDADE' && doc.metaData?.attendance && Array.isArray(doc.metaData.attendance));
        const attendanceItems = attendanceDocs.flatMap(doc => {
            const items = doc.metaData.attendance as AttendanceReportItem[];
            return items.map(r => ({ ...r, originalDate: doc.timestamp, docTitle: doc.title }));
        });

        const boletimDocs = history.filter(doc => doc.type === 'BOLETIM');
        const boletimItems = boletimDocs.flatMap(doc => {
            let reports: SchoolReportItem[] = [];
            if (doc.metaData?.reports && Array.isArray(doc.metaData.reports)) {
                reports = doc.metaData.reports as SchoolReportItem[];
            }
            else if (doc.metaData && doc.metaData.studentName) {
                reports = [{
                    id: doc.id || `bol_ext_${Date.now()}`,
                    fileName: doc.title || 'Boletim Upload Externo',
                    studentName: doc.metaData.studentName,
                    grade1: doc.metaData.grade1 || 0,
                    attendance1: doc.metaData.attendance1 || 0,
                    grade2: doc.metaData.grade2 || 0,
                    attendance2: doc.metaData.attendance2 || 0,
                    periodType: doc.metaData.periodType || 'PARCIAL',
                    status: doc.metaData.status || 'MANTEVE',
                    avaliacao: doc.metaData.avaliacao,
                    subjects: doc.metaData.subjects || []
                }];
            }
            return reports.map(r => ({ ...r, originalDate: doc.timestamp, docTitle: doc.title } as AttendanceReportItem));
        });

        const allItems = [...attendanceItems, ...boletimItems];

        // Agrupar por aluno para mesclar PARCIAL e FINAL
        const groupedMap = allItems.reduce((acc, curr) => {
            const key = (curr.studentName || '').trim().toLowerCase();
            if (!key) return acc;

            if (!acc[key]) {
                acc[key] = { ...curr };
            } else {
                const existing = acc[key];

                // Helper to merge subjects without losing 1st or 2nd semester data
                const mergeSubjects = (target: SubjectGrade[] | undefined, source: SubjectGrade[] | undefined) => {
                    if (!source || source.length === 0) return target || [];
                    if (!target || target.length === 0) return source;

                    const merged = [...target];
                    source.forEach(srcSubj => {
                        const existingSubj = merged.find(t => t.discipline.toLowerCase() === srcSubj.discipline.toLowerCase());
                        if (existingSubj) {
                            if (srcSubj.b1 !== null && srcSubj.b1 !== undefined) existingSubj.b1 = srcSubj.b1;
                            if (srcSubj.f1 !== null && srcSubj.f1 !== undefined) existingSubj.f1 = srcSubj.f1;
                            if (srcSubj.b2 !== null && srcSubj.b2 !== undefined) existingSubj.b2 = srcSubj.b2;
                            if (srcSubj.f2 !== null && srcSubj.f2 !== undefined) existingSubj.f2 = srcSubj.f2;
                            if (srcSubj.b3 !== null && srcSubj.b3 !== undefined) existingSubj.b3 = srcSubj.b3;
                            if (srcSubj.f3 !== null && srcSubj.f3 !== undefined) existingSubj.f3 = srcSubj.f3;
                            if (srcSubj.b4 !== null && srcSubj.b4 !== undefined) existingSubj.b4 = srcSubj.b4;
                            if (srcSubj.f4 !== null && srcSubj.f4 !== undefined) existingSubj.f4 = srcSubj.f4;
                        } else {
                            merged.push({ ...srcSubj });
                        }
                    });
                    return merged;
                };

                // Se curr for FINAL, ele sobrepõe notas do 2 semestre e status.
                if (curr.periodType === 'FINAL') {
                    existing.grade2 = curr.grade2 || existing.grade2;
                    existing.attendance2 = curr.attendance2 || existing.attendance2;
                    existing.periodType = 'FINAL';
                    existing.avaliacao = curr.avaliacao || existing.avaliacao;
                    existing.originalDate = curr.originalDate; // Traz data do documento mais recente
                    // Merge subjects safely
                    existing.subjects = mergeSubjects(existing.subjects, curr.subjects);
                } else if (existing.periodType !== 'FINAL') {
                    // Se chegar outro PARCIAL e ainda for PARCIAL, tenta cobrir os vazios
                    if (!existing.grade1 && curr.grade1) existing.grade1 = curr.grade1;
                    if (!existing.grade2 && curr.grade2) existing.grade2 = curr.grade2;
                    existing.subjects = mergeSubjects(existing.subjects, curr.subjects);
                } else {
                    // Se curr for PARCIAL mas já existe um FINAL, o PARCIAL pode atualizar os dados do 1º semestre
                    if (curr.grade1 && !existing.grade1) existing.grade1 = curr.grade1;
                    if (curr.attendance1 && !existing.attendance1) existing.attendance1 = curr.attendance1;
                    existing.subjects = mergeSubjects(existing.subjects, curr.subjects);
                }

                // Recalcula status geral 
                if (existing.grade2 && existing.grade1) {
                    existing.status = existing.grade2 > existing.grade1 ? 'MELHORA' : existing.grade2 < existing.grade1 ? 'PIORA' : 'MANTEVE';
                }
            }
            return acc;
        }, {} as Record<string, AttendanceReportItem>);

        const mergedList = Object.values(groupedMap);

        return mergedList.filter(item => {
            const studentData = students.find(s => normalizeStudentName(s.nome) === normalizeStudentName(item.studentName));
            const matchName = attendanceFilterName ? item.studentName.toLowerCase().includes(attendanceFilterName.toLowerCase()) : true;
            const matchNucleo = attendanceFilterNucleoId ? studentData?.nucleo_id === attendanceFilterNucleoId : true;
            return matchName && matchNucleo;
        });
    }, [history, attendanceFilterName, attendanceFilterNucleoId, students]);

    // Determinar se a relação de Assiduidade é PARCIAL ou FINAL
    // Se houver mais de 50% dos alunos (com dados) tendo notas de 4º bimestre
    const relationPeriod = useMemo(() => {
        if (consolidatedAttendance.length === 0) return 'PARCIAL';
        const totalWithGrade2 = consolidatedAttendance.filter(item => item.grade2 && item.grade2 > 0).length;
        if ((totalWithGrade2 / consolidatedAttendance.length) > 0.5) return 'FINAL';
        return 'PARCIAL';
    }, [consolidatedAttendance]);

    const consolidatedFrequencyData = useMemo(() => {
        // Ordena alunos
        const sortedStudents = [...students].sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

        // Filtra documentos do mês selecionado
        const monthDocs = history.filter(doc =>
            doc.type === 'LISTA_FREQUENCIA' &&
            doc.metaData &&
            doc.metaData.date &&
            typeof doc.metaData.date === 'string' &&
            doc.metaData.date.startsWith(viewMonth)
        ).sort((a, b) => (a.metaData.date || '').localeCompare(b.metaData.date || ''));

        // Dias que tiveram aula (headers)
        const classDates = monthDocs.map(d => {
            const parts = d.metaData.date.split('-');
            return `${parts[2]}/${parts[1]}`;
        });

        const rows = sortedStudents.map(student => {
            const daysStatus = monthDocs.map((doc) => {
                if (doc.metaData.present?.includes(student.nome)) return 'PP'; // Presente
                // Se não está na lista de presentes, assumimos falta se o documento existe
                return 'FF';
            });

            const presences = daysStatus.filter(s => s === 'PP').length;
            const absences = daysStatus.filter(s => s === 'FF').length;

            // Porcentagem baseada nas Aulas Previstas (input manual) ou nas Aulas Dadas (docs encontrados)
            const totalClassesConsidered = Math.max(monthDocs.length, expectedClasses);
            const freqPercent = totalClassesConsidered > 0 ? Math.round((presences / totalClassesConsidered) * 100) : 0;

            return { student, daysStatus, stats: { presences, absences, freqPercent } };
        });

        return { headers: classDates, rows };
    }, [students, viewMonth, history, expectedClasses]);

    // Funções auxiliares para avaliar a nota (Escala 0 a 10)
    // Bom: 6 <= M <= 10
    // Regular: 5 <= M < 6
    // Insatisfatório: 3 <= M < 5
    // Péssimo: M < 3
    const getAvaliacaoConceito = (nota: number): 'Bom' | 'Regular' | 'Insatisfatório' | 'Péssimo' | undefined => {
        if (nota === 0 || !nota) return undefined;
        if (nota >= 6) return 'Bom';
        if (nota >= 5) return 'Regular';
        if (nota >= 3) return 'Insatisfatório';
        return 'Péssimo';
    };

    // --- HANDLERS ---
    const handleAttendanceFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) setAttendanceFiles(Array.from(e.target.files));
    };

    const processAttendance = async () => { /* ... (Mantido código anterior para Attendance) */
        if (attendanceFiles.length === 0) return;
        setProcessingIndex(0);
        const results: AttendanceReportItem[] = [];

        for (let i = 0; i < attendanceFiles.length; i++) {
            setProcessingIndex(i);
            const file = attendanceFiles[i];
            try {
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(file);
                });
                const data = await processAttendanceReport(base64, file.type);
                let subjects = data.subjects || [];
                if (subjects.length === 0) {
                    subjects = DEFAULT_SUBJECTS.map(d => ({ discipline: d, b1: null, b2: null, b3: null, b4: null }));
                }
                const g1 = data.grade1 || 0;
                const g2 = data.grade2 || 0;
                let status: 'MELHORA' | 'PIORA' | 'MANTEVE' = 'MANTEVE';
                if (g2 > g1) status = 'MELHORA'; else if (g2 < g1) status = 'PIORA';
                else if (data.attendance2 && data.attendance1 && data.attendance2 > data.attendance1) status = 'MELHORA';

                // Avaliação baseada na nota mais recente (g2 de preferência, ou g1 se não tiver g2)
                const avaliacao = getAvaliacaoConceito(g2 > 0 ? g2 : g1);

                results.push({
                    id: `att_${Date.now()}_${i}`, fileName: file.name, studentName: data.studentName || 'Não identificado',
                    grade1: g1, attendance1: data.attendance1 || 0, grade2: g2, attendance2: data.attendance2 || 0, status: status, avaliacao: avaliacao, subjects: subjects
                });
            } catch (err) {
                results.push({ id: `att_err_${i}`, fileName: file.name, studentName: 'Erro de Leitura', grade1: 0, attendance1: 0, grade2: 0, attendance2: 0, status: 'MANTEVE', subjects: DEFAULT_SUBJECTS.map(d => ({ discipline: d, b1: null, b2: null, b3: null, b4: null })) });
            }
        }
        setProcessedAttendance(results);
        setProcessingIndex(-1);
        setMode('ATTENDANCE_PREVIEW');
    };

    // Funções de Edição da Tabela de Assiduidade
    const updateAttendanceSubject = (studentIndex: number, subjectIndex: number, field: keyof SubjectGrade, value: any) => {
        const newItems = [...processedAttendance];
        const student = newItems[studentIndex];
        if (student.subjects) {
            student.subjects[subjectIndex] = { ...student.subjects[subjectIndex], [field]: value };
            const validB1s = student.subjects.map(s => s.b1).filter(n => n !== null) as number[];
            const validB4s = student.subjects.map(s => s.b4).filter(n => n !== null) as number[];
            if (validB1s.length > 0) student.grade1 = validB1s.reduce((a, b) => a + b, 0) / validB1s.length;
            if (validB4s.length > 0) student.grade2 = validB4s.reduce((a, b) => a + b, 0) / validB4s.length;
            setProcessedAttendance(newItems);
        }
    };

    const addSubjectToStudent = (studentIndex: number) => {
        const newItems = [...processedAttendance];
        if (!newItems[studentIndex].subjects) newItems[studentIndex].subjects = [];
        newItems[studentIndex].subjects!.push({ discipline: 'Nova Disciplina', b1: null, b2: null, b3: null, b4: null });
        setProcessedAttendance(newItems);
    };

    const removeSubjectFromStudent = (studentIndex: number, subjectIndex: number) => {
        const newItems = [...processedAttendance];
        if (newItems[studentIndex].subjects) {
            newItems[studentIndex].subjects!.splice(subjectIndex, 1);
            setProcessedAttendance(newItems);
        }
    };

    const handleSaveAttendance = async () => {
        setIsUploading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        const docData: DocumentLog = {
            id: `doc_att_${Math.random().toString(36).substr(2, 9)}`, timestamp: new Date().toISOString(),
            type: docType, title: title, description: `Lote de Assiduidade (${processedAttendance.length} itens).`,
            metaData: { attendance: processedAttendance }
        };
        onSave(docData);
        setIsUploading(false);
        setSuccess(true);
    };

    // --- FREQUENCY HANDLERS ---

    // Handler para Upload de Lista Física (OCR)
    const handleFrequencyFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) setFrequencyFiles(Array.from(e.target.files));
    };

    const processFrequency = async () => {
        if (frequencyFiles.length === 0) return;
        setProcessingIndex(0);
        const results: FrequencyListItem[] = [];
        for (let i = 0; i < frequencyFiles.length; i++) {
            setProcessingIndex(i);
            const file = frequencyFiles[i];
            try {
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(file);
                });
                const data = await processFrequencyList(base64, file.type);
                results.push({
                    id: `freq_${Date.now()}_${i}`,
                    fileName: file.name,
                    studentName: data.studentName || 'Não Identificado',
                    month: data.month || 'Mês Atual',
                    totalPresences: data.totalPresences || 0
                });
            } catch (err) {
                console.error(err);
            }
        }
        setProcessedFrequency(results);
        setProcessingIndex(-1);
        setMode('FREQUENCY_PREVIEW');
    };

    const handleSaveFrequencyScan = async () => {
        setIsUploading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        const docData: DocumentLog = {
            id: `doc_freq_scan_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type: 'LISTA_FREQUENCIA',
            title: `Lista de Frequência Digitalizada`,
            description: `${processedFrequency.length} registros capturados via OCR.`,
            metaData: { scannedList: processedFrequency }
        };
        onSave(docData);
        setIsUploading(false);
        setSuccess(true);
    };

    // Handler para Chamada Digital
    const toggleDigitalCall = (studentName: string, field: 'present' | 'item', itemId?: string) => {
        setDigitalCallMap(prev => {
            const current = prev[studentName] || { present: false, items: [] };
            if (field === 'present') {
                const newPresent = !current.present;
                return { ...prev, [studentName]: { present: newPresent, items: newPresent ? current.items : [] } };
            } else if (field === 'item' && itemId) {
                if (!current.present) return prev;
                const items = current.items.includes(itemId) 
                    ? current.items.filter(id => id !== itemId) 
                    : [...current.items, itemId];
                return { ...prev, [studentName]: { ...current, items } };
            }
            return prev;
        });
    };

    const handleSaveDigitalCall = async () => {
        if (distributeItem && selectedInventoryItems.length === 0) {
            alert("Selecione qual item do estoque será distribuído.");
            return;
        }

        const presentList = students.filter(s => digitalCallMap[s.nome]?.present).map(s => s.nome);
        
        // Count distribution per selected item
        const itemDistributions: Record<string, number> = {};
        let totalItemsDistributed = 0;
        
        students.forEach(s => {
            const studentData = digitalCallMap[s.nome];
            if (studentData && studentData.items) {
                studentData.items.forEach(itemId => {
                    itemDistributions[itemId] = (itemDistributions[itemId] || 0) + 1;
                    totalItemsDistributed++;
                });
            }
        });

        // Validar se tem item suficiente
        if (distributeItem && selectedInventoryItems.length > 0) {
            for (const itemId of selectedInventoryItems) {
                const countNeeded = itemDistributions[itemId] || 0;
                const item = inventory.find(i => i.id === itemId);
                if (item && item.quantity < countNeeded) {
                    alert(`Estoque insuficiente para ${item.name}! Você tem ${item.quantity} ${item.unit}, mas tentou distribuir ${countNeeded}.`);
                    return;
                }
            }
        }

        setIsUploading(true);
        await new Promise(resolve => setTimeout(resolve, 800));

        let stockInfo = "";
        let inventoryDeduction: { itemId: string; amount: number }[] | undefined = undefined;
        let distributedItems: { studentName: string; itemName: string; itemId: string }[] = [];

        if (distributeItem && selectedInventoryItems.length > 0 && totalItemsDistributed > 0) {
            const deductions: { itemId: string; amount: number }[] = [];
            let stockInfoParts: string[] = [];
            
            selectedInventoryItems.forEach(itemId => {
                const count = itemDistributions[itemId] || 0;
                if (count > 0) {
                    const itemPattern = inventory.find(i => i.id === itemId);
                    if (itemPattern) {
                        stockInfoParts.push(`${itemPattern.name} (${count} un)`);
                        deductions.push({ itemId, amount: count });
                    }
                }
            });
            
            if (stockInfoParts.length > 0) {
                stockInfo = ` - Distribuído: ${stockInfoParts.join(', ')}`;
                inventoryDeduction = deductions;
            }

            students.forEach(s => {
                const studentData = digitalCallMap[s.nome];
                if (studentData && studentData.items) {
                    studentData.items.forEach(itemId => {
                        const itemDict = inventory.find(i => i.id === itemId);
                        if (itemDict) {
                            distributedItems.push({ studentName: s.nome, itemName: itemDict.name, itemId });
                        }
                    });
                }
            });
        }

        const docData: DocumentLog = {
            id: `doc_call_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(), // Data de criação do log
            type: docType,
            title: `Chamada Digital - ${new Date(callDate).toLocaleDateString()}`,
            description: `Chamada realizada. ${presentList.length} presentes${stockInfo}.`,
            metaData: {
                date: callDate, // Data da chamada
                present: presentList,
                inventoryDeduction: inventoryDeduction,
                distributedItems: distributedItems.length > 0 ? distributedItems : undefined
            }
        };
        onSave(docData);
        setIsUploading(false);
        setSuccess(true);
    };

    // ... (Outros handlers BOLETIM mantidos) ...
    const handleReportFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) setReportFiles(Array.from(e.target.files));
    };
    const processReports = async () => { /* ... Mesmo código Boletim ... */
        if (reportFiles.length === 0) return;
        setProcessingIndex(0);
        const results: SchoolReportItem[] = [];
        for (let i = 0; i < reportFiles.length; i++) {
            setProcessingIndex(i);
            const file = reportFiles[i];
            try {
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(file);
                });
                const data = await processSchoolReport(base64, file.type);
                const g1 = data.grade1 || 0; const g2 = data.grade2 || 0;
                let status: 'MELHORA' | 'PIORA' | 'MANTEVE' = 'MANTEVE';
                if (g2 > g1) status = 'MELHORA'; if (g2 < g1) status = 'PIORA';

                // Avaliação baseada na nota mais recente (g2 de preferência, ou g1 se não tiver g2)
                const avaliacao = getAvaliacaoConceito(g2 > 0 ? g2 : g1);

                results.push({
                    id: `rep_${i}`, fileName: file.name, studentName: data.studentName || 'Não identificado',
                    grade1: g1, attendance1: data.attendance1 || 0, grade2: g2, attendance2: data.attendance2 || 0, status, avaliacao,
                    subjects: data.subjects || []
                });
            } catch (err) { results.push({ id: `rep_${i}`, fileName: file.name, studentName: 'Erro', grade1: 0, attendance1: 0, grade2: 0, attendance2: 0, status: 'MANTEVE' }); }
        }
        setProcessedReports(results);
        setProcessingIndex(-1);
        setMode('BOLETIM_PREVIEW');
    };
    const handleSaveReports = async () => { /* ... Mesmo código Boletim ... */
        setIsUploading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        const docData: DocumentLog = {
            id: `doc_boletim_${Math.random().toString(36).substr(2, 9)}`, timestamp: new Date().toISOString(),
            type: docType, title: title, description: `Lote de Boletins (${processedReports.length} itens).`,
            metaData: { reports: processedReports }
        };
        onSave(docData);
        setIsUploading(false);
        setSuccess(true);
    };

    // Handlers genéricos
    const handleSaveDeclaracao = async () => { /* ... */ };
    const handleCameraCapture = (base64: string) => {
        if (previousMode === 'ATTENDANCE_MASS_UPLOAD') {
            const file = base64ToFile(base64, `assiduidade_cam_${Date.now()}.jpg`);
            setAttendanceFiles(prev => [...prev, file]);
            setMode('ATTENDANCE_MASS_UPLOAD');
        } else if (previousMode === 'BOLETIM_MASS_UPLOAD') {
            const file = base64ToFile(base64, `boletim_cam_${Date.now()}.jpg`);
            setReportFiles(prev => [...prev, file]);
            setMode('BOLETIM_MASS_UPLOAD');
        } else if (previousMode === 'FREQUENCY_MASS_UPLOAD') {
            const file = base64ToFile(base64, `frequencia_cam_${Date.now()}.jpg`);
            setFrequencyFiles(prev => [...prev, file]);
            setMode('FREQUENCY_MASS_UPLOAD');
        } else {
            setFinalImage(base64); setFile(null); setMode('DECLARACAO_VIEW');
        }
    };

    // --- RENDERERS ---
    if (success) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-screen bg-white">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Salvo com Sucesso!</h2>
                <p className="text-center text-gray-600 mb-8">
                    {docType === 'LISTA_FREQUENCIA'
                        ? 'Chamada registrada e estoque atualizado.'
                        : 'Documento processado.'}
                </p>
                <button onClick={onBack} className="w-full max-w-xs py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors">Voltar ao Menu</button>
            </div>
        )
    }

    if (mode === 'CAMERA') {
        return <SmartCamera onCapture={handleCameraCapture} onClose={() => setMode(previousMode !== 'MENU' ? previousMode : 'DECLARACAO_MENU')} />;
    }

    // === 5. LISTA DE FREQUÊNCIA (NOVO FLUXO) ===

    // 5.1 MENU OPÇÕES
    if (mode === 'FREQUENCY_OPTIONS') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                <div className="bg-white p-4 shadow-sm flex items-center gap-4"><button onClick={onBack} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button><h1 className="font-bold text-lg text-gray-800">Método de Chamada</h1></div>
                <div className="flex-1 p-6 flex flex-col justify-center gap-6 max-w-md mx-auto w-full">
                    <p className="text-center text-gray-500 text-sm mb-2">Como deseja registrar a presença?</p>

                    <button onClick={() => setMode('FREQUENCY_DIGITAL')} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-blue-100 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="font-bold text-gray-800">Chamada Digital (App)</span>
                        <span className="text-xs text-gray-500 mt-1">Check-in rápido de alunos</span>
                    </button>

                    <div className="relative"><div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300"></div></div><div className="relative flex justify-center"><span className="px-2 bg-gray-50 text-sm text-gray-500">OU</span></div></div>

                    <button onClick={() => setMode('FREQUENCY_MASS_UPLOAD')} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-green-100 rounded-xl shadow-sm hover:border-green-500 hover:shadow-md transition-all group">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>
                        </div>
                        <span className="font-bold text-gray-800">Digitalizar Lista Física</span>
                        <span className="text-xs text-gray-500 mt-1">Upload de fotos da lista de papel</span>
                    </button>

                    <div className="relative mt-2"><div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300"></div></div></div>

                    <button onClick={() => setMode('FREQUENCY_CONSOLIDATED')} className="flex items-center justify-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:bg-white hover:border-gray-400 transition-all text-gray-700 font-bold text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Relatório Mensal Consolidado
                    </button>
                </div>
            </div>
        );
    }

    // 5.2 CHAMADA DIGITAL
    if (mode === 'FREQUENCY_DIGITAL') {
        const nucleoData = (nucleos || []).find(n => n.id === currentNucleoId);
        const selectedTurmaName = nucleoData?.turmas?.find(t => t.id === selectedTurmaFilter)?.nome;
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                <div className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-30">
                    <button onClick={() => setMode('FREQUENCY_OPTIONS')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
                    <div className="flex-1">
                        <h1 className="font-bold text-lg text-gray-800">Chamada Digital</h1>
                        {nucleoData?.nome && <p className="text-xs text-gray-400">{nucleoData.nome}</p>}
                    </div>
                </div>

                {/* SCHEDULE BANNER */}
                {nucleoData && (nucleoData.dias_aulas || nucleoData.horario_aulas || nucleoData.turmas) && (
                    <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-3 max-w-2xl mx-auto">
                            {nucleoData.dias_aulas && Array.isArray(nucleoData.dias_aulas) && nucleoData.dias_aulas.length > 0 && (
                                <div className="flex items-center gap-1.5 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm font-bold">{nucleoData.dias_aulas.map(d => d.substring(0, 3)).join(' · ')}</span>
                                </div>
                            )}
                            {nucleoData.horario_aulas && (
                                <div className="flex items-center gap-1.5 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-bold">{nucleoData.horario_aulas}</span>
                                </div>
                            )}
                            {nucleoData.turmas && nucleoData.turmas.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {nucleoData.turmas.map(t => (
                                        <span key={t.id} className="text-[11px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/30">
                                            {t.nome} · {t.horario}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {nucleoData.durabilidade && (
                                <span className="ml-auto text-[11px] font-medium text-blue-100">{nucleoData.durabilidade}</span>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex-1 p-4 max-w-2xl mx-auto w-full pb-24">
                    {/* CONFIG DA CHAMADA */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data da Chamada</label>
                            <input type="date" value={callDate} onChange={e => setCallDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800" />
                        </div>

                        {/* FILTRO POR TURMA (só aparece se o núcleo tiver turmas configuradas) */}
                        {nucleoData?.turmas && nucleoData.turmas.length > 0 && (
                            <div className="pt-2 border-t border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Turma</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTurmaFilter('')}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedTurmaFilter === ''
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-blue-300'
                                            }`}
                                    >
                                        Todas as Turmas
                                    </button>
                                    {nucleoData.turmas.map(turma => (
                                        <button
                                            key={turma.id}
                                            type="button"
                                            onClick={() => setSelectedTurmaFilter(turma.id)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedTurmaFilter === turma.id
                                                ? 'bg-teal-600 text-white border-teal-600'
                                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-teal-300'
                                                }`}
                                        >
                                            {turma.nome}
                                            {turma.horario && <span className="ml-1 opacity-60">· {turma.horario}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-2 border-t border-gray-100">
                            <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                <input type="checkbox" checked={distributeItem} onChange={e => setDistributeItem(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                                <span className="font-bold text-sm text-gray-800">Distribuir Item do Estoque?</span>
                            </label>

                            {distributeItem && (
                                <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-50 border border-gray-200 rounded p-2 mt-3 cursor-default">
                                    <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wide">Selecione os itens a distribuir:</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {inventory.map(item => (
                                            <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-gray-300 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-200">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedInventoryItems.includes(item.id)}
                                                    onChange={e => {
                                                        if (e.target.checked) setSelectedInventoryItems([...selectedInventoryItems, item.id]);
                                                        else setSelectedInventoryItems(selectedInventoryItems.filter(id => id !== item.id));
                                                    }}
                                                    className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                                                />
                                                <span className="text-sm font-medium text-gray-800">{item.name} <span className="text-xs text-gray-500 font-normal">({item.quantity} {item.unit})</span></span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* LISTA DE ALUNOS */}
                    <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 p-3 text-xs font-bold text-gray-500 uppercase flex justify-between">
                            <span>
                                {selectedTurmaName ? (
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-teal-500 inline-block"></span>
                                        {selectedTurmaName}
                                    </span>
                                ) : 'Aluno'}
                            </span>
                            <span className="flex gap-4">
                                {distributeItem && <span>Recebeu Item</span>}
                                <span>Presença</span>
                            </span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {filteredByTurma.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    {selectedTurmaFilter
                                        ? `Nenhum aluno cadastrado na ${selectedTurmaName || 'turma selecionada'}.`
                                        : 'Nenhum aluno cadastrado.'}
                                </div>
                            ) : (
                                filteredByTurma.map(student => {
                                    const status = digitalCallMap[student.nome] || { present: false, items: [] };
                                    const studentTurma = nucleoData?.turmas?.find(t => t.id === student.turma_id);
                                    return (
                                        <div key={student.nome} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex flex-col flex-1 pl-1">
                                                <span className="font-bold text-gray-800 text-sm whitespace-nowrap overflow-hidden text-ellipsis mr-4">{student.nome}</span>
                                                {studentTurma && (
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full mt-0.5 w-fit">
                                                        {studentTurma.nome} · {studentTurma.horario}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 pr-2">
                                                {/* ITENS DISTRIBUÍDOS */}
                                                {distributeItem && selectedInventoryItems.length > 0 && (
                                                    <div className="flex gap-2 flex-wrap justify-end">
                                                        {selectedInventoryItems.map(itemId => {
                                                            const itemData = inventory.find(i => i.id === itemId);
                                                            const hasItem = status.items.includes(itemId);
                                                            return (
                                                                <button
                                                                    key={itemId}
                                                                    onClick={() => toggleDigitalCall(student.nome, 'item', itemId)}
                                                                    disabled={!status.present}
                                                                    title={itemData?.name}
                                                                    className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase rounded transition-all ${
                                                                        hasItem
                                                                            ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-400 shadow-inner'
                                                                            : !status.present 
                                                                                ? 'bg-gray-50 text-gray-300 cursor-not-allowed opacity-50' 
                                                                                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
                                                                    }`}
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                                    <span className="max-w-[80px] truncate">{itemData?.name || 'Item'}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* PRESENÇA */}
                                                <button
                                                    onClick={() => toggleDigitalCall(student.nome, 'present')}
                                                    className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all ${status.present ? 'bg-green-100 text-green-600 ring-2 ring-green-400 shadow-inner' : 'bg-gray-100 text-gray-400 border border-gray-200 hover:bg-gray-200'}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* FOOTER SAVE */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-between items-center shadow-lg z-40">
                        <div className="text-xs text-gray-500">
                            <span className="block font-bold text-gray-800 text-sm">
                                {Object.values(digitalCallMap).filter(v => v.present).length} Presentes
                            </span>
                            {distributeItem && (
                                <span>{Object.values(digitalCallMap).reduce((acc, curr) => acc + (curr.items?.length || 0), 0)} Itens entregues</span>
                            )}
                        </div>
                        <button
                            onClick={handleSaveDigitalCall}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-green-700 transition-colors"
                        >
                            Salvar Chamada
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 5.3 DIGITALIZAR LISTA FÍSICA (OCR)
    if (mode === 'FREQUENCY_MASS_UPLOAD') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                <div className="bg-white p-4 shadow-sm flex items-center gap-4"><button onClick={() => setMode('FREQUENCY_OPTIONS')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button><h1 className="font-bold text-lg text-gray-800">Upload Lista Física</h1></div>
                <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 text-center">
                        <p className="text-gray-500 mb-4">Tire fotos das listas de papel para contagem automática.</p>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => { setPreviousMode('FREQUENCY_MASS_UPLOAD'); setMode('CAMERA'); }} className="flex flex-col items-center justify-center p-6 border-2 border-green-100 bg-white rounded-xl shadow-sm hover:border-green-500 transition-all group">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-green-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                                <span className="text-gray-800 font-bold">Usar Câmera</span>
                            </button>
                            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-300 bg-white rounded-xl shadow-sm hover:bg-blue-50 cursor-pointer">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg></div>
                                <span className="text-blue-700 font-bold">Carregar Fotos</span>
                                <input type="file" multiple className="hidden" accept="image/*,application/pdf" onChange={handleFrequencyFilesChange} />
                            </label>
                        </div>
                    </div>

                    {frequencyFiles.length > 0 && (
                        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-6">
                            <div className="bg-gray-100 p-3 border-b border-gray-200 font-bold text-sm text-gray-700">Arquivos ({frequencyFiles.length})</div>
                            <div className="divide-y divide-gray-100 max-h-40 overflow-auto">
                                {frequencyFiles.map((f, i) => (
                                    <div key={i} className="p-3 text-sm flex justify-between items-center bg-gray-50 border-b border-gray-100">
                                        <span className="truncate flex-1 font-bold text-gray-900">{f.name}</span>
                                        <button onClick={() => setFrequencyFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 text-xs font-bold px-2">X</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button onClick={processFrequency} disabled={frequencyFiles.length === 0 || processingIndex >= 0} className="w-full py-4 bg-gray-300 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 mb-4 hover:bg-blue-600 transition-colors">
                        {processingIndex >= 0 ? `Processando...` : `Processar Listas`}
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'FREQUENCY_PREVIEW') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                <div className="bg-white p-4 shadow-sm flex items-center gap-4"><button onClick={() => setMode('FREQUENCY_MASS_UPLOAD')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button><h1 className="font-bold text-lg text-gray-800">Revisão Lista Física</h1></div>
                <div className="flex-1 p-4 overflow-auto">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-lg shadow border border-gray-300 overflow-hidden mb-4">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-blue-100 text-blue-900 text-xs uppercase font-bold">
                                        <th className="p-3 border-r border-blue-200">Nome Identificado</th>
                                        <th className="p-3 border-r border-blue-200 text-center w-32">Mês Ref.</th>
                                        <th className="p-3 text-center w-24">Total Presenças</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {processedFrequency.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-200 hover:bg-blue-50">
                                            <td className="p-2 border-r border-gray-200">
                                                <input type="text" value={item.studentName} onChange={e => { const list = [...processedFrequency]; list[idx].studentName = e.target.value; setProcessedFrequency(list); }} className="w-full bg-transparent font-bold focus:outline-none" />
                                            </td>
                                            <td className="p-2 border-r border-gray-200 text-center">
                                                <input type="text" value={item.month} onChange={e => { const list = [...processedFrequency]; list[idx].month = e.target.value; setProcessedFrequency(list); }} className="w-full bg-transparent text-center focus:outline-none" />
                                            </td>
                                            <td className="p-2 text-center">
                                                <input type="number" value={item.totalPresences} onChange={e => { const list = [...processedFrequency]; list[idx].totalPresences = +e.target.value; setProcessedFrequency(list); }} className="w-full bg-transparent text-center font-bold focus:outline-none" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={handleSaveFrequencyScan} className="w-full py-4 bg-green-600 text-white font-bold rounded shadow-lg hover:bg-green-700">Salvar Dados</button>
                    </div>
                </div>
            </div>
        );
    }

    // 5.4 RELATÓRIO CONSOLIDADO (MENSAL)
    if (mode === 'FREQUENCY_CONSOLIDATED') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                <div className="bg-white p-4 shadow-sm flex items-center gap-4"><button onClick={() => setMode('FREQUENCY_OPTIONS')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button><h1 className="font-bold text-lg text-gray-800">Relatório Mensal</h1></div>
                <div className="p-4 flex-1 overflow-auto">
                    <div className="max-w-full mx-auto">
                        {/* CONTROLES DO MÊS */}
                        <div className="flex flex-wrap gap-4 mb-4 bg-white p-4 rounded shadow-sm border border-gray-200 items-end">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mês de Referência</label>
                                <input type="month" value={viewMonth} onChange={e => setViewMonth(e.target.value)} className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Aulas Previstas (Base %)</label>
                                <input type="number" value={expectedClasses} onChange={e => setExpectedClasses(+e.target.value)} className="w-24 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 font-bold" min="1" />
                            </div>
                        </div>

                        {/* TABELA GRID */}
                        <div
                            className="bg-white rounded-lg shadow border border-gray-300 overflow-x-auto cursor-move hover:border-blue-400 transition-colors"
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'TABLE_STUDENTS', consolidatedFrequencyData, `Frequência ${viewMonth}`)}
                        >
                            <div className="bg-blue-50 p-2 text-center text-xs font-bold text-blue-600 border-b border-blue-100 mb-1">
                                &#10021; ARRASTE A TABELA PARA O PDF
                            </div>

                            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                                <thead>
                                    <tr className="bg-gray-100 border-b border-gray-300 text-xs text-gray-600 uppercase">
                                        <th className="p-2 border-r border-gray-300 w-48 sticky left-0 bg-gray-100 z-10">Aluno</th>
                                        {consolidatedFrequencyData.headers.map((day, i) => (
                                            <th key={i} className="p-1 text-center border-r border-gray-300 w-10 text-[10px]">{day}</th>
                                        ))}
                                        <th className="p-2 text-center border-r border-gray-300 w-12 bg-green-50 text-green-800">P</th>
                                        <th className="p-2 text-center border-r border-gray-300 w-12 bg-red-50 text-red-800">F</th>
                                        <th className="p-2 text-center w-16 bg-blue-50 text-blue-800">%</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs text-gray-800">
                                    {consolidatedFrequencyData.rows.length === 0 ? (
                                        <tr><td colSpan={100} className="p-8 text-center text-gray-400">Nenhum registro encontrado neste mês.</td></tr>
                                    ) : (
                                        consolidatedFrequencyData.rows.map((row, idx) => (
                                            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="p-2 border-r border-gray-300 font-bold truncate sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{row.student.nome}</td>
                                                {row.daysStatus.map((status, i) => (
                                                    <td key={i} className="p-1 text-center border-r border-gray-300 font-bold">
                                                        {status === 'PP' ? <span className="text-green-600">●</span> : <span className="text-red-300 text-[8px]">F</span>}
                                                    </td>
                                                ))}
                                                <td className="p-2 text-center border-r border-gray-300 font-bold bg-green-50">{row.stats.presences}</td>
                                                <td className="p-2 text-center border-r border-gray-300 font-bold bg-red-50">{row.stats.absences}</td>
                                                <td className={`p-2 text-center font-black bg-blue-50 ${row.stats.freqPercent < 75 ? 'text-red-600' : 'text-blue-900'}`}>{row.stats.freqPercent}%</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ... (BOLETIM_MASS_UPLOAD, BOLETIM_PREVIEW, BOLETIM_VIEW - Mantidos iguais, apenas repetidos para fechar o arquivo corretamente se necessário, ou assumimos que o resto está ok pois pedi para substituir apenas o necessário. Vou incluir o resto para garantir integridade do arquivo XML) ...
    // [CÓDIGO ANTERIOR DOS OUTROS MODOS JÁ ESTÁ INCLUÍDO NO ARQUIVO ORIGINAL, O XML VAI SUBSTITUIR TUDO]

    // === 3. BOLETINS (REPETIDO PARA MANTER INTEGRIDADE) ===
    if (mode === 'BOLETIM_MASS_UPLOAD') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                <div className="bg-white p-4 shadow-sm flex items-center gap-4"><button onClick={onBack} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button><h1 className="font-bold text-lg text-gray-800">Upload de Boletins</h1></div>
                <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 text-center">
                        <p className="text-gray-500 mb-4">Selecione fotos ou PDFs para análise automática.</p>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => { setPreviousMode('BOLETIM_MASS_UPLOAD'); setMode('CAMERA'); }} className="flex flex-col items-center justify-center p-6 border-2 border-green-100 bg-white rounded-xl shadow-sm hover:border-green-500 transition-all group">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-green-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                                <span className="text-gray-800 font-bold">Usar Câmera</span>
                            </button>
                            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-300 bg-white rounded-xl shadow-sm hover:bg-blue-50 cursor-pointer">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg></div>
                                <span className="text-blue-700 font-bold">Carregar Arquivos</span>
                                <input type="file" multiple className="hidden" accept="image/*,application/pdf" onChange={handleReportFilesChange} />
                            </label>
                        </div>
                    </div>

                    {reportFiles.length > 0 && (
                        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-6">
                            <div className="bg-gray-100 p-3 border-b border-gray-200 font-bold text-sm text-gray-700">Arquivos Selecionados ({reportFiles.length})</div>
                            <div className="divide-y divide-gray-100 max-h-40 overflow-auto">
                                {reportFiles.map((f, i) => (
                                    <div key={i} className="p-3 text-sm flex justify-between items-center bg-gray-50 border-b border-gray-100">
                                        <span className="truncate flex-1 font-bold text-gray-900">{f.name}</span>
                                        <button onClick={() => setReportFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 text-xs font-bold px-2">X</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button onClick={processReports} disabled={reportFiles.length === 0 || processingIndex >= 0} className="w-full py-4 bg-gray-300 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 mb-4 hover:bg-blue-600 transition-colors">
                        {processingIndex >= 0 ? `Processando ${processingIndex + 1}/${reportFiles.length}...` : `Processar ${reportFiles.length} Arquivos`}
                    </button>

                    <button onClick={() => setMode('BOLETIM_VIEW')} className="w-full py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2">Ver Histórico</button>
                </div>
            </div>
        );
    }

    // ... (BOLETIM_PREVIEW e BOLETIM_VIEW mantidos iguais) ...
    if (mode === 'BOLETIM_PREVIEW') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                <div className="bg-white p-4 shadow-sm flex items-center gap-4"><button onClick={() => setMode('BOLETIM_MASS_UPLOAD')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button><h1 className="font-bold text-lg text-gray-800">Revisão dos Dados</h1></div>
                <div className="flex-1 p-4 overflow-auto bg-gray-50">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* Substituindo Cards por Tabela Unificada para melhor visualização e alinhamento com a cor do sistema */}
                        <div className="bg-white rounded-lg shadow border border-gray-300 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-blue-100 border-b border-blue-200 text-blue-900 text-xs uppercase font-bold">
                                        <th className="p-3 border-r border-blue-200">Arquivo Original</th>
                                        <th className="p-3 border-r border-blue-200">Nome do Aluno</th>
                                        <th className="p-3 border-r border-blue-200 text-center w-24">Nota 1</th>
                                        <th className="p-3 border-r border-blue-200 text-center w-24">Freq 1 (%)</th>
                                        <th className="p-3 border-r border-blue-200 text-center w-24">Nota 2</th>
                                        <th className="p-3 text-center w-24">Freq 2 (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {processedReports.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-200 hover:bg-blue-50">
                                            <td className="p-3 border-r border-gray-200 text-xs text-gray-500 font-medium truncate max-w-[150px]" title={item.fileName}>
                                                {item.fileName}
                                            </td>
                                            <td className="p-2 border-r border-gray-200">
                                                <input
                                                    type="text"
                                                    value={item.studentName}
                                                    onChange={e => { const list = [...processedReports]; list[idx].studentName = e.target.value; setProcessedReports(list); }}
                                                    className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded px-2 py-1 text-gray-900 font-bold focus:bg-white focus:outline-none transition-all"
                                                />
                                            </td>
                                            <td className="p-2 border-r border-gray-200">
                                                <input
                                                    type="number"
                                                    value={item.grade1}
                                                    onChange={e => { const list = [...processedReports]; list[idx].grade1 = +e.target.value; setProcessedReports(list); }}
                                                    className="w-full text-center bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded px-1 py-1 text-gray-900 font-medium focus:bg-white focus:outline-none"
                                                />
                                            </td>
                                            <td className="p-2 border-r border-gray-200">
                                                <input
                                                    type="number"
                                                    value={item.attendance1}
                                                    onChange={e => { const list = [...processedReports]; list[idx].attendance1 = +e.target.value; setProcessedReports(list); }}
                                                    className="w-full text-center bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded px-1 py-1 text-gray-900 font-medium focus:bg-white focus:outline-none"
                                                />
                                            </td>
                                            <td className="p-2 border-r border-gray-200">
                                                <input
                                                    type="number"
                                                    value={item.grade2}
                                                    onChange={e => { const list = [...processedReports]; list[idx].grade2 = +e.target.value; setProcessedReports(list); }}
                                                    className="w-full text-center bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded px-1 py-1 text-gray-900 font-medium focus:bg-white focus:outline-none"
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <input
                                                    type="number"
                                                    value={item.attendance2}
                                                    onChange={e => { const list = [...processedReports]; list[idx].attendance2 = +e.target.value; setProcessedReports(list); }}
                                                    className="w-full text-center bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded px-1 py-1 text-gray-900 font-medium focus:bg-white focus:outline-none"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={handleSaveReports} className="w-full py-4 bg-green-600 text-white font-bold rounded shadow-lg hover:bg-green-700 sticky bottom-4">Salvar Todos</button>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'BOLETIM_VIEW') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                <div className="bg-white p-4 shadow-sm flex items-center gap-4"><button onClick={() => setMode('BOLETIM_MASS_UPLOAD')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button><h1 className="font-bold text-lg text-gray-800">Histórico de Boletins</h1></div>
                <div className="p-4 flex-1 overflow-auto">
                    <div className="max-w-6xl mx-auto">
                        {/* FILTROS PADRONIZADOS */}
                        <div className="flex gap-4 mb-4 bg-white p-3 rounded shadow-sm border border-gray-200">
                            <input type="text" placeholder="Filtrar por nome..." value={boletimFilterName} onChange={e => setBoletimFilterName(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-gray-800" />
                            <input type="date" value={boletimFilterDate} onChange={e => setBoletimFilterDate(e.target.value)} className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-gray-800" />
                        </div>

                        <div
                            className="bg-white rounded-lg shadow border border-gray-300 overflow-x-auto cursor-move hover:border-blue-400 transition-colors"
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'TABLE_BOLETIM', { rows: consolidatedBoletins }, 'Tabela de Boletins')}
                        >
                            <div className="bg-blue-50 p-2 text-center text-xs font-bold text-blue-600 border-b border-blue-100 mb-1">
                                &#10021; ARRASTE A TABELA COMPLETA PARA O RELATÓRIO
                            </div>
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-blue-100 border-b-2 border-blue-200 text-blue-900 text-xs uppercase font-bold">
                                        <th className="p-3 border-r border-blue-200 w-12 text-center">Nº</th>
                                        <th className="p-3 border-r border-blue-200 w-32">Evento/Modalidade</th>
                                        <th className="p-3 border-r border-blue-200">Nome (ordem alfabética)</th>
                                        <th className="p-3 border-r border-blue-200 text-center w-28 bg-blue-50">Aproveitamento Escolar 01</th>
                                        <th className="p-3 border-r border-blue-200 text-center w-28 bg-blue-50">Assiduidade Escolar 01</th>
                                        <th className="p-3 border-r border-blue-200 text-center w-28 bg-blue-50">Aproveitamento Escolar 02</th>
                                        <th className="p-3 border-r border-blue-200 text-center w-28 bg-blue-50">Assiduidade Escolar 02</th>
                                        <th className="p-3 text-center w-40">MELHORA / PIORA / MANTEVE</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-gray-800 font-medium">
                                    {consolidatedBoletins.map((item, idx) => (
                                        <tr
                                            key={idx}
                                            className="border-b border-gray-200 hover:bg-yellow-50 transition-colors"
                                        >
                                            <td className="p-3 border-r border-gray-200 text-center text-gray-500">{idx + 1}</td>
                                            <td className="p-3 border-r border-gray-200 bg-gray-50/50">Triathlon</td>
                                            <td className="p-3 border-r border-gray-200 font-bold group-hover:text-blue-700">{item.studentName}</td>
                                            <td className="p-3 border-r border-gray-200 text-center text-lg">{item.grade1?.toFixed(2) ?? '-'}</td>
                                            <td className="p-3 border-r border-gray-200 text-center text-lg font-bold">{item.attendance1 ? `${item.attendance1}%` : '-'}</td>
                                            <td className="p-3 border-r border-gray-200 text-center text-lg">{item.grade2?.toFixed(2) ?? '-'}</td>
                                            <td className="p-3 border-r border-gray-200 text-center text-lg font-bold">{item.attendance2 ? `${item.attendance2}%` : '-'}</td>
                                            <td className={`p-3 text-center font-bold uppercase ${item.status === 'MELHORA' ? 'text-green-600' : item.status === 'PIORA' ? 'text-red-600' : 'text-gray-500'}`}>
                                                {item.status}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // === 4. ASSIDUIDADE ===
    if (mode === 'ATTENDANCE_MASS_UPLOAD') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                <div className="bg-white p-4 shadow-sm flex items-center gap-4"><button onClick={onBack} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button><h1 className="font-bold text-lg text-gray-800">Upload de Relatórios</h1></div>
                <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 text-center">
                        <p className="text-gray-500 mb-4">Extração automática de notas e frequência.</p>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => { setPreviousMode('ATTENDANCE_MASS_UPLOAD'); setMode('CAMERA'); }} className="flex flex-col items-center justify-center p-6 border-2 border-green-100 bg-white rounded-xl shadow-sm hover:border-green-500 transition-all group">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-green-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                                <span className="text-gray-800 font-bold">Usar Câmera</span>
                            </button>
                            <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div><div className="relative flex justify-center"><span className="px-2 bg-gray-50 text-sm text-gray-500">OU</span></div></div>
                            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-300 bg-white rounded-xl shadow-sm hover:bg-blue-50 cursor-pointer">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01 2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                                <span className="text-blue-700 font-bold">Carregar Arquivos</span>
                                <input type="file" multiple className="hidden" accept="image/*,application/pdf" onChange={handleAttendanceFilesChange} />
                            </label>
                        </div>
                    </div>

                    {attendanceFiles.length > 0 && (
                        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-6">
                            <div className="bg-gray-100 p-3 border-b border-gray-200 font-bold text-sm text-gray-700">Arquivos Selecionados ({attendanceFiles.length})</div>
                            <div className="divide-y divide-gray-100 max-h-40 overflow-auto">
                                {attendanceFiles.map((f, i) => (
                                    <div key={i} className="p-3 text-sm flex justify-between items-center bg-gray-50 border-b border-gray-100">
                                        <span className="truncate flex-1 font-bold text-gray-900">{f.name}</span>
                                        <button onClick={() => setAttendanceFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 text-xs font-bold px-2">X</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button onClick={processAttendance} disabled={attendanceFiles.length === 0 || processingIndex >= 0} className="w-full py-4 bg-gray-300 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 mb-4 hover:bg-blue-600 transition-colors">
                        {processingIndex >= 0 ? `Processando ${processingIndex + 1}/${attendanceFiles.length}...` : `Processar ${attendanceFiles.length} Arquivos`}
                    </button>

                    <button onClick={() => setMode('ATTENDANCE_VIEW')} className="w-full py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2">Ver Histórico</button>
                </div>
            </div>
        );
    }

    // --- NOVA VISUALIZAÇÃO DE PREVIEW (TIPO PLANILHA) ---
    if (mode === 'ATTENDANCE_PREVIEW') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                <div className="bg-white p-4 shadow-sm flex items-center gap-4 border-b border-gray-200">
                    <button onClick={() => setMode('ATTENDANCE_MASS_UPLOAD')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
                    <h1 className="font-bold text-lg text-gray-800">Revisão Detalhada</h1>
                </div>
                <div className="flex-1 p-6 overflow-auto bg-gray-50">
                    <div className="max-w-5xl mx-auto space-y-8 pb-20">
                        {processedAttendance.map((student, idx) => (
                            <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden">
                                {/* Header do Card do Aluno */}
                                <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Aluno</label>
                                        <input
                                            type="text"
                                            value={student.studentName}
                                            onChange={e => { const list = [...processedAttendance]; list[idx].studentName = e.target.value; setProcessedAttendance(list); }}
                                            className="w-full bg-white border border-gray-300 rounded px-3 py-2 font-bold text-gray-800 focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="w-full sm:w-auto text-xs text-gray-500 bg-white px-3 py-2 border rounded">
                                        Arquivo: {student.fileName}
                                    </div>
                                </div>

                                {/* PLANILHA DE NOTAS */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                                        <thead>
                                            <tr className="bg-blue-100 text-blue-900 border-b border-blue-200 uppercase text-xs font-bold">
                                                <th className="p-3 border-r border-blue-200">Disciplina</th>
                                                <th className="p-3 border-r border-blue-200 text-center w-24">1º Bimestre</th>
                                                <th className="p-3 border-r border-blue-200 text-center w-24">2º Bimestre</th>
                                                <th className="p-3 border-r border-blue-200 text-center w-24">3º Bimestre</th>
                                                <th className="p-3 border-r border-blue-200 text-center w-24">4º Bimestre</th>
                                                <th className="p-3 text-center w-12">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {student.subjects?.map((sub, sIdx) => (
                                                <tr key={sIdx} className="border-b border-gray-200 hover:bg-gray-50">
                                                    <td className="p-2 border-r border-gray-200">
                                                        <input
                                                            type="text"
                                                            value={sub.discipline}
                                                            onChange={e => updateAttendanceSubject(idx, sIdx, 'discipline', e.target.value)}
                                                            className="w-full bg-transparent font-medium focus:outline-none focus:text-blue-700"
                                                        />
                                                    </td>
                                                    <td className="p-2 border-r border-gray-200">
                                                        <input type="number" step="0.1" value={sub.b1 ?? ''} onChange={e => updateAttendanceSubject(idx, sIdx, 'b1', parseFloat(e.target.value))} className="w-full text-center bg-transparent focus:outline-none" placeholder="-" />
                                                    </td>
                                                    <td className="p-2 border-r border-gray-200">
                                                        <input type="number" step="0.1" value={sub.b2 ?? ''} onChange={e => updateAttendanceSubject(idx, sIdx, 'b2', parseFloat(e.target.value))} className="w-full text-center bg-transparent focus:outline-none" placeholder="-" />
                                                    </td>
                                                    <td className="p-2 border-r border-gray-200">
                                                        <input type="number" step="0.1" value={sub.b3 ?? ''} onChange={e => updateAttendanceSubject(idx, sIdx, 'b3', parseFloat(e.target.value))} className="w-full text-center bg-transparent focus:outline-none" placeholder="-" />
                                                    </td>
                                                    <td className="p-2 border-r border-gray-200">
                                                        <input type="number" step="0.1" value={sub.b4 ?? ''} onChange={e => updateAttendanceSubject(idx, sIdx, 'b4', parseFloat(e.target.value))} className="w-full text-center bg-transparent focus:outline-none" placeholder="-" />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <button onClick={() => removeSubjectFromStudent(idx, sIdx)} className="text-red-400 hover:text-red-600 font-bold" title="Remover Disciplina">×</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-yellow-50 font-bold border-t-2 border-gray-300 text-gray-800">
                                                <td className="p-3 text-right border-r border-gray-300 text-xs uppercase">Média do Bimestre</td>
                                                <td className="p-3 text-center border-r border-gray-300">{calculateAverage(student.subjects?.map(s => s.b1) || []).toFixed(1)}</td>
                                                <td className="p-3 text-center border-r border-gray-300">{calculateAverage(student.subjects?.map(s => s.b2) || []).toFixed(1)}</td>
                                                <td className="p-3 text-center border-r border-gray-300">{calculateAverage(student.subjects?.map(s => s.b3) || []).toFixed(1)}</td>
                                                <td className="p-3 text-center border-r border-gray-300">{calculateAverage(student.subjects?.map(s => s.b4) || []).toFixed(1)}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                <div className="p-2 bg-gray-50 border-t border-gray-200">
                                    <button onClick={() => addSubjectToStudent(idx)} className="text-xs text-blue-600 font-bold hover:underline px-2">+ Adicionar Disciplina</button>
                                </div>
                            </div>
                        ))}

                        <button onClick={handleSaveAttendance} className="w-full py-4 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors fixed bottom-6 left-1/2 transform -translate-x-1/2 max-w-xl z-20">
                            Salvar Todos os Relatórios
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'ATTENDANCE_VIEW') {
        const handleSaveEditingTable = () => {
            if (onUpdateHistory && history) {
                const newDocs: DocumentLog[] = [];
                Object.keys(editData).forEach(studentName => {
                    const originalItem = consolidatedAttendance.find(i => i.studentName === studentName);
                    if (originalItem) {
                        const newG1 = editData[studentName].grade1 !== null ? editData[studentName].grade1 : originalItem.grade1;
                        const newG2 = editData[studentName].grade2 !== null ? editData[studentName].grade2 : originalItem.grade2;
                        
                        const avg1 = newG1 || 0;
                        const avg2 = newG2 || 0;
                        const finalStatus = avg2 > avg1 ? 'MELHORA' : avg2 < avg1 ? 'PIORA' : 'MANTEVE';

                        const docCorrection: DocumentLog = {
                            id: `doc_corr_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            timestamp: new Date().toISOString(),
                            type: 'BOLETIM',
                            title: `Atualização Pelo Relatório Geral - ${studentName}`,
                            description: `Edição em lote pela view do relatório.`,
                            metaData: {
                                studentName: studentName,
                                grade1: newG1,
                                attendance1: originalItem.attendance1,
                                grade2: newG2,
                                attendance2: originalItem.attendance2,
                                periodType: newG2 && newG2 > 0 ? 'FINAL' : 'PARCIAL',
                                status: finalStatus,
                                avaliacao: getAvaliacaoConceito(avg2 > 0 ? avg2 : avg1),
                            }
                        };
                        newDocs.push(docCorrection);
                    }
                });
                if (newDocs.length > 0) {
                    onUpdateHistory([...history, ...newDocs]);
                }
            }
            setIsEditingTable(false);
            setEditData({});
        };

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                <div className="bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setMode('ATTENDANCE_MASS_UPLOAD')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
                        <h1 className="font-bold text-lg text-gray-800">Histórico de Assiduidade</h1>
                    </div>
                    <div className="flex-shrink-0 ml-auto mr-40">
                        {isEditingTable ? (
                            <div className="flex gap-2">
                                <button onClick={() => { setIsEditingTable(false); setEditData({}); }} className="flex items-center gap-1 bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded text-sm hover:bg-gray-200"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> Cancelar</button>
                                <button onClick={handleSaveEditingTable} className="flex items-center gap-1 bg-green-600 text-white font-bold px-3 py-1.5 rounded text-sm hover:bg-green-700 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Salvar Alterações</button>
                            </div>
                        ) : (
                            <button onClick={() => setIsEditingTable(true)} className="flex items-center gap-1 bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded border border-blue-200 text-sm hover:bg-blue-100"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> Editar Relatório</button>
                        )}
                    </div>
                </div>
                <div className="p-4 flex-1 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                        {/* FILTROS PADRONIZADOS */}
                        <div className="flex gap-4 mb-4 bg-white p-3 rounded shadow-sm border border-gray-200">
                            <input type="text" placeholder="Buscar aluno..." value={attendanceFilterName} onChange={e => setAttendanceFilterName(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-gray-800" />
                            {nucleos.length > 0 && (
                                <select
                                    value={attendanceFilterNucleoId}
                                    onChange={(e) => setAttendanceFilterNucleoId(e.target.value)}
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-gray-800"
                                >
                                    <option value="">Todos os Núcleos</option>
                                    {nucleos.map(n => (
                                        <option key={n.id} value={n.id}>{n.nome}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div
                            className="bg-white rounded-lg shadow border border-gray-300 overflow-hidden cursor-move hover:border-blue-400 transition-colors mb-6 pb-6"
                            draggable
                            onDragStart={(e) => {
                                const payloadRows = consolidatedAttendance.map(item => {
                                    const studentData = students.find(s => normalizeStudentName(s.nome) === normalizeStudentName(item.studentName));
                                    const calcAge = (dob: string | undefined) => {
                                        if (!dob) return null;
                                        const diffMs = Date.now() - new Date(dob).getTime();
                                        if (isNaN(diffMs)) return null;
                                        const ageDt = new Date(diffMs);
                                        return Math.abs(ageDt.getUTCFullYear() - 1970);
                                    };
                                    const formatShortNucleo = (name: string | undefined) => {
                                        if (!name) return null;
                                        return name.split('-')[0].trim();
                                    };

                                    return {
                                        ...item,
                                        nucleo: studentData?.nucleo_id ? formatShortNucleo(nucleos.find(n => n.id === studentData.nucleo_id)?.nome) : null,
                                        idade: studentData ? calcAge(studentData.data_nascimento) : null,
                                        escolaTipo: studentData?.escola_tipo || null
                                    };
                                });
                                handleDragStart(e, 'TABLE_ATTENDANCE', { rows: payloadRows }, 'Lista de Assiduidade');
                            }}
                        >
                            <div className="bg-blue-50 p-2 text-center text-xs font-bold text-blue-600 border-b border-blue-100">
                                &#10021; ARRASTE A LISTA DE ALUNOS COMPLETA
                            </div>
                            {/* CABEÇALHO PADRÃO DO RELATÓRIO */}
                            <div className="flex flex-col mb-8 mt-2 border-b-2 border-gray-800 pb-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight uppercase">
                                            RELATÓRIO DE ASSIDUIDADE E APROVEITAMENTO ESCOLAR
                                        </h1>
                                    </div>
                                    <img src={leiDocImg} alt="Lei de Incentivo ao Esporte" className="h-24 object-contain ml-4" />
                                </div>

                                {/* DADOS DO PROJETO NO CABEÇALHO */}
                                <div className="grid grid-cols-2 gap-4 text-sm font-sans text-gray-700">
                                    <div>
                                        <span className="font-bold text-gray-900">N.º SLI:</span> SLI-2023-0002
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900">Nome do Projeto:</span> Formando Campeões
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900">Proponente:</span> {attendanceFilterNucleoId && nucleos ? nucleos.find(n => n.id === attendanceFilterNucleoId)?.nome || 'Instituto Vida Ativa' : 'Instituto Vida Ativa'}
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900">Responsável (Associação/Federação):</span> Carlos Eduardo
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900">Período da Relação:</span> <span className={`font-black uppercase px-2 py-0.5 rounded text-xs ml-1 ${relationPeriod === 'FINAL' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{relationPeriod}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tabela Resumo (Mantida para visão geral) */}
                            <table className="w-full text-left border-collapse bg-white">
                                <thead className="bg-blue-600 text-white font-bold uppercase text-[10px]">
                                    <tr>
                                        <th className="p-2 border-r border-blue-500 text-center" rowSpan={2}>Nº</th>
                                        <th className="p-2 border-r border-blue-500 text-center w-28" rowSpan={2}>Núcleo</th>
                                        <th className="p-2 border-r border-blue-500" rowSpan={2}>Nome (ordem por núcleo/ordem alfabética)</th>
                                        <th className="p-2 border-r border-blue-500 text-center w-12" rowSpan={2}>Idade</th>
                                        <th className="p-2 border-r border-blue-500 text-center w-24" rowSpan={2}>Escola Pública ou Particular</th>
                                        <th className="p-2 border-r border-blue-500 text-center" colSpan={1}>Aproveitamento Escolar 01</th>
                                        <th className="p-2 border-r border-blue-500 text-center" colSpan={1}>Assiduidade Escolar 01</th>
                                        <th className="p-2 border-r border-blue-500 text-center" colSpan={1}>Aproveitamento Escolar 02</th>
                                        <th className="p-2 border-r border-blue-500 text-center" colSpan={1}>Assiduidade Escolar 02</th>
                                        <th className="p-2 text-center w-24" rowSpan={2}>MELHORA / PIORA / MANTEVE</th>
                                    </tr>
                                    <tr>
                                        <th className="p-1 px-2 border-r border-blue-500 border-t border-blue-500 text-center font-normal text-[8px] normal-case tracking-normal leading-tight" colSpan={2}>
                                            * Baseado em análise de boletim ou sistema de pontuação similar da Escola regular do aluno ao iniciar no projeto Escolinha de Triathlon (primeiro bimestre/trimestre)
                                        </th>
                                        <th className="p-1 px-2 border-r border-blue-500 border-t border-blue-500 text-center font-normal text-[8px] normal-case tracking-normal leading-tight" colSpan={2}>
                                            * Baseado em análise de boletim ou sistema de pontuação similar da Escola regular do aluno ao participar do projeto Escolinha de Triathlon (último bimestre/trimestre)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs">
                                    {consolidatedAttendance.map((item, idx) => {
                                        // Busca os dados do aluno cadastrado
                                        const studentData = students.find(s => normalizeStudentName(s.nome) === normalizeStudentName(item.studentName));

                                        // Calcula idade
                                        const calcAge = (dob: string | undefined) => {
                                            if (!dob) return null;
                                            const diffMs = Date.now() - new Date(dob).getTime();
                                            if (isNaN(diffMs)) return null;
                                            const ageDt = new Date(diffMs);
                                            return Math.abs(ageDt.getUTCFullYear() - 1970);
                                        };

                                        const formatShortNucleo = (name: string | undefined) => {
                                            if (!name) return null;
                                            return name.split('-')[0].trim();
                                        };

                                        const nucleo = studentData?.nucleo_id ? formatShortNucleo(nucleos.find(n => n.id === studentData.nucleo_id)?.nome) : null;
                                        const idade = studentData ? calcAge(studentData.data_nascimento) : null;
                                        const escolaTipo = studentData?.escola_tipo || null;

                                        const renderCell = (val: any, fallbackLabel = 'Pendente') => {
                                            if (!val) return <div className="border-2 border-yellow-400 text-yellow-600 bg-yellow-50 text-[10px] font-bold px-1 py-0.5 rounded text-center inline-block">{fallbackLabel}</div>;
                                            return <span>{val}</span>;
                                        };

                                        const handleRowClick = (item: AttendanceReportItem) => {
                                            if (selectedAttendanceItem?.id === item.id) {
                                                setSelectedAttendanceItem(null);
                                                setIsEditingDetalhado(false);
                                            } else {
                                                setSelectedAttendanceItem(item);
                                                setEditingSubjects(item.subjects ? JSON.parse(JSON.stringify(item.subjects)) : DEFAULT_SUBJECTS.map(d => ({ discipline: d, b1: null, b2: null, b3: null, b4: null })));
                                                setIsEditingDetalhado(false);
                                            }
                                        };

                                        return (
                                            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50" onClick={() => handleRowClick(item)}>
                                                <td className="p-2 text-center text-gray-500 border-r border-gray-200">{idx + 1}</td>
                                                <td className="p-2 text-center border-r border-gray-200 font-bold text-gray-800">
                                                    {renderCell(nucleo)}
                                                </td>
                                                <td className="p-2 font-bold text-gray-800 border-r border-gray-200 cursor-pointer text-blue-600 hover:underline">
                                                    {item.studentName}
                                                </td>
                                                <td className="p-2 text-center border-r border-gray-200 font-bold text-gray-800">
                                                    {renderCell(idade)}
                                                </td>
                                                <td className="p-2 text-center border-r border-gray-200 font-bold text-gray-800">
                                                    {renderCell(escolaTipo === 'PUBLICA' ? 'Pública' : escolaTipo === 'PARTICULAR' ? 'Particular' : null)}
                                                </td>
                                                <td className="p-2 text-center border-r border-gray-200 font-bold text-black">
                                                    {isEditingTable ? (
                                                        <input 
                                                            type="number" 
                                                            value={editData[item.studentName]?.grade1 !== undefined ? editData[item.studentName].grade1 ?? '' : item.grade1 ?? ''}
                                                            onChange={e => {
                                                                const val = e.target.value ? parseFloat(e.target.value) : null;
                                                                setEditData(prev => ({ ...prev, [item.studentName]: { ...prev[item.studentName] || { grade1: item.grade1, grade2: item.grade2 }, grade1: val } }));
                                                            }}
                                                            className="w-16 border border-blue-300 rounded px-1 py-0.5 text-center"
                                                        />
                                                    ) : (
                                                        item.grade1?.toFixed(2) ?? '-'
                                                    )}
                                                </td>
                                                <td className="p-2 text-center border-r border-gray-200 font-bold text-black">{item.grade1 || (editData[item.studentName]?.grade1 !== undefined && editData[item.studentName].grade1 !== null) ? getAvaliacaoConceito(editData[item.studentName]?.grade1 !== undefined ? editData[item.studentName].grade1! : item.grade1!) : '-'}</td>
                                                <td className="p-2 text-center border-r border-gray-200 font-bold text-black">
                                                    {isEditingTable ? (
                                                        <input 
                                                            type="number" 
                                                            value={editData[item.studentName]?.grade2 !== undefined ? editData[item.studentName].grade2 ?? '' : item.grade2 ?? ''}
                                                            onChange={e => {
                                                                const val = e.target.value ? parseFloat(e.target.value) : null;
                                                                setEditData(prev => ({ ...prev, [item.studentName]: { ...prev[item.studentName] || { grade1: item.grade1, grade2: item.grade2 }, grade2: val } }));
                                                            }}
                                                            className="w-16 border border-blue-300 rounded px-1 py-0.5 text-center"
                                                        />
                                                    ) : (
                                                        item.grade2?.toFixed(2) ?? '-'
                                                    )}
                                                </td>
                                                <td className="p-2 text-center border-r border-gray-200 font-bold text-black">{item.grade2 || (editData[item.studentName]?.grade2 !== undefined && editData[item.studentName].grade2 !== null) ? getAvaliacaoConceito(editData[item.studentName]?.grade2 !== undefined ? editData[item.studentName].grade2! : item.grade2!) : '-'}</td>
                                                <td className="p-2 text-center font-bold">
                                                    <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase
                                                        ${item.status === 'MELHORA' ? 'bg-green-100 text-green-800'
                                                            : item.status === 'PIORA' ? 'bg-red-100 text-red-800'
                                                                : 'bg-gray-100 text-gray-600'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* DETALHES EXPANDIDOS (Draggable Individualmente) */}
                        {selectedAttendanceItem && (
                            <div className="bg-white border border-blue-200 rounded-lg shadow-lg p-4 animate-fade-in relative">
                                <button onClick={() => { setSelectedAttendanceItem(null); setIsEditingDetalhado(false); }} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">✕</button>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                        Boletim Detalhado: {selectedAttendanceItem.studentName}
                                    </h3>
                                    {!isEditingDetalhado ? (
                                        <button onClick={() => setIsEditingDetalhado(true)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            Editar
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => { setIsEditingDetalhado(false); setEditingSubjects(selectedAttendanceItem.subjects ? JSON.parse(JSON.stringify(selectedAttendanceItem.subjects)) : []); }} className="text-xs text-gray-600 hover:text-gray-800 bg-gray-100 px-2 py-1 rounded">Cancelar</button>
                                            <button onClick={() => {
                                                if (onUpdateHistory && history) {
                                                    const validB1s = editingSubjects.map(s => s.b1).filter(n => n !== null && n !== undefined) as number[];
                                                    const validB4s = editingSubjects.map(s => s.b4).filter(n => n !== null && n !== undefined) as number[];
                                                    const avg1 = validB1s.length > 0 ? validB1s.reduce((a, b) => a + b, 0) / validB1s.length : selectedAttendanceItem.grade1;
                                                    const avg2 = validB4s.length > 0 ? validB4s.reduce((a, b) => a + b, 0) / validB4s.length : selectedAttendanceItem.grade2;
                                                    const finalStatus = avg2 > avg1 ? 'MELHORA' : avg2 < avg1 ? 'PIORA' : 'MANTEVE';

                                                    const docCorrection: DocumentLog = {
                                                        id: `doc_corr_${Date.now()}`,
                                                        timestamp: new Date().toISOString(),
                                                        type: 'BOLETIM',
                                                        title: `Correção Manual - ${selectedAttendanceItem.studentName}`,
                                                        description: `Edição manual no relatório de assiduidade.`,
                                                        metaData: {
                                                            studentName: selectedAttendanceItem.studentName,
                                                            grade1: avg1,
                                                            attendance1: selectedAttendanceItem.attendance1,
                                                            grade2: avg2,
                                                            attendance2: selectedAttendanceItem.attendance2,
                                                            periodType: 'FINAL',
                                                            status: finalStatus,
                                                            avaliacao: getAvaliacaoConceito(avg2 > 0 ? avg2 : avg1),
                                                            subjects: editingSubjects
                                                        }
                                                    };
                                                    onUpdateHistory([...history, docCorrection]);
                                                    setIsEditingDetalhado(false);
                                                }
                                            }} className="flex items-center gap-1 text-xs text-white hover:bg-green-700 bg-green-600 px-2 py-1 rounded">Salvar Correção</button>
                                        </div>
                                    )}
                                </div>

                                <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, 'TABLE_ATTENDANCE_DETAILED', { rows: [selectedAttendanceItem] }, `Notas: ${selectedAttendanceItem.studentName}`)}
                                    className="border border-gray-300 rounded overflow-hidden cursor-move hover:ring-2 ring-blue-300 transition-all"
                                >
                                    <div className="bg-blue-50 text-blue-800 text-[10px] font-bold text-center py-1 uppercase">Arraste esta tabela para o PDF</div>
                                    <table className="w-full text-[10px] text-left">
                                        <thead className="bg-blue-600 text-white font-bold">
                                            <tr>
                                                <th className="p-2 border-r border-blue-500 align-middle" rowSpan={2}>Disciplina</th>
                                                <th className="p-1 text-center border-r border-blue-500" colSpan={2}>1º Bimestre</th>
                                                <th className="p-1 text-center border-r border-blue-500" colSpan={2}>2º Bimestre</th>
                                                <th className="p-1 text-center border-r border-blue-500" colSpan={2}>3º Bimestre</th>
                                                <th className="p-1 text-center" colSpan={2}>4º Bimestre</th>
                                            </tr>
                                            <tr>
                                                <th className="px-1 py-0.5 border-r border-blue-500 border-t border-blue-500 text-center font-normal">Nota</th>
                                                <th className="px-1 py-0.5 border-r border-blue-500 border-t border-blue-500 text-center font-normal">Faltas</th>
                                                <th className="px-1 py-0.5 border-r border-blue-500 border-t border-blue-500 text-center font-normal">Nota</th>
                                                <th className="px-1 py-0.5 border-r border-blue-500 border-t border-blue-500 text-center font-normal">Faltas</th>
                                                <th className="px-1 py-0.5 border-r border-blue-500 border-t border-blue-500 text-center font-normal">Nota</th>
                                                <th className="px-1 py-0.5 border-r border-blue-500 border-t border-blue-500 text-center font-normal">Faltas</th>
                                                <th className="px-1 py-0.5 border-r border-blue-500 border-t border-blue-500 text-center font-normal">Nota</th>
                                                <th className="px-1 py-0.5 border-t border-blue-500 text-center font-normal">Faltas</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-black">
                                            {(isEditingDetalhado ? editingSubjects : selectedAttendanceItem.subjects)?.map((s, i) => (
                                                <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                                                    <td className="p-1.5 font-bold border-r border-gray-200">
                                                        {isEditingDetalhado ? <input className="w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500" value={s.discipline} onChange={e => { const newSubj = [...editingSubjects]; newSubj[i].discipline = e.target.value; setEditingSubjects(newSubj); }} /> : s.discipline}
                                                    </td>
                                                    <td className="p-1.5 text-center font-bold border-r border-gray-200">
                                                        {isEditingDetalhado ? <input type="number" step="0.1" className="w-full text-center bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500" value={s.b1 ?? ''} onChange={e => { const newSubj = [...editingSubjects]; newSubj[i].b1 = e.target.value ? parseFloat(e.target.value) : null; setEditingSubjects(newSubj); }} placeholder="-" /> : s.b1 ?? '-'}
                                                    </td>
                                                    <td className="p-1.5 text-center font-bold border-r border-gray-200">
                                                        {isEditingDetalhado ? <input type="number" step="1" className="w-full text-center bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500" value={s.f1 ?? ''} onChange={e => { const newSubj = [...editingSubjects]; newSubj[i].f1 = e.target.value ? parseInt(e.target.value) : null; setEditingSubjects(newSubj); }} placeholder="-" /> : s.f1 ?? '-'}
                                                    </td>
                                                    <td className="p-1.5 text-center font-bold border-r border-gray-200">
                                                        {isEditingDetalhado ? <input type="number" step="0.1" className="w-full text-center bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500" value={s.b2 ?? ''} onChange={e => { const newSubj = [...editingSubjects]; newSubj[i].b2 = e.target.value ? parseFloat(e.target.value) : null; setEditingSubjects(newSubj); }} placeholder="-" /> : s.b2 ?? '-'}
                                                    </td>
                                                    <td className="p-1.5 text-center font-bold border-r border-gray-200">
                                                        {isEditingDetalhado ? <input type="number" step="1" className="w-full text-center bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500" value={s.f2 ?? ''} onChange={e => { const newSubj = [...editingSubjects]; newSubj[i].f2 = e.target.value ? parseInt(e.target.value) : null; setEditingSubjects(newSubj); }} placeholder="-" /> : s.f2 ?? '-'}
                                                    </td>
                                                    <td className="p-1.5 text-center font-bold border-r border-gray-200">
                                                        {isEditingDetalhado ? <input type="number" step="0.1" className="w-full text-center bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500" value={s.b3 ?? ''} onChange={e => { const newSubj = [...editingSubjects]; newSubj[i].b3 = e.target.value ? parseFloat(e.target.value) : null; setEditingSubjects(newSubj); }} placeholder="-" /> : s.b3 ?? '-'}
                                                    </td>
                                                    <td className="p-1.5 text-center font-bold border-r border-gray-200">
                                                        {isEditingDetalhado ? <input type="number" step="1" className="w-full text-center bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500" value={s.f3 ?? ''} onChange={e => { const newSubj = [...editingSubjects]; newSubj[i].f3 = e.target.value ? parseInt(e.target.value) : null; setEditingSubjects(newSubj); }} placeholder="-" /> : s.f3 ?? '-'}
                                                    </td>
                                                    <td className="p-1.5 text-center font-bold border-r border-gray-200">
                                                        {isEditingDetalhado ? <input type="number" step="0.1" className="w-full text-center bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500" value={s.b4 ?? ''} onChange={e => { const newSubj = [...editingSubjects]; newSubj[i].b4 = e.target.value ? parseFloat(e.target.value) : null; setEditingSubjects(newSubj); }} placeholder="-" /> : s.b4 ?? '-'}
                                                    </td>
                                                    <td className="p-1.5 text-center font-bold">
                                                        {isEditingDetalhado ? <input type="number" step="1" className="w-full text-center bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500" value={s.f4 ?? ''} onChange={e => { const newSubj = [...editingSubjects]; newSubj[i].f4 = e.target.value ? parseInt(e.target.value) : null; setEditingSubjects(newSubj); }} placeholder="-" /> : s.f4 ?? '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(() => {
                                                const sourceSubjects = isEditingDetalhado ? editingSubjects : (selectedAttendanceItem.subjects || []);
                                                const avg1 = calculateAverage(sourceSubjects.map(s => s.b1));
                                                const avg2 = calculateAverage(sourceSubjects.map(s => s.b2));
                                                const avg3 = calculateAverage(sourceSubjects.map(s => s.b3));
                                                const avg4 = calculateAverage(sourceSubjects.map(s => s.b4));
                                                return (
                                                    <>
                                                        <tr className="bg-yellow-50 font-bold border-t-2 border-gray-300">
                                                            <td className="p-1.5 text-right border-r border-gray-300">Média</td>
                                                            <td className="p-1.5 text-center border-r border-gray-300" colSpan={2}>{avg1 > 0 ? avg1.toFixed(1) : '-'}</td>
                                                            <td className="p-1.5 text-center border-r border-gray-300" colSpan={2}>{avg2 > 0 ? avg2.toFixed(1) : '-'}</td>
                                                            <td className="p-1.5 text-center border-r border-gray-300" colSpan={2}>{avg3 > 0 ? avg3.toFixed(1) : '-'}</td>
                                                            <td className="p-1.5 text-center" colSpan={2}>{avg4 > 0 ? avg4.toFixed(1) : '-'}</td>
                                                        </tr>
                                                        <tr className="bg-blue-50 font-bold">
                                                            <td className="p-1.5 text-right border-r border-gray-300">Aproveitamento</td>
                                                            <td className="p-1.5 text-center border-r border-gray-300 text-[9px]" colSpan={2}>{avg1 > 0 ? getAvaliacaoConceito(avg1) : '-'}</td>
                                                            <td className="p-1.5 text-center border-r border-gray-300 text-[9px]" colSpan={2}>{avg2 > 0 ? getAvaliacaoConceito(avg2) : '-'}</td>
                                                            <td className="p-1.5 text-center border-r border-gray-300 text-[9px]" colSpan={2}>{avg3 > 0 ? getAvaliacaoConceito(avg3) : '-'}</td>
                                                            <td className="p-1.5 text-center text-[9px]" colSpan={2}>{avg4 > 0 ? getAvaliacaoConceito(avg4) : '-'}</td>
                                                        </tr>
                                                    </>
                                                );
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // === 6. DECLARAÇÃO DE MATRÍCULA (NOVO MENU) ===
    if (mode === 'DECLARACAO_MENU') {
        // Filter history for stored declarations
        const declaracaoHistory = history.filter(d => d.type === 'DECLARACAO_MATRICULA');

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                {/* Header */}
                <div className="bg-white p-4 shadow-sm flex items-center gap-4 border-b-4 border-blue-600">
                    <button onClick={onBack} className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <h1 className="font-bold text-lg text-gray-800">Declaração de Matrícula</h1>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col justify-center max-w-md mx-auto w-full">
                    <h2 className="text-center text-lg font-bold text-gray-800 mb-2">Tipo de Declaração</h2>
                    <p className="text-center text-gray-500 text-sm mb-6">Escolha como deseja registrar a declaração.</p>

                    {/* Option 1: Digitalizar Ficha Física */}
                    <button
                        onClick={() => { setPreviousMode('DECLARACAO_MENU'); setMode('CAMERA'); }}
                        className="flex flex-col items-center justify-center p-6 bg-white border-2 border-green-100 rounded-xl shadow-sm hover:border-green-500 hover:shadow-md transition-all group mb-6"
                    >
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <span className="font-bold text-gray-800">Digitalizar Ficha Física</span>
                        <span className="text-xs text-gray-500 mt-1">Usar Câmera Inteligente</span>
                    </button>

                    {/* Option 2: Visualizar Declarações Salvas */}
                    <button
                        onClick={() => setMode('DECLARACAO_VIEW')}
                        className="flex items-center justify-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:bg-white hover:border-gray-400 transition-all text-gray-700 font-bold text-sm mb-6"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Visualizar Declarações Salvas
                        {declaracaoHistory.length > 0 && (
                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">{declaracaoHistory.length}</span>
                        )}
                    </button>

                    {/* Option 3: Carregar do dispositivo */}
                    <label className="text-center cursor-pointer">
                        <span className="text-blue-600 font-bold text-sm hover:underline">Carregar foto do dispositivo</span>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        const base64 = ev.target?.result as string;
                                        setFinalImage(base64);
                                        setFile(file);
                                        setMode('DECLARACAO_VIEW');
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </label>
                </div>
            </div>
        );
    }

    // === DECLARACAO_VIEW - Visualizar e Salvar ===
    if (mode === 'DECLARACAO_VIEW') {
        // Filter history for stored declarations
        const declaracaoHistory = history.filter(d => d.type === 'DECLARACAO_MATRICULA');

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col relative">
                {/* Header */}
                <div className="bg-white p-4 shadow-sm flex items-center gap-4 border-b border-gray-200">
                    <button onClick={() => setMode('DECLARACAO_MENU')} className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <h1 className="font-bold text-lg text-gray-800">
                        {finalImage ? 'Salvar Declaração' : 'Declarações Salvas'}
                    </h1>
                </div>

                <div className="flex-1 p-4 max-w-2xl mx-auto w-full pb-24">
                    {/* If there's a new image to save */}
                    {finalImage && (
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-3">Imagem Capturada</p>
                            <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'IMAGE', { url: finalImage, studentName: studentName || 'Declaração' }, `Declaração: ${studentName || 'Sem nome'}`)}
                                className="cursor-move hover:ring-2 ring-blue-300 transition-all rounded-lg overflow-hidden"
                            >
                                <img src={finalImage} alt="Declaração" className="w-full rounded-lg border border-gray-200" />
                                <p className="text-center text-[10px] text-blue-500 font-bold mt-2 bg-blue-50 py-1">☂ Arraste para o PDF</p>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Aluno</label>
                                    <input
                                        type="text"
                                        value={studentName}
                                        onChange={(e) => setStudentName(e.target.value)}
                                        placeholder="Identificar aluno..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const docData: DocumentLog = {
                                            id: `dec_${Date.now()}`,
                                            timestamp: new Date().toISOString(),
                                            type: 'DECLARACAO_MATRICULA',
                                            title: `Declaração - ${studentName || 'Sem nome'}`,
                                            description: studentName ? `Declaração de matrícula de ${studentName}` : 'Declaração de matrícula',
                                            metaData: {
                                                studentName: studentName || 'Não identificado',
                                                imageUrl: finalImage
                                            }
                                        };
                                        onSave(docData);
                                        setFinalImage(null);
                                        setStudentName('');
                                        setSuccess(true);
                                    }}
                                    className="w-full py-3 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition-colors"
                                >
                                    Salvar Declaração
                                </button>
                            </div>
                        </div>
                    )}

                    {/* History List */}
                    {!finalImage && (
                        <>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Filtrar por nome..."
                                    value={declaracaoFilter}
                                    onChange={(e) => setDeclaracaoFilter(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm"
                                />
                            </div>

                            {declaracaoHistory.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <p>Nenhuma declaração salva ainda.</p>
                                    <button
                                        onClick={() => setMode('DECLARACAO_MENU')}
                                        className="mt-4 text-blue-600 font-bold text-sm"
                                    >
                                        ← Voltar e Digitalizar
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {declaracaoHistory
                                        .filter(d => !declaracaoFilter || (d.metaData?.studentName || '').toLowerCase().includes(declaracaoFilter.toLowerCase()))
                                        .map((doc) => (
                                            <div
                                                key={doc.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, 'IMAGE', { url: doc.metaData?.imageUrl, studentName: doc.metaData?.studentName }, `Declaração: ${doc.metaData?.studentName || 'Sem nome'}`)}
                                                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:ring-2 ring-blue-300 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {doc.metaData?.imageUrl && (
                                                        <img src={doc.metaData.imageUrl} alt="Preview" className="w-16 h-16 object-cover rounded border border-gray-200" />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-800">{doc.metaData?.studentName || 'Sem nome'}</p>
                                                        <p className="text-xs text-gray-500">{new Date(doc.timestamp).toLocaleString()}</p>
                                                    </div>
                                                    <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded">ARRASTE</span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    return <div className="p-8 text-center text-gray-500">Modo desconhecido: {mode}</div>;
};
