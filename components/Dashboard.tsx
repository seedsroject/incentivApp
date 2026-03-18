
import React, { useState } from 'react';
import { AppView } from '../types';
import { ExternalLinkModal } from './ExternalLinkModal';

interface DashboardProps {
  onNavigate: (view: AppView, params?: any) => void;
  itemsCount: number;
  onBack?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, itemsCount, onBack }) => {
  const [sharingService, setSharingService] = useState<{ id: string, title: string } | null>(null);

  const menuItems = [
    {
      id: 'precadastro',
      title: '0. Pré-cadastro e Fila',
      subtitle: 'Serviço Social',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
      action: () => onNavigate(AppView.FEATURE_PRE_CADASTRO),
      canShare: true
    },
    {
      id: 'ficha',
      title: '1. Ficha de Inscrição',
      subtitle: '+ Dados Cadastrais',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" /></svg>,
      action: () => onNavigate(AppView.FEATURE_OCR),
      canShare: true
    },
    {
      id: 'declaracao',
      title: '2. Declaração de Matrícula',
      subtitle: 'Upload de Comprovante',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
      action: () => onNavigate(AppView.FEATURE_DOC_UPLOAD, { type: 'DECLARACAO_MATRICULA', title: '2. Declaração de Matrícula' }),
      canShare: false
    },
    {
      id: 'boletim',
      title: '3. Boletins Escolares',
      subtitle: 'Início e Final do Ciclo',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>,
      action: () => onNavigate(AppView.FEATURE_DOC_UPLOAD, { type: 'BOLETIM', title: '3. Boletins Escolares' }),
      canShare: true
    },
    {
      id: 'assiduidade',
      title: '4. Relatório Assiduidade',
      subtitle: 'Upload de Planilha',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" /></svg>,
      action: () => onNavigate(AppView.FEATURE_DOC_UPLOAD, { type: 'RELATORIO_ASSIDUIDADE', title: '4. Relatório Assiduidade e Aproveitamento' }),
      canShare: false
    },
    {
      id: 'frequencia',
      title: '5. Listas de Frequência',
      subtitle: 'Digitalização ou Chamada',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
      action: () => onNavigate(AppView.FEATURE_DOC_UPLOAD, { type: 'LISTA_FREQUENCIA', title: '5. Listas de Frequência' }),
      canShare: false
    },
    {
      id: 'meta',
      title: '6. Pesquisa Meta Continua',
      subtitle: 'Questionário Qualitativo',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
      action: () => onNavigate(AppView.FEATURE_META_QUALITATIVA),
      canShare: true
    },
    {
      id: 'socio',
      title: 'Indicadores de Saúde',
      subtitle: 'Pesquisa Socioeconômica',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /><path d="M12 3v18" /></svg>,
      action: () => onNavigate(AppView.FEATURE_SOCIOECONOMIC),
      canShare: true
    },
    {
      id: 'estoque',
      title: 'Controle de Estoque',
      subtitle: 'Bens de Consumo (Lanches)',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
      action: () => onNavigate(AppView.FEATURE_INVENTORY),
      canShare: false
    },
    {
      id: 'rel_7',
      title: '7. Rel. Beneficiados',
      subtitle: 'Planilha Gerada (PDF)',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="M8 15h8" /></svg>,
      action: () => onNavigate(AppView.REPORT),
      canShare: false
    },
    {
      id: 'rel_8',
      title: '8. Rel. Escolas',
      subtitle: 'Planilha Gerada (PDF)',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14 2z" /><polyline points="14 2 14 8 20 8" /><path d="M10 13l4 4" /><path d="M14 13l-4 4" /></svg>,
      action: () => onNavigate(AppView.REPORT),
      canShare: false
    },
    {
      id: 'evidencias',
      title: 'Evidências',
      subtitle: 'Fotos: Acessibilidade, Divulgação e Materiais',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
      action: () => onNavigate(AppView.FEATURE_EVIDENCE),
      canShare: false
    },
    {
      id: 'servico_social',
      title: 'Acompanhamento',
      subtitle: 'Serviço Social',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
      action: () => onNavigate(AppView.FEATURE_SERVICO_SOCIAL),
      canShare: false
    },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Serviços do Projeto</h2>
            <p className="text-gray-600 text-sm">Lista completa de documentação exigida</p>
          </div>
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar ao Mapa
              </button>
            )}
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-[10px] font-bold border border-yellow-200 animate-pulse hidden md:block">
              Links Externos Disponíveis
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-24">
          {menuItems.map((item, index) => (
            <div key={index} className="relative group">
              <button
                onClick={item.action}
                className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 hover:bg-blue-50 transition-all active:scale-95 group w-full min-h-[110px]"
              >
                <div className="mb-2 bg-gray-50 p-2 rounded-full group-hover:bg-white transition-colors">
                  {item.icon}
                </div>
                <span className="font-bold text-gray-800 text-center leading-tight mb-1 text-xs sm:text-sm line-clamp-2">
                  {item.title}
                </span>
                <span className="text-[10px] text-gray-500 font-medium text-center line-clamp-1">
                  {item.subtitle}
                </span>
              </button>

              {/* Botão de Compartilhar Link */}
              {item.canShare && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSharingService({ id: item.id, title: item.title }); }}
                  className="absolute top-1 right-1 bg-green-600 text-white p-1.5 rounded-md shadow-sm hover:bg-green-700 transition-colors z-10"
                  title="Enviar Link para os Pais"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm">
            <span className="block font-bold text-gray-800">{itemsCount} Itens</span>
            <span className="text-gray-500 text-xs">Total coletado</span>
          </div>
          <button
            onClick={() => onNavigate(AppView.DEV_ENVIRONMENT)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg font-bold shadow transition-colors text-sm bg-blue-600 text-white hover:bg-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01 2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Ambiente de Desenvolvimento
          </button>
        </div>
      </div>

      {/* MODAL DE COMPARTILHAMENTO */}
      {sharingService && (
        <ExternalLinkModal
          serviceId={sharingService.id}
          serviceTitle={sharingService.title}
          onClose={() => setSharingService(null)}
        />
      )}
    </div>
  );
};
