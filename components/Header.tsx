import React from 'react';
import { User } from '../types';
import { Logo } from './Logo';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-md border-b-4 border-blue-600 print:hidden">
      <div className="max-w-4xl mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Logo Nova Substituída */}
          <div className="flex-shrink-0">
            <Logo className="max-w-[70px] max-h-[73px] w-auto h-auto object-contain" />
          </div>
          <div>
            <h1 className="text-gray-800 font-bold text-lg leading-tight">
              Gestão Esporte
            </h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide truncate max-w-[180px] sm:max-w-xs">
              {user.nucleo_nome || 'Núcleo não selecionado'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-800">Olá, {user.nome.split(' ')[0]}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
            title="Sair"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};