const nucleos = [
  { nome: 'Ilhéus | BA - CEEP do Chocolate - BA', address: 'CEEP do Chocolate - BA' },
  { nome: 'Ilhéus', address: 'CEEP do Chocolate' },
  { nome: 'Caucaia | CE - Centro Municipal - CE', address: 'Centro Municipal - CE' },
  { nome: 'Caucaia', address: 'Centro Municipal' },
  { nome: 'Atitude Atletas - Bairro Pirambu', address: 'Bairro Pirambu' }
];

const deduped = (() => {
  const seen = new Map<string, any>();
  for (const n of nucleos) {
    const baseName = (n.nome || '')
      .split('-')[0]
      .split('|')[0]
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim();
      
    const normAddr = baseName || 'desconhecido';
    
    const existing = seen.get(normAddr);
    if (!existing) {
      seen.set(normAddr, n);
    } else {
      const ufRegex = /\s*-\s*[A-Z]{2}\s*$/i;
      const hasUF = ufRegex.test(n.address || '') || ufRegex.test(n.nome || '');
      const existingHasUF = ufRegex.test(existing.address || '') || ufRegex.test(existing.nome || '');
      
      if (hasUF && !existingHasUF) {
        seen.set(normAddr, n);
      }
    }
  }
  return Array.from(seen.values());
})();

console.log(deduped);
