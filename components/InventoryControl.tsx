
import React, { useState } from 'react';
import { InventoryItem, DocumentLog } from '../types';

interface InventoryControlProps {
  onBack: () => void;
  inventory: InventoryItem[];
  history: DocumentLog[];
  onUpdateInventory: (updatedItem: InventoryItem) => void;
  onAddItem: (item: InventoryItem) => void;
}

export const InventoryControl: React.FC<InventoryControlProps> = ({ onBack, inventory, history, onUpdateInventory, onAddItem }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  
  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('Kit');
  const [newItemCategory, setNewItemCategory] = useState<'ALIMENTACAO' | 'VESTUARIO' | 'EQUIPAMENTO' | 'OUTROS'>('ALIMENTACAO');
  const [newItemInitialQty, setNewItemInitialQty] = useState('');

  const handleAddNew = () => {
    if (!newItemName || !newItemInitialQty) return alert("Preencha o nome e a quantidade inicial.");
    
    const qty = parseInt(newItemInitialQty);

    const newItem: InventoryItem = {
        id: `item_${Date.now()}`,
        name: newItemName,
        quantity: qty,
        initialQuantity: qty, // Define a base para o cálculo de 10%
        unit: newItemUnit,
        minThreshold: Math.ceil(qty * 0.1), // Sugere 10% como mínimo padrão
        category: newItemCategory
    };
    
    onAddItem(newItem);
    setNewItemName('');
    setNewItemInitialQty('');
    setShowAddModal(false);
  };

  const handleAdjustStock = () => {
      if (!selectedItem || !adjustAmount) return;
      const amount = parseInt(adjustAmount);
      
      const updatedItem = {
          ...selectedItem,
          quantity: selectedItem.quantity + amount
      };
      
      // Se for entrada positiva, podemos optar por atualizar o initialQuantity se for um "reabastecimento total"
      // Por simplicidade, mantemos o initialQuantity original a menos que o novo estoque supere ele significativamente
      if (updatedItem.quantity > updatedItem.initialQuantity) {
          updatedItem.initialQuantity = updatedItem.quantity;
      }

      if (updatedItem.quantity < 0) updatedItem.quantity = 0;
      
      onUpdateInventory(updatedItem);
      setSelectedItem(null);
      setAdjustAmount('');
  };

  // --- LÓGICA DE PREVISÃO ---
  const calculateEstimate = (item: InventoryItem) => {
      // 1. Filtrar histórico de consumo deste item
      const usageLogs = history.filter(doc => 
          doc.type === 'LISTA_FREQUENCIA' && 
          doc.metaData?.inventoryDeduction?.itemId === item.id
      ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (usageLogs.length < 1) return { daysLeft: null, avgPerDay: 0 };

      // 2. Calcular consumo total e intervalo de dias
      let totalConsumed = 0;
      usageLogs.forEach(log => {
          totalConsumed += (log.metaData?.inventoryDeduction?.amount || 0);
      });

      const firstDate = new Date(usageLogs[0].timestamp);
      const lastDate = new Date(); // Até hoje
      const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Pelo menos 1 dia para evitar divisão por zero

      // 3. Média por dia
      const avgPerDay = totalConsumed / diffDays;

      if (avgPerDay <= 0) return { daysLeft: null, avgPerDay: 0 };

      // 4. Dias restantes
      const daysLeft = Math.ceil(item.quantity / avgPerDay);

      return { daysLeft, avgPerDay };
  };

  const categories = {
      'ALIMENTACAO': { label: 'Alimentação (Lanches)', color: 'bg-orange-100 text-orange-800' },
      'VESTUARIO': { label: 'Vestuário', color: 'bg-purple-100 text-purple-800' },
      'EQUIPAMENTO': { label: 'Equipamentos', color: 'bg-blue-100 text-blue-800' },
      'OUTROS': { label: 'Outros', color: 'bg-gray-100 text-gray-800' }
  };

  const inputStyle = "w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors shadow-sm";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
        {/* HEADER */}
        <div className="bg-white p-4 shadow-sm flex items-center gap-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h1 className="font-bold text-lg text-gray-800">Controle de Estoque</h1>
            </div>
            <button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Novo Item
            </button>
        </div>

        {/* LISTA DE ITENS */}
        <div className="p-4 md:p-8 flex-1 overflow-auto max-w-5xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map(item => {
                    const { daysLeft } = calculateEstimate(item);
                    const isLowStock = item.quantity <= (item.initialQuantity * 0.10); // Lógica de 10%
                    
                    return (
                        <div key={item.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition-all ${isLowStock ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'}`}>
                            <div className="p-4 flex justify-between items-start">
                                <div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${categories[item.category].color}`}>
                                        {categories[item.category].label}
                                    </span>
                                    <h3 className="font-bold text-gray-800 text-lg mt-2 leading-tight">{item.name}</h3>
                                    <p className="text-xs text-gray-500">Unidade: {item.unit}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`block text-3xl font-black ${isLowStock ? 'text-red-600' : 'text-gray-800'}`}>
                                        {item.quantity}
                                    </span>
                                    <span className="text-xs font-bold text-gray-400">Em Estoque</span>
                                </div>
                            </div>
                            
                            {/* ALERTA DE 10% */}
                            {isLowStock && (
                                <div className="bg-red-50 px-4 py-2 flex items-center gap-2 border-t border-red-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <div>
                                        <p className="text-xs font-bold text-red-800 uppercase">Atenção: Estoque Baixo</p>
                                        <p className="text-[10px] text-red-600">Restam menos de 10% do cadastrado.</p>
                                    </div>
                                </div>
                            )}

                            {/* PREVISÃO */}
                            <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div>
                                    <p className="text-[10px] font-bold text-blue-800 uppercase">Estimativa de Duração</p>
                                    <p className="text-xs text-blue-600 font-medium">
                                        {daysLeft !== null 
                                            ? `${daysLeft} dias (baseado no uso)` 
                                            : "Aguardando dados de consumo..."}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto border-t border-gray-100 p-2 grid grid-cols-2 gap-2 bg-gray-50">
                                <button 
                                    onClick={() => { setSelectedItem(item); setAdjustAmount('-1'); }}
                                    className="py-2 bg-white border border-gray-300 rounded text-red-600 font-bold text-sm hover:bg-red-50 hover:border-red-300 transition-colors"
                                >
                                    - Dar Baixa
                                </button>
                                <button 
                                    onClick={() => { setSelectedItem(item); setAdjustAmount(''); }}
                                    className="py-2 bg-white border border-gray-300 rounded text-green-600 font-bold text-sm hover:bg-green-50 hover:border-green-300 transition-colors"
                                >
                                    + Entrada
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {inventory.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    <p className="text-lg font-bold text-gray-600">Estoque Vazio</p>
                    <p className="text-sm text-gray-500">Cadastre o primeiro item (ex: Kit Lanche) para começar.</p>
                </div>
            )}
        </div>

        {/* MODAL ADICIONAR ITEM */}
        {showAddModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-fade-in border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Novo Item de Estoque</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Item</label>
                            <input 
                                type="text" 
                                value={newItemName} 
                                onChange={e => setNewItemName(e.target.value)} 
                                className={inputStyle}
                                placeholder="Ex: Kit Lanche" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
                                <select 
                                    value={newItemCategory} 
                                    onChange={e => setNewItemCategory(e.target.value as any)} 
                                    className={inputStyle}
                                >
                                    <option value="ALIMENTACAO">Alimentação</option>
                                    <option value="VESTUARIO">Vestuário</option>
                                    <option value="EQUIPAMENTO">Equipamento</option>
                                    <option value="OUTROS">Outros</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Unidade</label>
                                <input 
                                    type="text" 
                                    value={newItemUnit} 
                                    onChange={e => setNewItemUnit(e.target.value)} 
                                    className={inputStyle} 
                                    placeholder="Ex: Kit" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Quantidade Inicial</label>
                            <input 
                                type="number" 
                                value={newItemInitialQty} 
                                onChange={e => setNewItemInitialQty(e.target.value)} 
                                className={inputStyle} 
                                placeholder="0" 
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                        <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
                        <button onClick={handleAddNew} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md">Criar Item</button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL AJUSTAR ESTOQUE */}
        {selectedItem && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-fade-in border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Movimentar Estoque</h2>
                    <p className="text-sm text-gray-500 mb-4">Item: <span className="font-bold text-gray-800">{selectedItem.name}</span> (Atual: {selectedItem.quantity})</p>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Quantidade a Adicionar/Remover</label>
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                value={adjustAmount} 
                                onChange={e => setAdjustAmount(e.target.value)} 
                                className={inputStyle}
                                placeholder="Use negativo para saída (ex: -5)" 
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Dica: Digite um número negativo para dar baixa manual.</p>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button onClick={() => setSelectedItem(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
                        <button onClick={handleAdjustStock} className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-md">Confirmar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
