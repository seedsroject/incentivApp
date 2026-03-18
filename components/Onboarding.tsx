import React, { useState } from 'react';
import { Nucleo, User } from '../types';

interface OnboardingProps {
  user: User;
  nucleos: Nucleo[];
  onComplete: (nucleoId: string) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ user, nucleos, onComplete }) => {
  const [selected, setSelected] = useState('');

  return (
    <div className="min-h-screen bg-gov-blue flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Bem-vindo, {user.nome}!</h2>
          <p className="text-gray-500 mt-2">Para continuar, identifique o Núcleo Esportivo onde você atua.</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o Núcleo</label>
          <select 
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Selecione --</option>
            {nucleos.map(n => (
              <option key={n.id} value={n.id}>{n.nome}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => selected && onComplete(selected)}
          disabled={!selected}
          className="w-full py-3 px-4 bg-gov-blue text-white font-bold rounded shadow hover:bg-blue-800 disabled:bg-gray-300 transition-colors"
        >
          Confirmar e Acessar
        </button>
      </div>
    </div>
  );
};