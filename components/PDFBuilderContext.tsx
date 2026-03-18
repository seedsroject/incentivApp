
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PDFPage, PDFItem, PDFItemType, Asset } from '../types';

interface PDFBuilderContextType {
  pages: PDFPage[];
  assets: Asset[];
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  addPage: () => void;
  removePage: (pageId: string) => void;
  addItemToPage: (pageId: string, type: PDFItemType, data: any, title?: string, initialProps?: Partial<PDFItem>) => void;
  removeItemFromPage: (pageId: string, itemId: string) => void;
  updateItem: (pageId: string, itemId: string, updates: Partial<PDFItem>) => void;
  clearAll: () => void;
  loadTemplate: (initialPages: PDFPage[]) => void;
  addAsset: (asset: Asset) => void;
  removeAsset: (assetId: string) => void;
  generateToCAndNumbers: () => void;
}

const PDFBuilderContext = createContext<PDFBuilderContextType | undefined>(undefined);

export const PDFBuilderProvider: React.FC<{ children: ReactNode; initialPages?: PDFPage[] }> = ({ children, initialPages }) => {
  console.log("PDFBuilderProvider rendering. initialPages length:", initialPages?.length);
  const [pages, setPages] = useState<PDFPage[]>(initialPages && initialPages.length > 0 ? initialPages : [{ id: 'page_1', items: [] }]);
  
  useEffect(() => {
    console.log("PDFBuilderProvider useEffect triggered. initialPages:", initialPages);
    if (initialPages && initialPages.length > 0) {
      setPages(initialPages);
    }
  }, [initialPages]);

  useEffect(() => {
    console.log("Current pages state:", pages);
  }, [pages]);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const addPage = () => {
    setPages(prev => [...prev, { id: `page_${Date.now()}`, items: [] }]);
  };

  const removePage = (pageId: string) => {
    setPages(prev => prev.filter(p => p.id !== pageId));
  };

  const addItemToPage = (pageId: string, type: PDFItemType, data: any, title?: string, initialProps?: Partial<PDFItem>) => {
    // Definir padrões para editor livre
    let defaultWidth = type.includes('TABLE') ? 700 : type === 'IMAGE' ? 400 : 500;
    let defaultHeight: number = 200; // Altura padrão para a maioria dos itens

    // Definir tamanhos específicos por tipo
    if (type === 'IMAGE') {
      defaultWidth = 400;
      defaultHeight = 300; // Proporção razoável para imagens
    } else if (type === 'EVIDENCE_CARD') {
      defaultWidth = 350; // ~1/4 da largura da página A4 (794px)
      defaultHeight = 280; // ~1/4 da altura útil
      // Adiciona headingLevel H2 para aparecer no sumário
      data = {
        ...data,
        headingLevel: 'H2',
        tocTitle: data.figureLabel ? `${data.figureLabel}: ${data.description?.substring(0, 40) || ''}` : `Figura ${data.number}: ${data.description?.substring(0, 40) || ''}`
      };
    } else if (type === 'TEXT_NOTE') {
      defaultWidth = 400;
      defaultHeight = 100; // Menor altura para textos
    } else if (type.includes('TABLE')) {
      defaultWidth = 700;
      defaultHeight = 300; // Tabelas precisam de mais altura
    }

    const newItem: PDFItem = {
      id: `item_${Date.now()}_${Math.random()}`,
      type,
      data,
      title,
      x: 20, // Default padding left
      y: 20, // Default padding top
      width: defaultWidth,
      height: defaultHeight, // Altura padrão definida acima
      ...initialProps, // Sobrescreve x, y se fornecidos
    };

    // Se initialProps não forneceu height, garantir que usamos defaultHeight
    if (newItem.height === undefined) {
      newItem.height = defaultHeight;
    }

    setPages(prev => prev.map(page => {
      if (page.id === pageId) {
        // Novo item recebe zIndex maior que os existentes
        const maxZIndex = page.items.reduce((max, item) => Math.max(max, item.zIndex || 10), 10);
        newItem.zIndex = maxZIndex + 1;

        // Só empilha automaticamente se NÃO foi fornecida uma posição Y explícita
        // (quando o usuário solta em um local específico, a posição deve ser respeitada)
        if (initialProps?.y === undefined) {
          const lastItem = page.items[page.items.length - 1];
          if (lastItem && lastItem.y !== undefined && lastItem.height !== undefined) {
            newItem.y = lastItem.y + (lastItem.height || 100) + 20;
          } else if (page.items.length > 0) {
            newItem.y = (page.items.length * 150) + 20; // Fallback
          }
        }

        // Garantir que a posição está dentro dos limites da página (A4: ~1123px height)
        // Se ficar fora, reposicionar dentro da área visível
        const pageHeight = 1123; // ~297mm em pixels
        const pageWidth = 794; // ~210mm em pixels
        if (newItem.y !== undefined && newItem.height !== undefined) {
          if (newItem.y + newItem.height > pageHeight) {
            newItem.y = Math.max(20, pageHeight - newItem.height - 20);
          }
        }
        if (newItem.x !== undefined && newItem.width !== undefined) {
          if (newItem.x + newItem.width > pageWidth) {
            newItem.x = Math.max(20, pageWidth - newItem.width - 20);
          }
        }

        return { ...page, items: [...page.items, newItem] };
      }
      return page;
    }));

    if (!isSidebarOpen) setIsSidebarOpen(true);
  };

  const updateItem = (pageId: string, itemId: string, updates: Partial<PDFItem>) => {
    setPages(prev => prev.map(page => {
      if (page.id !== pageId) return page;
      return {
        ...page,
        items: page.items.map(item => item.id === itemId ? { ...item, ...updates } : item)
      };
    }));
  };

  const removeItemFromPage = (pageId: string, itemId: string) => {
    setPages(prev => prev.map(page => {
      if (page.id === pageId) {
        return { ...page, items: page.items.filter(i => i.id !== itemId) };
      }
      return page;
    }));
  };

  const addAsset = (asset: Asset) => {
    setAssets(prev => [...prev, asset]);
  };

  const removeAsset = (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
  };

  const generateToCAndNumbers = () => {
    setPages(prev => {
      // 1. Tentar encontrar estilos existentes do Sumário para preservá-los (Cor, Fonte, etc)
      let preservedTitleStyle = { fontSize: 24, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Arial', color: '#000000' };
      let preservedContentStyle = { fontSize: 12, fontFamily: 'Courier New', lineHeight: 1.8, color: '#000000' };

      const existingTocPage = prev.find(p => p.id === 'page_toc');
      if (existingTocPage) {
        const oldTitle = existingTocPage.items.find(i => i.id === 'toc_title');
        if (oldTitle && oldTitle.data.style) preservedTitleStyle = { ...preservedTitleStyle, ...oldTitle.data.style };

        const oldContent = existingTocPage.items.find(i => i.id === 'toc_content');
        if (oldContent && oldContent.data.style) preservedContentStyle = { ...preservedContentStyle, ...oldContent.data.style };
      }

      // 2. Remover página de sumário antiga e limpar numeração
      const contentPages = prev.filter(p => p.id !== 'page_toc').map(page => ({
        ...page,
        items: page.items.filter(i => i.title !== 'PageNumber')
      }));

      // 3. Adicionar números de página (Footer)
      const numberedPages = contentPages.map((page, index) => {
        const footerItem: PDFItem = {
          id: `pg_num_${page.id}_${Date.now()}`,
          type: 'TEXT_NOTE',
          data: {
            text: `${index + 2}`,
            style: { fontSize: 10, textAlign: 'right', color: '#666666', fontFamily: 'Arial' }
          },
          title: 'PageNumber',
          x: 700, y: 1080, width: 50, height: 30
        };
        return { ...page, items: [...page.items, footerItem] };
      });

      // 4. Gerar Dados do Sumário
      const tocEntries: { title: string, page: number, level: string }[] = [];

      numberedPages.forEach((page, pIndex) => {
        const sortedItems = [...page.items].sort((a, b) => (a.y || 0) - (b.y || 0));

        sortedItems.forEach(item => {
          // TEXT_NOTE with heading level
          if (item.type === 'TEXT_NOTE' && item.data.headingLevel && item.data.headingLevel !== 'P') {
            let text = item.data.text || "";
            if (text.length > 65) text = text.substring(0, 65) + "...";

            tocEntries.push({
              title: text,
              page: pIndex + 2,
              level: item.data.headingLevel
            });
          }

          // EVIDENCE_CARD with heading level (figuras)
          if (item.type === 'EVIDENCE_CARD' && item.data.headingLevel) {
            let text = item.data.tocTitle || `Figura ${item.data.number}: ${item.data.description?.substring(0, 40) || ''}`;
            if (text.length > 65) text = text.substring(0, 65) + "...";

            tocEntries.push({
              title: text,
              page: pIndex + 2,
              level: item.data.headingLevel
            });
          }
        });
      });

      // 5. Criar Página do Sumário com os estilos preservados
      let tocContent = "SUMÁRIO\n\n";

      if (tocEntries.length === 0) {
        tocContent += "(Nenhum título marcado. Use a barra lateral para marcar textos como Título 1, 2 ou 3)";
      } else {
        tocEntries.forEach(entry => {
          let indent = "";
          if (entry.level === 'H2') indent = "   ";
          if (entry.level === 'H3') indent = "      ";

          const maxDots = 60;
          const titleLen = entry.title.length + indent.length;
          const dotsCount = Math.max(2, maxDots - titleLen);
          const dots = ".".repeat(dotsCount);

          tocContent += `${indent}${entry.title} ${dots} ${entry.page}\n`;
        });
      }

      const tocPage: PDFPage = {
        id: 'page_toc',
        items: [{
          id: 'toc_title',
          type: 'TEXT_NOTE',
          data: {
            text: "Relatório de Atividades",
            style: preservedTitleStyle // Usa o estilo preservado
          },
          title: 'Título Capa',
          x: 50, y: 100, width: 700, height: 50
        }, {
          id: 'toc_content',
          type: 'TEXT_NOTE',
          data: {
            text: tocContent,
            style: preservedContentStyle // Usa o estilo preservado
          },
          title: 'Sumário Automático',
          x: 50, y: 200, width: 700, height: 800
        }]
      };

      return [tocPage, ...numberedPages];
    });
  };

  const clearAll = () => {
    setPages([{ id: 'page_1', items: [] }]);
  };

  const loadTemplate = (initialPages: PDFPage[]) => {
    setPages(initialPages);
  };

  return (
    <PDFBuilderContext.Provider value={{
      pages,
      assets,
      isSidebarOpen,
      toggleSidebar,
      addPage,
      removePage,
      addItemToPage,
      removeItemFromPage,
      updateItem,
      clearAll,
      loadTemplate,
      addAsset,
      removeAsset,
      generateToCAndNumbers
    }}>
      {children}
    </PDFBuilderContext.Provider>
  );
};

export const usePDFBuilder = () => {
  const context = useContext(PDFBuilderContext);
  if (!context) {
    throw new Error('usePDFBuilder must be used within a PDFBuilderProvider');
  }
  return context;
};
