
import React, { useState, useMemo } from 'react';
import { User, StudentDraft, EvidenceLog, DocumentLog } from '../types';
import leiDocImg from '../assets/lei_do_incentivo.png';
import { PenSquare, Save, X } from 'lucide-react';

interface ReportPreviewProps {
   user: User;
   students: StudentDraft[];
   evidences: EvidenceLog[];
   documents?: DocumentLog[];
   nucleos?: import('../types').Nucleo[];
   onUpdateStudent: (data: StudentDraft) => void;
   onBack: () => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({ user, students, evidences, documents = [], nucleos = [], onUpdateStudent, onBack }) => {
   const [activeTab, setActiveTab] = useState<'BENEFICIADOS' | 'ESCOLAS'>('BENEFICIADOS');

   // --- STATE DOS FILTROS ---
   const [filterName, setFilterName] = useState('');
   const [filterModality, setFilterModality] = useState('');
   const [filterSchoolType, setFilterSchoolType] = useState('');
   const [filterProponent, setFilterProponent] = useState('');
   const [filterDate, setFilterDate] = useState('');
   
   // --- FILTRO DE NÚCLEO ---
   const [selectedNucleoId, setSelectedNucleoId] = useState<string>(
      user.role === 'ADMIN' ? '' : (user.nucleo_id || '')
   );

   // --- STATE DE EDIÇÃO ---
   const [isEditingTable, setIsEditingTable] = useState(false);
   const [editData, setEditData] = useState<Record<string, Partial<StudentDraft>>>({});

   const handleToggleEdit = () => {
      if (isEditingTable) {
         setIsEditingTable(false);
         setEditData({});
      } else {
         setIsEditingTable(true);
         const initialData: Record<string, Partial<StudentDraft>> = {};
         sortedStudents.forEach(s => {
            if (s.id) {
               initialData[s.id] = { ...s };
            }
         });
         setEditData(initialData);
      }
   };

   const handleSaveAll = () => {
      Object.values(editData).forEach(data => {
         if (data && data.id) {
            onUpdateStudent(data as StudentDraft);
         }
      });
      setIsEditingTable(false);
      setEditData({});
   };

   const handlePrint = () => window.print();
   const currentDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

   // --- LÓGICA DE FILTRAGEM E ORDENAÇÃO ---
   const sortedStudents = useMemo(() => {
      return students
         .filter(student => {
            // 1. Filtro Nome
            const matchName = !filterName || student.nome.toLowerCase().includes(filterName.toLowerCase());

            // 2. Filtro Modalidade (Verifica se bate com 'Triathlon' ou Nome do Projeto)
            // Como a coluna é fixa 'Triathlon', verificamos se o usuário digitou algo que bata com isso ou com o projeto
            const modalityTerm = filterModality.toLowerCase();
            const matchModality = !filterModality ||
               'triathlon'.includes(modalityTerm) ||
               (student.nome_projeto || '').toLowerCase().includes(modalityTerm);

            // 3. Filtro Tipo de Escola
            const matchSchoolType = !filterSchoolType || student.escola_tipo === filterSchoolType;

            // 4. Filtro Proponente
            const matchProponent = !filterProponent || (student.proponente || '').toLowerCase().includes(filterProponent.toLowerCase());

            // 5. Filtro Data (Data Assinatura - Textual para permitir busca por ano/mês)
            const matchDate = !filterDate || (student.data_assinatura || '').includes(filterDate);

            // 6. Filtro de Núcleo (Importante para Admin)
            const matchNucleo = !selectedNucleoId || student.nucleo_id === selectedNucleoId;

            return matchName && matchModality && matchSchoolType && matchProponent && matchDate && matchNucleo;
         })
         .sort((a, b) => a.nome.localeCompare(b.nome));
   }, [students, filterName, filterModality, filterSchoolType, filterProponent, filterDate, selectedNucleoId]);

   // Pegar dados do projeto do primeiro aluno filtrado (ou do original se vazio) para preencher o cabeçalho
   const referenceStudent = sortedStudents.length > 0 ? sortedStudents[0] : students[0];
   const sli = referenceStudent?.n_sli || "2201254";
   const projectName = referenceStudent?.nome_projeto || "Escolinha de Triathlon";
   
   // O proponente deve ser o nome do núcleo escolhido
   const selectedNucleoObj = nucleos.find(n => n.id === selectedNucleoId);
   const proponente = selectedNucleoObj ? selectedNucleoObj.nome : (referenceStudent?.proponente || "Associação de Pais e Amigos da Natação Ituana");
   const responsavel = referenceStudent?.nome_responsavel_organizacao || user.nome || "________________________";

   // Determinar se o relatório atual é Parcial ou Final baseado nos documentos (Boletins)
   const relationPeriod = useMemo(() => {
      if (sortedStudents.length === 0 || documents.length === 0) return 'PARCIAL';

      let totalFinal = 0;
      let totalStudentsWithBoletim = 0;

      sortedStudents.forEach(student => {
         const studentBoletins = documents.filter(d =>
            d.type === 'BOLETIM' && d.metaData?.studentName === student.nome
         );
         if (studentBoletins.length > 0) {
            totalStudentsWithBoletim++;
            // Verifica se o boletim mais recente é FINAL
            const lastBoletimDoc = studentBoletins.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
            if (lastBoletimDoc?.metaData?.periodType === 'FINAL') {
               totalFinal++;
            }
         }
      });

      // Se mais de 50% dos alunos que possuem boletim entregaram o FINAL, consideramos a relação como FINAL
      if (totalStudentsWithBoletim > 0 && (totalFinal / totalStudentsWithBoletim) > 0.5) {
         return 'FINAL';
      }

      return 'PARCIAL';
   }, [sortedStudents, documents]);

   const getAge = (dob: string) => {
      if (!dob) return '-';
      
      let birth: Date;
      if (dob.includes('-')) {
         // Formato YYYY-MM-DD
         const parts = dob.split('-');
         if (parts.length !== 3) return '-';
         birth = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
         // Formato DD/MM/YYYY
         const parts = dob.split('/');
         if (parts.length !== 3) return '-';
         birth = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }

      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
         age--;
      }
      return age;
   };

   const formatSchoolType = (type: string) => {
      if (type === 'PUBLICA') return 'Pública';
      if (type === 'PARTICULAR') return 'Particular';
      return '-';
   };

   const clearFilters = () => {
      setFilterName('');
      setFilterModality('');
      setFilterSchoolType('');
      setFilterProponent('');
      setFilterDate('');
   };

   const handleDragStart = (e: React.DragEvent) => {
      const type = activeTab === 'BENEFICIADOS' ? 'TABLE_REPORT_7' : 'TABLE_REPORT_8';
      const title = activeTab === 'BENEFICIADOS' ? 'Relatório 7 - Beneficiados' : 'Relatório 8 - Escolas';

      const payload = {
         type: type,
         data: {
            rows: sortedStudents, // Usa a lista filtrada
            sli,
            projectName,
            proponente,
            responsavel,
            generationDate: `Itu - SP, ${currentDate}`
         },
         title: title
      };

      e.dataTransfer.setData('application/json', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'copy';
   };

   return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 print:p-0 print:bg-white relative font-sans">

         {/* NAVBAR FLUTUANTE (Não sai na impressão) */}
         <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex justify-between items-center z-50 shadow-sm no-print">
            <div className="flex items-center gap-4">
               <button onClick={onBack} className="text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-2 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Voltar
               </button>
               <span className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></span>
               <div className="hidden md:flex bg-gray-100 p-1 rounded-lg">
                  <button
                     onClick={() => setActiveTab('BENEFICIADOS')}
                     className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'BENEFICIADOS' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                     7. Beneficiados
                  </button>
                  <button
                     onClick={() => setActiveTab('ESCOLAS')}
                     className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'ESCOLAS' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                     8. Escolas
                  </button>
               </div>
            </div>
            <div className="flex items-center gap-3">
               {isEditingTable ? (
                     <>
                        <button onClick={handleSaveAll} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                           <Save size={18} /> Salvar Alterações
                        </button>
                        <button onClick={handleToggleEdit} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                           <X size={18} /> Cancelar
                        </button>
                     </>
                  ) : (
                     <button onClick={handleToggleEdit} className="bg-blue-100/50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-full font-bold shadow-sm transition-all flex items-center gap-2 print:hidden text-sm uppercase tracking-wide">
                        <PenSquare size={16} /> Editar Relatório
                     </button>
                  )}
                  <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                     Imprimir
                  </button>
               </div>
            </div>

         {/* PAINEL DE FILTROS (Não sai na impressão) */}
         <div className="max-w-7xl mx-auto mt-20 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200 print:hidden animate-fade-in">
            <div className="flex items-center justify-between mb-3">
               <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  Filtrar Dados da Tabela
               </h3>
               <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline">Limpar Filtros</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
               <input
                  type="text"
                  placeholder="Nome do Aluno..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
               />
               <input
                  type="text"
                  placeholder="Modalidade..."
                  value={filterModality}
                  onChange={(e) => setFilterModality(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
               />
               <select
                  value={filterSchoolType}
                  onChange={(e) => setFilterSchoolType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-gray-700"
               >
                  <option value="">Tipo de Escola (Todas)</option>
                  <option value="PUBLICA">Pública</option>
                  <option value="PARTICULAR">Particular</option>
               </select>
               <input
                  type="text"
                  placeholder="Proponente..."
                  value={filterProponent}
                  onChange={(e) => setFilterProponent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
               />
               <input
                  type="text"
                  placeholder="Data (ex: 2024)..."
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
               />
               {user.role === 'ADMIN' && nucleos.length > 0 && (
                  <select
                     value={selectedNucleoId}
                     onChange={(e) => setSelectedNucleoId(e.target.value)}
                     className="w-full bg-blue-50/50 border border-blue-200 text-blue-900 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none font-semibold"
                  >
                     <option value="">Todos os Núcleos</option>
                     {nucleos.map(n => (
                        <option key={n.id} value={n.id}>{n.nome}</option>
                     ))}
                  </select>
               )}
            </div>
            <div className="mt-2 text-[10px] text-gray-400 text-right">Mostrando {sortedStudents.length} registros</div>
         </div>

         {/* ÁREA DO DOCUMENTO */}
         <div
            className="bg-white max-w-7xl mx-auto min-h-[297mm] p-8 md:p-12 shadow-xl rounded-2xl print:shadow-none print:mt-0 print:mb-0 print:w-full print:max-w-none print:p-8 print:rounded-none cursor-move hover:ring-2 hover:ring-blue-400 transition-all"
            draggable
            onDragStart={handleDragStart}
         >

            <div className="bg-blue-50 border-b border-blue-200 p-2 text-center text-xs text-blue-600 font-bold print:hidden mb-4 rounded">
               &#10021; Arraste esta tabela para o menu lateral para compor o Relatório Final
            </div>

            {/* CABEÇALHO PADRÃO */}
            <div className="flex flex-col mb-8 border-b-2 border-gray-800 pb-4">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                     <h1 className="text-2xl font-bold text-gray-900 tracking-tight uppercase">
                        {activeTab === 'BENEFICIADOS' ? '7. Relação de Diretamente Beneficiados' : '8. Relação de Alunos com Indicação de Escola'}
                     </h1>
                  </div>
                  <img src={leiDocImg} alt="Lei de Incentivo ao Esporte" className="h-24 object-contain ml-4" />
               </div>

               {/* DADOS DO PROJETO NO CABEÇALHO */}
               <div className="grid grid-cols-2 gap-4 text-sm font-sans text-gray-700">
                  <div>
                     <span className="font-bold text-gray-900">N.º SLI:</span> {sli}
                  </div>
                  <div>
                     <span className="font-bold text-gray-900">Nome do Projeto:</span> {projectName}
                  </div>
                  <div>
                     <span className="font-bold text-gray-900">Proponente:</span> {proponente}
                  </div>
                  <div>
                     <span className="font-bold text-gray-900">Responsável (Associação/Federação):</span> {responsavel}
                  </div>
                  <div>
                     <span className="font-bold text-gray-900">Período da Relação:</span> <span className={`font-black uppercase px-2 py-0.5 rounded text-xs ml-1 ${relationPeriod === 'FINAL' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{relationPeriod}</span>
                  </div>
               </div>
            </div>

            {/* CONTEÚDO DINÂMICO DA TABELA (ESTILO MODERNO) */}
            <div className="overflow-hidden rounded-lg border border-gray-200 print:border-none print:rounded-none">
               {activeTab === 'BENEFICIADOS' ? (
                  /* TABELA 7: BENEFICIADOS */
                  <table className="w-full text-left border-collapse">
                     <thead className="bg-blue-600 text-white font-bold uppercase text-[10px] print:bg-gray-200 print:text-black">
                        <tr>
                           <th className="p-2 border-r border-blue-500 print:border-gray-300 w-10 text-center">Nº</th>
                           <th className="p-2 border-r border-blue-500 print:border-gray-300 w-28 text-center">Modalidade</th>
                           <th className="p-2 border-r border-blue-500 print:border-gray-300">Nome (ordem alfabética)</th>
                           <th className="p-2 border-r border-blue-500 print:border-gray-300 w-1/4">Endereço completo</th>
                           <th className="p-2 border-r border-blue-500 print:border-gray-300 w-28 text-center">Telefone</th>
                           <th className="p-2 border-r border-blue-500 print:border-gray-300 w-16 text-center">Idade</th>
                           <th className="p-2 border-r border-blue-500 print:border-gray-300 w-48">Benefícios</th>
                           <th className="p-2 text-center w-32">Observações</th>
                        </tr>
                     </thead>
                     <tbody className="text-xs">
                        {sortedStudents.map((student, idx) => {
                           // Renderizar os benefícios
                           const beneficios = [];
                           if (student.declaracao_uniformes && student.declaracao_uniformes.itens_recebidos.length > 0) {
                              beneficios.push(`Uniformes (${student.declaracao_uniformes.itens_recebidos.length} itens)`);
                           }
                           
                           // Como a exigência é "Benefícios", vamos listar os bens se disponíveis ou um texto genérico
                           const beneficiosTexto = "* todos os alunos se beneficiam de uniformes individuais, material esportivo de uso compartilhado e kit lanche pós todas as aulas, além de terem a equipe técnica ministrando as atividades..";

                           return (
                              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors print:border-gray-300 print:hover:bg-transparent">
                                 <td className="p-2 border-r border-gray-200 print:border-gray-300 text-center font-bold text-gray-500">{idx + 1}</td>
                                 <td className="p-2 border-r border-gray-200 print:border-gray-300 text-center font-bold text-gray-800 bg-gray-50/50">Triathlon</td>
                                 <td className="p-2 border-r border-gray-200 print:border-gray-300 font-bold text-blue-600 print:text-black">
                                    {isEditingTable ? (
                                       <input type="text" value={editData[student.id || '']?.nome ?? student.nome} onChange={e => setEditData({...editData, [student.id || '']: {...(editData[student.id || ''] || student), nome: e.target.value}})} className="w-full border rounded px-1 py-1 text-xs font-normal text-black" />
                                    ) : student.nome}
                                 </td>
                                 <td className="p-2 border-r border-gray-200 print:border-gray-300 text-[10px] text-gray-600 leading-tight">
                                    {isEditingTable ? (
                                       <input type="text" value={editData[student.id || '']?.endereco ?? student.endereco ?? ""} onChange={e => setEditData({...editData, [student.id || '']: {...(editData[student.id || ''] || student), endereco: e.target.value}})} className="w-full border rounded px-1 py-1 text-xs font-normal text-black" />
                                    ) : (student.endereco || "-")}
                                 </td>
                                 <td className="p-2 border-r border-gray-200 print:border-gray-300 text-center font-medium text-gray-700">
                                    {isEditingTable ? (
                                       <input type="text" value={editData[student.id || '']?.telefone ?? student.telefone ?? ""} onChange={e => setEditData({...editData, [student.id || '']: {...(editData[student.id || ''] || student), telefone: e.target.value}})} className="w-full border rounded px-1 py-1 text-xs font-normal text-black text-center" />
                                    ) : (student.telefone || "-")}
                                 </td>
                                 <td className="p-2 border-r border-gray-200 print:border-gray-300 text-center font-bold text-gray-700">
                                    {isEditingTable ? (
                                       <input type="date" value={editData[student.id || '']?.data_nascimento ?? student.data_nascimento ?? ""} onChange={e => setEditData({...editData, [student.id || '']: {...(editData[student.id || ''] || student), data_nascimento: e.target.value}})} className="w-full border rounded px-1 py-1 text-[10px] font-normal text-black text-center" />
                                    ) : getAge(student.data_nascimento)}
                                 </td>
                                 <td className="p-2 border-r border-gray-200 print:border-gray-300 text-[9px] text-gray-600 font-medium whitespace-pre-wrap leading-tight">
                                    {beneficiosTexto}
                                 </td>
                                 <td className="p-2 text-center text-[10px] text-gray-500 italic border-r border-gray-200 print:border-gray-300">
                                    {student.status === 'INATIVO' ? 'Inativo' : ''}
                                 </td>
                              </tr>
                           )
                        })}
                        {sortedStudents.length === 0 && (
                           <tr><td colSpan={8} className="py-8 text-center text-gray-400 italic bg-gray-50">
                              {students.length === 0 ? "Nenhum aluno cadastrado." : "Nenhum aluno corresponde aos filtros."}
                           </td></tr>
                        )}
                     </tbody>
                  </table>
               ) : (
                  /* TABELA 8: ESCOLAS */
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-blue-600 text-white font-bold uppercase text-[10px] tracking-wider print:bg-gray-200 print:text-black">
                           <th className="py-3 px-4 border-r border-blue-500 print:border-gray-300 w-12 text-center">Nº</th>
                           <th className="py-3 px-4 border-r border-blue-500 print:border-gray-300 w-32 text-center">Modalidade</th>
                           <th className="py-3 px-4 border-r border-blue-500 print:border-gray-300">Nome (ordem alfabética)</th>
                           <th className="py-3 px-4 border-r border-blue-500 print:border-gray-300 w-48 text-center">Tipo Escola</th>
                           <th className="py-3 px-4">Nome da Escola</th>
                        </tr>
                     </thead>
                     <tbody className="text-sm text-gray-700">
                        {sortedStudents.map((student, idx) => (
                           <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors print:border-gray-300 print:hover:bg-transparent">
                              <td className="py-3 px-4 border-r border-gray-200 print:border-gray-300 text-center font-medium text-gray-500">{idx + 1}</td>
                              <td className="py-3 px-4 border-r border-gray-200 print:border-gray-300 text-center text-gray-800 font-bold bg-gray-50/50">Triathlon</td>
                              <td className="py-3 px-4 border-r border-gray-200 print:border-gray-300 font-bold text-blue-600 print:text-black">
                                 {isEditingTable ? (
                                    <input type="text" value={editData[student.id || '']?.nome ?? student.nome} onChange={e => setEditData({...editData, [student.id || '']: {...(editData[student.id || ''] || student), nome: e.target.value}})} className="w-full border rounded px-2 py-1 text-xs font-normal text-black" />
                                 ) : student.nome}
                              </td>
                              <td className="py-3 px-4 border-r border-gray-200 print:border-gray-300 text-center">
                                 {isEditingTable ? (
                                    <select value={editData[student.id || '']?.escola_tipo ?? student.escola_tipo ?? ''} onChange={e => setEditData({...editData, [student.id || '']: {...(editData[student.id || ''] || student), escola_tipo: e.target.value as 'PUBLICA' | 'PARTICULAR'}})} className="w-full border rounded px-1 py-1 text-xs font-normal text-black">
                                       <option value="">Selecione</option>
                                       <option value="PUBLICA">Pública</option>
                                       <option value="PARTICULAR">Particular</option>
                                    </select>
                                 ) : (
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${student.escola_tipo === 'PUBLICA' ? 'bg-green-100 text-green-800' : student.escola_tipo === 'PARTICULAR' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'} print:bg-transparent print:text-black print:p-0`}>
                                       {formatSchoolType(student.escola_tipo)}
                                    </span>
                                 )}
                              </td>
                              <td className="py-3 px-4 font-medium border-r border-gray-200 print:border-gray-300">
                                 {isEditingTable ? (
                                    <input type="text" value={editData[student.id || '']?.escola_nome ?? student.escola_nome ?? ''} onChange={e => setEditData({...editData, [student.id || '']: {...(editData[student.id || ''] || student), escola_nome: e.target.value}})} className="w-full border rounded px-2 py-1 text-xs font-normal text-black" />
                                 ) : (student.escola_nome || "-")}
                              </td>
                           </tr>
                        ))}
                        {sortedStudents.length === 0 && (
                           <tr><td colSpan={5} className="py-8 text-center text-gray-400 italic bg-gray-50">
                              {students.length === 0 ? "Nenhum aluno cadastrado." : "Nenhum aluno corresponde aos filtros."}
                           </td></tr>
                        )}
                     </tbody>
                  </table>
               )}
            </div>

            {/* ASSINATURAS E DATA */}
            <div className="flex justify-between items-end mt-16 page-break-inside-avoid font-sans text-gray-800">
               <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">Itu - SP, {currentDate}</p>
               </div>
               <div className="text-center">
                  <div className="border-b border-black mb-2 h-8 w-80"></div>
                  <p className="text-xs font-bold uppercase text-gray-600">Assinatura do Responsável (Associação/Federação)</p>
               </div>
            </div>
         </div>

         <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { size: A4 landscape; margin: 10mm; }
          .page-break-inside-avoid { page-break-inside: avoid; }
          
          /* Ajustes específicos de tabela para impressão */
          th { background-color: #e5e7eb !important; color: black !important; border-color: #d1d5db !important; }
          td { border-color: #d1d5db !important; }
          tr { border-bottom-color: #d1d5db !important; }
        }
      `}</style>

      </div>
   );
};
