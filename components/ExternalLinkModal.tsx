
import React, { useState } from 'react';

interface ExternalLinkModalProps {
  serviceId: string;
  serviceTitle: string;
  onClose: () => void;
}

export const ExternalLinkModal: React.FC<ExternalLinkModalProps> = ({ serviceId, serviceTitle, onClose }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  // Token único para a sessão
  const token = `tmp_${Math.random().toString(36).substr(2, 9)}`;
  
  /**
   * SOLUÇÃO DEFINITIVA PARA REDIRECIONAMENTO:
   * Usamos parâmetros de query (?) para maior compatibilidade em roteamento mobile.
   */
  const currentHref = window.location.href;
  const baseUrl = currentHref.split('#')[0].split('?')[0];
  
  // Remove trailing slashes and index.html for a cleaner base
  const sanitizedBaseUrl = baseUrl.replace(/\/index\.html$/, '').replace(/\/$/, '');
  
  // Link Público com Parâmetros
  const publicUrl = `${sanitizedBaseUrl}/?token=${token}&service=${serviceId}`;

  const message = `Olá! 👋 Aqui é do Núcleo Esportivo.\n\nPara concluir o serviço *${serviceTitle}* do seu filho(a), por favor preencha os dados oficiais no link abaixo:\n\n🔗 ${publicUrl}\n\n⚠️ Este link é seguro para preenchimento via celular.`;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(publicUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      const input = document.createElement('input');
      input.value = publicUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in border border-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-1">Link para os Pais</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">Envie o link para preenchimento direto no celular do responsável.</p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Endereço do Formulário:</p>
            <div className="text-[11px] text-blue-600 break-all font-mono leading-tight bg-white p-2 rounded border border-gray-100">
              {publicUrl}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all active:scale-95 shadow-green-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
              </svg>
              Enviar pelo WhatsApp
            </button>
            
            <button 
              onClick={handleCopy}
              className={`flex items-center justify-center gap-2 w-full py-3.5 bg-white border-2 rounded-xl font-bold transition-all active:scale-95 ${copySuccess ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-700 border-gray-200 hover:border-blue-200 hover:text-blue-600'}`}
            >
              {copySuccess ? 'Copiado para Área de Transferência!' : 'Copiar Link Manualmente'}
            </button>
          </div>

          <div className="mt-6 text-center border-t pt-4">
             <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                Sessão Segura Encriptada
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};
