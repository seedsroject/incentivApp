import React, { useState, useMemo } from 'react';
import { Nucleo, PDFItemType, StudentDraft, DocumentLog, ProjectId, User } from '../types';
import { usePDFBuilder } from './PDFBuilderContext';
import { AdminMap } from './AdminMap';
import { Logo } from './Logo';
import { DataCrossReferenceModal } from './DataCrossReferenceModal';
import { NucleoDetailModal } from './NucleoDetailModal';
import { NucleoAddModal } from './NucleoAddModal';
import { supabase } from '../services/supabaseClient';

interface AdminDashboardProps {
    nucleos: Nucleo[];
    onNavigateToServices: () => void;
    userParams: { nome: string; email: string };
    currentUser: User;
    onLogout: () => void;
    students: StudentDraft[];
    documents: DocumentLog[];
    onAddNucleo: (nucleo: Nucleo) => void;
    onDischargeStudent?: (studentId: string, nucleoId: string) => void;
    projectLogo?: string;
    projectId?: ProjectId;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    nucleos,
    onNavigateToServices,
    userParams,
    currentUser,
    onLogout,
    students,
    documents,
    onAddNucleo,
    onDischargeStudent,
    projectLogo = '/logo.png',
    projectId = 'FORMANDO_CAMPEOES'
}) => {
    // --- THEME BY PROJECT ---
    const theme = useMemo(() => {
        if (projectId === 'FUTEBOL') return {
            gradient: 'from-green-500 to-emerald-600',
            gradientHover: 'hover:from-green-600 hover:to-emerald-700',
            shadow: 'shadow-green-200',
            shadowHover: 'hover:shadow-emerald-300',
            bgLight: 'bg-green-50',
            bgMedium: 'bg-green-100',
            ring: 'ring-green-500',
            text: 'text-green-600',
            textLight: 'text-green-400',
            textSubtle: 'text-green-100',
            border: 'border-green-200',
            borderHover: 'hover:border-green-300',
            hoverBg: 'hover:bg-green-50/30',
            badgeBg: 'bg-green-100',
            badgeText: 'text-green-600',
            hoverText: 'hover:text-green-700',
            overlayBg: 'group-hover:bg-green-500/5',
            overlayBtn: 'bg-green-600',
        };
        if (projectId === 'DANIEL_DIAS') return {
            gradient: 'from-sky-500 to-slate-500',
            gradientHover: 'hover:from-sky-600 hover:to-slate-600',
            shadow: 'shadow-sky-200',
            shadowHover: 'hover:shadow-slate-300',
            bgLight: 'bg-sky-50',
            bgMedium: 'bg-sky-100',
            ring: 'ring-sky-500',
            text: 'text-sky-600',
            textLight: 'text-sky-400',
            textSubtle: 'text-sky-100',
            border: 'border-sky-200',
            borderHover: 'hover:border-sky-300',
            hoverBg: 'hover:bg-sky-50/30',
            badgeBg: 'bg-sky-100',
            badgeText: 'text-sky-600',
            hoverText: 'hover:text-sky-700',
            overlayBg: 'group-hover:bg-sky-500/5',
            overlayBtn: 'bg-sky-600',
        };
        return {
            gradient: 'from-blue-600 to-teal-500',
            gradientHover: 'hover:from-blue-700 hover:to-teal-600',
            shadow: 'shadow-blue-200',
            shadowHover: 'hover:shadow-teal-300',
            bgLight: 'bg-blue-50',
            bgMedium: 'bg-blue-100',
            ring: 'ring-blue-500',
            text: 'text-blue-600',
            textLight: 'text-blue-400',
            textSubtle: 'text-blue-100',
            border: 'border-blue-200',
            borderHover: 'hover:border-blue-200',
            hoverBg: 'hover:bg-blue-50/30',
            badgeBg: 'bg-blue-100',
            badgeText: 'text-blue-600',
            hoverText: 'hover:text-blue-700',
            overlayBg: 'group-hover:bg-blue-500/5',
            overlayBtn: 'bg-blue-600',
        };
    }, [projectId]);
    const [selectedNucleoId, setSelectedNucleoId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'LOW' | 'MEDIUM' | 'HIGH' | null>(null);
    const [reportItems, setReportItems] = useState<Nucleo[]>([]);
    const [activeTab, setActiveTab] = useState<'estoque' | 'alunos' | 'nucleos' | 'acessos'>('estoque');
    const [isCrossRefModalOpen, setIsCrossRefModalOpen] = useState(false);
    const [pendingAccesses, setPendingAccesses] = useState<any[]>([]);
    const [isNucleoDetailOpen, setIsNucleoDetailOpen] = useState(false);
    const [isAddNucleoOpen, setIsAddNucleoOpen] = useState(false);

    const selectedNucleo = nucleos.find(n => n.id === selectedNucleoId);

    const { addItemToPage, pages, addPage } = usePDFBuilder();
    const [isPageSelectorOpen, setIsPageSelectorOpen] = useState(false);
    const [pendingNucleo, setPendingNucleo] = useState<Nucleo | null>(null);
    // State to track what is being dragged globally (to support dragEnter triggering)
    const [draggedNucleo, setDraggedNucleo] = useState<Nucleo | null>(null);
    // Type of pending report: 'inventory' or 'students'
    const [pendingReportType, setPendingReportType] = useState<'inventory' | 'students'>('inventory');
    // For students report: store nucleo ID and students data
    const [pendingStudentsData, setPendingStudentsData] = useState<{ nucleoId: string; nucleoName: string; students: any[] } | null>(null);

    // Fetch pending accesses when tab changes to 'acessos'
    React.useEffect(() => {
        if (activeTab === 'acessos') {
            const fetchPending = async () => {
                const { data, error } = await supabase
                    .from('user_project_access')
                    .select('*, profiles(nome, email), projects!inner(slug), nucleos(estado)')
                    .eq('projects.slug', projectId)
                    .in('status', ['PENDENTE', 'APROVADO'])
                    .order('status', { ascending: false }); // PENDENTE comes before APROVADO because P > A
                
                if (error) {
                    console.error("Erro ao buscar acessos:", error);
                }

                if (data) {
                    const isSuperAdmin = currentUser.email === 'admin.geral@formandocampeoes.org.br';
                    let filteredData = data;
                    if (!isSuperAdmin && currentUser.estado_responsavel) {
                        filteredData = data.filter((req: any) => 
                            req.estado_responsavel === currentUser.estado_responsavel || 
                            (req.nucleos && req.nucleos.estado === currentUser.estado_responsavel)
                        );
                    }
                    setPendingAccesses(filteredData);
                }
            };
            fetchPending();
        }
    }, [activeTab, projectId]);

    const handleApproveAccess = async (accessId: string) => {
        const { error } = await supabase
            .from('user_project_access')
            .update({ status: 'APROVADO' })
            .eq('id', accessId);
        if (!error) {
            setPendingAccesses(prev => prev.map(a => a.id === accessId ? { ...a, status: 'APROVADO' } : a));
            alert('Acesso aprovado com sucesso!');
        } else {
            alert('Erro ao aprovar acesso.');
        }
    };

    const handleRevokeAccess = async (accessId: string) => {
        const { error } = await supabase
            .from('user_project_access')
            .update({ status: 'PENDENTE' })
            .eq('id', accessId);
        if (!error) {
            setPendingAccesses(prev => prev.map(a => a.id === accessId ? { ...a, status: 'PENDENTE' } : a));
            alert('Acesso revogado (retornou para Pendente)!');
        } else {
            alert('Erro ao revogar acesso.');
        }
    };

    const handleRejectAccess = async (accessId: string) => {
        const { error } = await supabase
            .from('user_project_access')
            .delete()
            .eq('id', accessId);
        if (!error) {
            setPendingAccesses(prev => prev.filter(a => a.id !== accessId));
            alert('Cadastro apagado do projeto!');
        } else {
            alert('Erro ao apagar cadastro.');
        }
    };

    // DnD Handlers for Inventory (Estoque)
    const handleDragStart = (e: React.DragEvent, nucleo: Nucleo) => {
        setDraggedNucleo(nucleo); // Set global drag state
        setPendingReportType('inventory');
        e.dataTransfer.setData('nucleoId', nucleo.id);
        e.dataTransfer.setData('reportType', 'inventory');
        e.dataTransfer.effectAllowed = 'copy';
    };

    // DnD Handler for Students Report (Alunos por Núcleo)
    const handleStudentsDragStart = (e: React.DragEvent, nucleo: { id: string; nome: string }, nucleoStudents: any[]) => {
        setPendingReportType('students');
        setPendingStudentsData({
            nucleoId: nucleo.id,
            nucleoName: nucleo.nome,
            students: nucleoStudents
        });
        e.dataTransfer.setData('reportType', 'students');
        e.dataTransfer.setData('nucleoId', nucleo.id);
        e.dataTransfer.effectAllowed = 'copy';
        // Immediately open page selector since we have all data
        setIsPageSelectorOpen(true);
    };

    const handleDragEnd = () => {
        setDraggedNucleo(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    // Sidebar specifically
    const handleSidebarDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        if (draggedNucleo && !isPageSelectorOpen) {
            setPendingNucleo(draggedNucleo);
            setPendingReportType('inventory');
            setIsPageSelectorOpen(true);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const nucleoId = e.dataTransfer.getData('nucleoId');
        const reportType = e.dataTransfer.getData('reportType') || 'inventory';
        // Fallback if dropped directly on sidebar without modal opening (unlikely with spring-loaded)
        // or if dropped elsewhere handled by other logic
        const nucleo = nucleos.find(n => n.id === nucleoId);

        if (nucleo && reportType === 'inventory') {
            setPendingNucleo(nucleo);
            setPendingReportType('inventory');
            setIsPageSelectorOpen(true);
        }
        setDraggedNucleo(null);
    };

    const handleSelectPage = (pageId: string) => {
        if (pendingReportType === 'inventory' && pendingNucleo) {
            addItemToPage(
                pageId,
                'NUCLEO_INVENTORY_TABLE',
                {
                    nucleoName: pendingNucleo.nome,
                    stockStatus: pendingNucleo.stockStatus,
                    stockDetails: pendingNucleo.stockDetails || []
                },
                `Estoque - ${pendingNucleo.nome}`,
                { width: 600, height: 400 }
            );
            alert(`Relatório de estoque do núcleo ${pendingNucleo.nome} adicionado à página!`);
        } else if (pendingReportType === 'students' && pendingStudentsData) {
            addItemToPage(
                pageId,
                'STUDENTS_BY_NUCLEO_TABLE',
                {
                    nucleoName: pendingStudentsData.nucleoName,
                    students: pendingStudentsData.students
                },
                `Alunos - ${pendingStudentsData.nucleoName}`,
                { width: 700, height: 500 }
            );
            alert(`Relatório de alunos do núcleo ${pendingStudentsData.nucleoName} adicionado à página!`);
        }
        setIsPageSelectorOpen(false);
        setPendingNucleo(null);
        setPendingStudentsData(null);
    };

    const handleAddPageAndSelect = () => {
        addPage();
        setTimeout(() => {
            // Permitir selecionar a nova página visualmente após render
        }, 100);
    };

    const handleNotify = (e: React.MouseEvent, nucleoName: string) => {
        e.stopPropagation();
        alert(`⚠️ Notificação de falta de estoque enviada para: ${nucleoName}`);
    };

    // Statistics for "Heatmap" dashboard summary
    const totalNucleos = nucleos.length;
    const criticalStock = nucleos.filter(n => n.stockStatus === 'LOW').length;
    const warningStock = nucleos.filter(n => n.stockStatus === 'MEDIUM').length;
    const okStock = nucleos.filter(n => n.stockStatus === 'HIGH').length;

    // Filtered list for Sidebar
    const filteredNucleos = filterStatus
        ? nucleos.filter(n => n.stockStatus === filterStatus)
        : [];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header Premium */}
            <header className="bg-white shadow-sm z-10 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex items-center justify-center">
                        <img src={projectLogo} alt="Logo" className="h-full w-auto object-contain" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Painel Administrativo</h1>
                        <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">Visão Nacional</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-700">{userParams.nome}</p>
                        <p className="text-xs text-gray-400">{userParams.email}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Sair"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 flex flex-col lg:flex-row gap-6 overflow-hidden max-h-[calc(100vh-80px)]">

                {/* Sidebar / Info Panel */}
                <aside className="w-full lg:w-96 flex flex-col gap-4 shrink-0 overflow-y-auto pb-20 lg:pb-0">

                    {/* Report Generation Drop Zone */}
                    {/* Quick Actions Card */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Acesso Rápido</h3>
                        <button
                            onClick={onNavigateToServices}
                            className={`w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${theme.gradient} text-white shadow-lg ${theme.shadow} ${theme.shadowHover} transform hover:-translate-y-0.5 transition-all group`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold">Acessar Serviços</span>
                                    <span className={`text-xs ${theme.textSubtle}`}>Gerenciar Alunos, Docs...</span>
                                </div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>

                    {/* Stats Overview */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-1">
                        {/* Tab Toggle */}
                        <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
                            <button
                                onClick={() => setActiveTab('estoque')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'estoque' ? `bg-gradient-to-r ${theme.gradient} text-white shadow-sm` : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Estoque
                            </button>
                            <button
                                onClick={() => setActiveTab('alunos')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'alunos' ? `bg-gradient-to-r ${theme.gradient} text-white shadow-sm` : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Alunos
                            </button>
                            <button
                                onClick={() => setActiveTab('nucleos')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'nucleos' ? `bg-gradient-to-r ${theme.gradient} text-white shadow-sm` : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Núcleos
                            </button>
                            <button
                                onClick={() => setActiveTab('acessos')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'acessos' ? `bg-gradient-to-r ${theme.gradient} text-white shadow-sm` : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Acessos
                                {pendingAccesses.length > 0 && activeTab !== 'acessos' && (
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                )}
                            </button>
                        </div>

                        {activeTab === 'estoque' ? (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Status da Rede</h3>
                                    {filterStatus && (
                                        <button onClick={() => setFilterStatus(null)} className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase bg-red-50 px-2 py-1 rounded-md transition-colors">
                                            Limpar Filtro
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-6">
                                    <button
                                        onClick={() => setFilterStatus(null)}
                                        className={`p-3 rounded-xl text-center transition-all ${filterStatus === null ? `${theme.bgMedium} ring-2 ${theme.ring}` : `${theme.bgLight} hover:${theme.bgMedium}`}`}
                                    >
                                        <span className={`block text-2xl font-black ${theme.text}`}>{totalNucleos}</span>
                                        <span className={`text-[10px] font-bold ${theme.textLight} uppercase`}>Núcleos</span>
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus('HIGH')}
                                        className={`p-3 rounded-xl text-center transition-all ${filterStatus === 'HIGH' ? 'bg-green-100 ring-2 ring-green-500' : 'bg-green-50 hover:bg-green-100'}`}
                                    >
                                        <span className="block text-2xl font-black text-green-600">{okStock}</span>
                                        <span className="text-[10px] font-bold text-green-400 uppercase">Estoque OK</span>
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus('LOW')}
                                        className={`p-3 rounded-xl text-center transition-all ${filterStatus === 'LOW' ? 'bg-red-100 ring-2 ring-red-500' : 'bg-red-50 hover:bg-red-100'}`}
                                    >
                                        <span className="block text-2xl font-black text-red-600">{criticalStock}</span>
                                        <span className="text-[10px] font-bold text-red-400 uppercase">Críticos</span>
                                    </button>
                                </div>

                                {/* Legend */}
                                <div className="space-y-3 mb-6">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">
                                        {filterStatus ? `Filtrando: ${filterStatus === 'HIGH' ? 'Estoque Adequado' : filterStatus === 'MEDIUM' ? 'Atenção' : 'Crítico'}` : 'Legenda do Mapa'}
                                    </h4>

                                    {!filterStatus ? (
                                        <>
                                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setFilterStatus('HIGH')}>
                                                <div className="flex items-center gap-3">
                                                    <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-200"></span>
                                                    <span className="text-xs font-medium text-gray-600">Abastecido (&gt;15%)</span>
                                                </div>
                                                <span className="text-xs font-bold text-gray-800">{okStock}</span>
                                            </div>
                                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setFilterStatus('MEDIUM')}>
                                                <div className="flex items-center gap-3">
                                                    <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm shadow-yellow-200"></span>
                                                    <span className="text-xs font-medium text-gray-600">Atenção (5-15%)</span>
                                                </div>
                                                <span className="text-xs font-bold text-gray-800">{warningStock}</span>
                                            </div>
                                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setFilterStatus('LOW')}>
                                                <div className="flex items-center gap-3">
                                                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-200 animate-pulse"></span>
                                                    <span className="text-xs font-medium text-gray-600">Crítico (&lt;5%)</span>
                                                </div>
                                                <span className="text-xs font-bold text-gray-800">{criticalStock}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                            {filteredNucleos.map(n => (
                                                <div
                                                    key={n.id}
                                                    draggable={true}
                                                    onDragStart={(e) => handleDragStart(e, n)}
                                                    onDragEnd={handleDragEnd}
                                                    onClick={() => setSelectedNucleoId(n.id)}
                                                    className={`p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-grab active:cursor-grabbing flex flex-col gap-1 shadow-sm transition-all group ${selectedNucleoId === n.id ? `${theme.bgLight} ${theme.border}` : ''}`}
                                                >
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className="text-xs font-medium text-gray-700 truncate max-w-[150px]">{n.nome.split(' - ')[0]}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full ${n.stockStatus === 'HIGH' ? 'bg-green-500' : n.stockStatus === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                                            <button
                                                                onClick={(e) => handleNotify(e, n.nome)}
                                                                className="text-gray-300 hover:text-yellow-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Enviar Alerta/Notificação"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {n.stockDetails && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {n.stockDetails.slice(0, 4).map((item, idx) => (
                                                                <span key={idx} className={`text-[9px] px-1.5 py-0.5 rounded ${item.status === 'LOW' ? 'bg-red-100 text-red-700 font-bold' : 'bg-gray-100 text-gray-500'}`}>
                                                                    {item.qty} {item.item}
                                                                </span>
                                                            ))}
                                                            {n.stockDetails.length > 4 && <span className="text-[9px] text-gray-400">+{n.stockDetails.length - 4}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Selected Nucleo Detail */}
                                {selectedNucleo ? (
                                    <div
                                        className="animate-fade-in bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-grab active:cursor-grabbing"
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, selectedNucleo)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                            Núcleo Selecionado
                                            <span className={`${theme.badgeBg} ${theme.badgeText} text-[9px] px-1.5 py-0.5 rounded ml-auto`}>Arraste para Relatório</span>
                                        </h4>
                                        <p className="font-bold text-gray-800 text-sm leading-tight mb-1">{selectedNucleo.nome.split(' - ')[0]}</p>
                                        <p className="text-xs text-gray-500 mb-3">{selectedNucleo.nome.split(' - ')[1]}</p>

                                        <div className={`p-2 rounded-lg flex items-center justify-between mb-3 ${selectedNucleo.stockStatus === 'HIGH' ? 'bg-green-100 text-green-700' :
                                            selectedNucleo.stockStatus === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${selectedNucleo.stockStatus === 'HIGH' ? 'bg-green-600' :
                                                    selectedNucleo.stockStatus === 'MEDIUM' ? 'bg-yellow-600' : 'bg-red-600'
                                                    }`}></div>
                                                <span className="text-xs font-bold">Status: {
                                                    selectedNucleo.stockStatus === 'HIGH' ? 'Regular' :
                                                        selectedNucleo.stockStatus === 'MEDIUM' ? 'Atenção' : 'Crítico'
                                                }</span>
                                            </div>
                                        </div>

                                        {/* Detailed Missing Items */}
                                        {selectedNucleo.stockDetails && (
                                            <div className="bg-white rounded-lg p-2 border border-gray-100 shadow-sm">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Detalhes de Estoque</p>
                                                <div className="space-y-1.5">
                                                    {selectedNucleo.stockDetails.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-600">{item.item}</span>
                                                            <span className={`font-semibold px-1.5 rounded ${item.status === 'LOW' ? 'bg-red-50 text-red-600' : 'text-gray-500'}`}>
                                                                {item.qty} un
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-300">
                                        <p className="text-xs italic">Selecione um núcleo no mapa para ver detalhes</p>
                                    </div>
                                )}
                            </>
                        ) : activeTab === 'alunos' ? (
                            /* Alunos Tab Content */
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Alunos por Núcleo</h3>
                                    <span className={`text-xs ${theme.badgeBg} ${theme.badgeText} px-2 py-1 rounded-md font-bold`}>{students.length} Total</span>
                                </div>

                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className={`p-3 rounded-xl ${theme.bgLight} text-center`}>
                                        <span className={`block text-2xl font-black ${theme.text}`}>{students.length}</span>
                                        <span className={`text-[10px] font-bold ${theme.textLight} uppercase`}>Alunos Cadastrados</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-green-50 text-center">
                                        <span className="block text-2xl font-black text-green-600">
                                            {documents.filter(d => d.type === 'LISTA_FREQUENCIA').length}
                                        </span>
                                        <span className="text-[10px] font-bold text-green-400 uppercase">Listas Freq.</span>
                                    </div>
                                </div>

                                {/* Botão Cruzar Dados */}
                                <button
                                    onClick={() => setIsCrossRefModalOpen(true)}
                                    className={`w-full p-3 rounded-xl bg-gradient-to-r ${theme.gradient} text-white font-bold text-sm shadow-lg ${theme.shadow} ${theme.gradientHover} ${theme.shadowHover} transition-all flex items-center justify-center gap-2 mb-4`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    Cruzar Dados para Relatório
                                </button>

                                {/* Students List per Nucleo */}
                                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                                    {nucleos.map(nucleo => {
                                        const nucleoStudents = students.filter(s => s.nucleo_id === nucleo.id);
                                        if (nucleoStudents.length === 0) return null;
                                        return (
                                            <div
                                                key={nucleo.id}
                                                draggable
                                                onDragStart={(e) => handleStudentsDragStart(e, nucleo, nucleoStudents)}
                                                onClick={() => setSelectedNucleoId(nucleo.id)}
                                                className={`p-3 rounded-lg border cursor-grab transition-all group hover:shadow-md ${selectedNucleoId === nucleo.id ? `${theme.bgLight} border-${projectId === 'FUTEBOL' ? 'green' : projectId === 'DANIEL_DIAS' ? 'sky' : 'blue'}-300` : `bg-white border-gray-100 hover:bg-gray-50 ${theme.borderHover}`}`}
                                                title="Arraste para criar relatório de alunos"
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-gray-700 truncate max-w-[140px]">{nucleo.nome.split(' - ')[0]}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs ${theme.badgeBg} ${theme.badgeText} px-2 py-0.5 rounded-full font-bold`}>{nucleoStudents.length}</span>
                                                        {/* Drag Indicator */}
                                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-green-500" title="Arraste para PDF">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                                            </svg>
                                                        </span>
                                                    </div>
                                                </div>
                                                {selectedNucleoId === nucleo.id && nucleoStudents.length > 0 && (() => {
                                                    // Date-based deadline check for this nucleo
                                                    let isInDeadline = false;
                                                    let deadlineLevel: 'PARCIAL' | 'FINAL' | null = null;
                                                    if (nucleo.dataInicio) {
                                                        const hoje = new Date();
                                                        const inicio = new Date(nucleo.dataInicio);
                                                        const m5 = new Date(inicio); m5.setMonth(m5.getMonth() + 5);
                                                        const m11 = new Date(inicio); m11.setMonth(m11.getMonth() + 11);
                                                        if (hoje >= m11) { isInDeadline = true; deadlineLevel = 'FINAL'; }
                                                        else if (hoje >= m5) { isInDeadline = true; deadlineLevel = 'PARCIAL'; }
                                                    }

                                                    return (
                                                        <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                                                            {nucleoStudents.map((student, idx) => {
                                                                // Check missing docs
                                                                const missingDocs: string[] = [];
                                                                if (!student.fichaUrl) missingDocs.push('Ficha');
                                                                if (!student.questionario_quantitativo?.url) missingDocs.push('Questionário');
                                                                if (!student.pesquisa_socioeconomica?.url) missingDocs.push('Pesq. Socioeconômica');
                                                                if (!student.boletim_escolar?.url) missingDocs.push('Boletim');
                                                                if (!student.declaracao_uniformes) missingDocs.push('Uniformes');
                                                                if (!student.declaracao_prontidao) missingDocs.push('Prontidão');
                                                                const hasMissing = missingDocs.length > 0;
                                                                const isUrgent = hasMissing && isInDeadline;

                                                                return (
                                                                    <div key={student.id || idx} className={`flex justify-between items-center text-xs group/student p-1 rounded transition-colors ${isUrgent ? 'bg-red-50 hover:bg-red-100' : hasMissing ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-gray-50'}`}>
                                                                        <div className="flex items-center gap-1.5">
                                                                            {/* Status indicator */}
                                                                            {isUrgent ? (
                                                                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" title={`⚠ ${deadlineLevel} - Faltam: ${missingDocs.join(', ')}`}></span>
                                                                            ) : hasMissing ? (
                                                                                <span className="w-2 h-2 bg-amber-400 rounded-full shrink-0" title={`Faltam: ${missingDocs.join(', ')}`}></span>
                                                                            ) : (
                                                                                <span className="w-2 h-2 bg-green-400 rounded-full shrink-0" title="Documentos em dia"></span>
                                                                            )}
                                                                            <div>
                                                                                <span className={`truncate max-w-[130px] block ${isUrgent ? 'text-red-700 font-bold' : 'text-gray-600'}`}>{student.nome}</span>
                                                                                {hasMissing && (
                                                                                    <span className={`text-[8px] block ${isUrgent ? 'text-red-500' : 'text-amber-500'}`}>
                                                                                        {missingDocs.length} doc{missingDocs.length > 1 ? 's' : ''} pendente{missingDocs.length > 1 ? 's' : ''}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (window.confirm(`Deseja dar baixa no aluno ${student.nome}?`)) {
                                                                                    onDischargeStudent && onDischargeStudent(student.id || idx.toString(), nucleo.id);
                                                                                }
                                                                            }}
                                                                            className="text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover/student:opacity-100 transition-opacity"
                                                                            title="Dar Baixa"
                                                                        >
                                                                            Dar Baixa
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        );
                                    })}
                                    {students.length === 0 && (
                                        <div className="text-center py-6 text-gray-300">
                                            <p className="text-xs italic">Nenhum aluno cadastrado ainda</p>
                                            <p className="text-[10px] mt-1">Cadastre alunos em "Serviços → Ficha de Inscrição"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : activeTab === 'nucleos' ? (
                            /* Nucleos Tab Content */
                            <div className="space-y-4">
                                <div className={`flex justify-between items-center ${theme.bgLight} p-3 rounded-xl border ${theme.border}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`${theme.bgMedium} p-2 rounded-lg ${theme.text}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Gestão de Núcleos</h3>
                                            <span className={`text-xs ${theme.text} font-bold`}>{nucleos.length} Unidades Ativas</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsAddNucleoOpen(true)}
                                        className={`bg-gradient-to-r ${theme.gradient} ${theme.gradientHover} text-white p-2 rounded-lg shadow-lg ${theme.shadow} ${theme.shadowHover} transition-all`}
                                        title="Criar Novo Núcleo"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="max-h-[calc(100vh-300px)] overflow-y-auto space-y-3 pr-1">
                                    {nucleos.map(nucleo => (
                                        <div
                                            key={nucleo.id}
                                            onClick={() => { setSelectedNucleoId(nucleo.id); setIsNucleoDetailOpen(true); }}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all group hover:shadow-md ${selectedNucleoId === nucleo.id ? `${theme.bgLight} border-${projectId === 'FUTEBOL' ? 'green' : projectId === 'DANIEL_DIAS' ? 'sky' : 'blue'}-300` : `bg-white border-gray-100 ${theme.borderHover}`}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-gray-800 text-sm leading-tight">{nucleo.nome.split(' - ')[0]}</h4>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{nucleo.nome.split(' - ')[1] || 'Unidade'}</p>
                                                    {nucleo.sliNumber && (
                                                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                                                            SLI: {nucleo.sliNumber}
                                                        </span>
                                                    )}
                                                </div>
                                                <button className={`text-gray-300 ${theme.hoverText} transition-colors`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 border-t border-gray-100 pt-2">
                                                <div className="flex items-center gap-1.5">
                                                    <svg className={`w-3 h-3 ${theme.textLight}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                    <span className="font-semibold">{nucleo.employees?.length || 0}</span> Funcionários
                                                </div>
                                                {nucleo.dataInicio && (
                                                    <div className="flex items-center gap-1.5">
                                                        <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        <span className="font-semibold">{new Date(nucleo.dataInicio).toLocaleDateString('pt-BR')}</span>
                                                        {nucleo.dataTermino && (
                                                            <span className="text-gray-400">→ {new Date(nucleo.dataTermino).toLocaleDateString('pt-BR')}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Notification Badge */}
                                            {(() => {
                                                if (!nucleo.dataInicio) return null;
                                                const hoje = new Date();
                                                const inicio = new Date(nucleo.dataInicio);
                                                const m5 = new Date(inicio); m5.setMonth(m5.getMonth() + 5);
                                                const m6 = new Date(inicio); m6.setMonth(m6.getMonth() + 6);
                                                const m11 = new Date(inicio); m11.setMonth(m11.getMonth() + 11);
                                                const m12 = new Date(inicio); m12.setMonth(m12.getMonth() + 12);

                                                let level: 'FINAL' | 'PARCIAL' | null = null;
                                                let deadline = '';
                                                if (hoje >= m11) { level = 'FINAL'; deadline = m12.toLocaleDateString('pt-BR'); }
                                                else if (hoje >= m5) { level = 'PARCIAL'; deadline = m6.toLocaleDateString('pt-BR'); }

                                                if (!level) return null;
                                                const isFinal = level === 'FINAL';
                                                return (
                                                    <div className={`mt-2 rounded-lg px-3 py-2 flex items-center gap-2 text-xs font-bold ${isFinal ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                        <span className={`w-2 h-2 rounded-full ${isFinal ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`}></span>
                                                        {isFinal ? `FINAL — Enviar até ${deadline}` : `PARCIAL — Enviar até ${deadline}`}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : activeTab === 'acessos' ? (
                            <div className="space-y-4">
                                <div className={`flex justify-between items-center ${theme.bgLight} p-3 rounded-xl border ${theme.border}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`${theme.bgMedium} p-2 rounded-lg ${theme.text}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Gestão de Acessos</h3>
                                            <span className={`text-xs ${theme.text} font-bold`}>{pendingAccesses.length} Registros</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="max-h-[calc(100vh-300px)] overflow-y-auto space-y-3 pr-1">
                                    {pendingAccesses.length === 0 ? (
                                        <div className="text-center py-6 text-gray-300">
                                            <p className="text-xs italic">Não há cadastros no momento</p>
                                        </div>
                                    ) : (
                                        pendingAccesses.map((access: any) => {
                                            const nName = nucleos.find(n => n.id === access.nucleo_id)?.nome || 'Sem Núcleo';
                                            const isApproved = access.status === 'APROVADO';
                                            
                                            return (
                                                <div key={access.id} className={`p-4 rounded-xl border bg-white ${isApproved ? 'border-green-200' : 'border-yellow-200'} shadow-sm transition-all relative overflow-hidden`}>
                                                    <div className={`absolute top-0 left-0 w-1 h-full ${isApproved ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                                                    <div className="flex justify-between items-start mb-2 pl-2">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-gray-800 text-sm leading-tight">{access.profiles?.nome || 'Usuário'}</h4>
                                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                    {access.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-0.5">{access.profiles?.email}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                                                    Cargo: {access.role}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                                                                    {access.estado_responsavel ? `Região: ${access.estado_responsavel}` : nName.split(' - ')[0]}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-4 pl-2 border-t border-gray-50 pt-3">
                                                        {!isApproved ? (
                                                            <button 
                                                                onClick={() => handleApproveAccess(access.id)}
                                                                className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 font-bold py-2 rounded-lg text-xs transition border border-green-200 flex items-center justify-center gap-1"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                Aprovar Acesso
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => { if (window.confirm('Tem certeza que deseja revogar o acesso dessa pessoa?')) handleRevokeAccess(access.id); }}
                                                                className="flex-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800 font-bold py-2 rounded-lg text-xs transition border border-yellow-200 flex items-center justify-center gap-1"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-12a9 9 0 110 18 9 9 0 010-18z" /></svg>
                                                                Revogar Acesso
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => { if (window.confirm('Tem certeza que deseja APAGAR este cadastro do projeto? Isso não pode ser desfeito.')) handleRejectAccess(access.id); }}
                                                            className="px-3 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg text-xs transition border border-red-100 flex items-center justify-center"
                                                            title="Apagar Cadastro"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </aside>

                {/* Map Area */}
                <section className="flex-1 h-[500px] lg:h-auto min-h-[400px] bg-white rounded-3xl p-1 shadow-lg shadow-gray-200/50">
                    <AdminMap
                        nucleos={nucleos}
                        selectedNucleoId={selectedNucleoId}
                        onSelectNucleo={setSelectedNucleoId}
                        filterStatus={filterStatus}
                        activeTab={activeTab}
                        students={students}
                    />
                </section>

                {/* Right Sidebar - PDF Editor "Régua" RESTORED */}
                <aside
                    onDragEnter={handleSidebarDragEnter}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`w-16 bg-white border-l border-gray-100 flex flex-col items-center py-6 gap-6 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20 rounded-l-2xl lg:rounded-l-none lg:rounded-r-none relative transition-colors ${theme.hoverBg}`}
                >
                    <div className="text-gray-300 text-[10px] font-bold -rotate-90 whitespace-nowrap mt-4 mb-4 tracking-widest">
                        EDITOR PDF
                    </div>

                    {/* Drop Target Visual */}
                    <div className={`w-10 h-[300px] rounded-full border-2 border-dashed flex flex-col items-center justify-start py-2 gap-2 transition-all duration-300 border-gray-200`}>
                        <div className="p-1.5 bg-white shadow-sm rounded-full text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <div className="h-full flex items-center justify-center">
                            <span className="text-[9px] text-gray-300 font-bold -rotate-90 whitespace-nowrap">Arraste Aqui</span>
                        </div>
                    </div>

                    <button
                        onClick={onNavigateToServices} // Assuming this goes to dashboard? Better: maybe open PDF view?
                        className={`-rotate-90 text-[10px] font-bold ${theme.text} ${theme.hoverText} transition-colors mt-auto flex items-center gap-1`}
                    >
                        <span>ABRIR</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 rotate-90">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </aside>

            </main>

            {/* PAGE SELECTOR MODAL */}
            {isPageSelectorOpen && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">Selecionar Página de Destino</h3>
                                <p className="text-sm text-blue-600 font-medium">Adicionando: Relatório de {pendingNucleo?.nome}</p>
                            </div>
                            <button onClick={() => { setIsPageSelectorOpen(false); setPendingNucleo(null); setDraggedNucleo(null); }} className="text-gray-500 hover:text-red-500 p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {pages.map((page: any, index: number) => (
                                    <div
                                        key={page.id}
                                        onClick={() => handleSelectPage(page.id)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            handleSelectPage(page.id);
                                        }}
                                        className="aspect-[210/297] bg-white border-2 border-gray-300 hover:border-blue-500 hover:ring-4 hover:ring-blue-200 rounded-lg cursor-pointer transition-all relative group flex flex-col shadow-sm hover:shadow-xl transform hover:-translate-y-1"
                                    >
                                        <div className="bg-gray-50 border-b p-2 text-center flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-600 uppercase">Página {index + 1}</span>
                                            <span className="text-[10px] bg-gray-200 px-1.5 rounded text-gray-500">{page.items.length} itens</span>
                                        </div>
                                        <div className="flex-1 relative p-2 overflow-hidden bg-white">
                                            {page.items.map((it: any) => (
                                                <div key={it.id} className="absolute bg-gray-200 border border-gray-300 overflow-hidden opacity-60"
                                                    style={{
                                                        top: `${Math.min(100, (it.y / 297) * 10)}%`,
                                                        left: `${Math.min(100, (it.x / 210) * 10)}%`,
                                                        width: `${Math.min(100, (it.width / 210) * 10)}%`,
                                                        height: `${Math.max(2, (it.height || 30) / 10)}px`
                                                    }}>
                                                </div>
                                            ))}
                                            <div className={`absolute inset-0 bg-transparent ${theme.overlayBg} flex items-center justify-center transition-colors`}>
                                                <span className={`opacity-0 group-hover:opacity-100 ${theme.overlayBtn} text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg transform scale-90 group-hover:scale-100 transition-all`}>
                                                    Adicionar Aqui
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={handleAddPageAndSelect}
                                    className="aspect-[210/297] border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition-all gap-2 group bg-transparent"
                                >
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors shadow-sm">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    </div>
                                    <span className="font-bold text-sm">Nova Página</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Cruzamento de Dados */}
            <DataCrossReferenceModal
                isOpen={isCrossRefModalOpen}
                onClose={() => setIsCrossRefModalOpen(false)}
                students={students}
                documents={documents}
                nucleos={nucleos}
            />

            {/* Nucleo Detail Modal */}
            {selectedNucleo && (
                <NucleoDetailModal
                    isOpen={isNucleoDetailOpen}
                    onClose={() => setIsNucleoDetailOpen(false)}
                    nucleo={selectedNucleo}
                    onSave={(updated) => onAddNucleo(updated)}
                    projectId={projectId}
                />
            )}

            {/* Add Nucleo Modal */}
            <NucleoAddModal
                isOpen={isAddNucleoOpen}
                onClose={() => setIsAddNucleoOpen(false)}
                onSave={(newNucleo) => { onAddNucleo(newNucleo); setIsAddNucleoOpen(false); }}
                projectId={projectId}
            />
        </div>
    );
};
