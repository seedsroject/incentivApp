
import React, { useState } from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  const [imgError, setImgError] = useState(false);

  // Se a imagem falhar, mostramos este fallback profissional
  if (imgError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4 ${className}`} style={{ minHeight: '160px', minWidth: '160px' }}>
         <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-blue-600 mb-2 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
         </svg>
         <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider text-center">
           Logomarca<br/>Núcleo
         </span>
      </div>
    );
  }

  return (
    <img 
      src="/logo.png" 
      alt="Escolinha de Triathlon - Formando Campeões" 
      className={`block mx-auto object-contain ${className}`}
      onError={() => {
        console.warn("Logo não encontrada em /public/logo.png. Exibindo fallback.");
        setImgError(true);
      }}
    />
  );
};
