import { PDFPage, PDFItem, TextStyle } from '../types';

interface TemplateOptions {
  nucleo: string;
  year: string;
  proponente: string;
  city: string;
}

const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Arial',
  fontSize: 12,
  textAlign: 'left',
  lineHeight: 1.5,
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#000000'
};

const TITLE_STYLE: TextStyle = {
  ...DEFAULT_TEXT_STYLE,
  fontSize: 24,
  fontWeight: 'bold',
  textAlign: 'center'
};

const SUBTITLE_STYLE: TextStyle = {
  ...DEFAULT_TEXT_STYLE,
  fontSize: 14,
  fontWeight: 'bold',
  textAlign: 'center',
  color: '#555555'
};

export const getReportTemplate = (reportId: string, options: TemplateOptions): PDFPage[] => {
  const pages: PDFPage[] = [];

  // Page 1: Cover Page
  // We can simulate the blue cover by adding a large colored rectangle or an image later, 
  // but for now, we'll construct the dynamic text elements of the cover.
  const isAssiduidade = reportId === 'assiduidade';
  const coverColor = isAssiduidade ? '#003366' : '#FFD700'; // Dark Blue vs Yellow/Gold
  const coverTextColor = isAssiduidade ? '#FFFFFF' : '#000000';

  const coverPage: PDFPage = {
    id: `page_cover_${Date.now()}`,
    items: [
      {
        id: `cover_bg_${Date.now()}`,
        type: 'TEXT_NOTE',
        data: {
          text: '',
          style: { ...DEFAULT_TEXT_STYLE, backgroundColor: coverColor }
        },
        title: 'Fundo da Capa',
        x: 0,
        y: 0,
        width: 794, // A4 width at 96dpi approx
        height: 1123, // A4 height approx
        zIndex: 1
      },
      {
        id: `cover_proponente_${Date.now()}`,
        type: 'TEXT_NOTE',
        data: {
          text: options.proponente,
          style: { ...TITLE_STYLE, color: coverTextColor, fontSize: 18 }
        },
        title: 'Proponente',
        x: 50,
        y: 200,
        width: 694,
        height: 50,
        zIndex: 2
      },
      {
        id: `cover_title_${Date.now()}`,
        type: 'TEXT_NOTE',
        data: {
          text: isAssiduidade 
            ? 'Anexo Meta Qualitativa 01\nRelatório de Assiduidade e Aproveitamento Escolar' 
            : 'Relatório do Plano de Divulgação\nLei de Incentivo ao Esporte - PDLIE',
          style: { ...TITLE_STYLE, color: coverTextColor, fontSize: 26, lineHeight: 1.2 }
        },
        title: 'Título do Dossiê',
        x: 50,
        y: 400,
        width: 694,
        height: 100,
        zIndex: 2
      },
      {
        id: `cover_footer_${Date.now()}`,
        type: 'TEXT_NOTE',
        data: {
          text: `${options.city}\n${options.year}`,
          style: { ...SUBTITLE_STYLE, color: coverTextColor }
        },
        title: 'Rodapé (Cidade/Ano)',
        x: 50,
        y: 1000,
        width: 694,
        height: 50,
        zIndex: 2
      }
    ]
  };

  pages.push(coverPage);

  // Page 2: Summary / Report Content (AI generated text goes here)
  const contentPage: PDFPage = {
    id: `page_content_${Date.now()}`,
    items: [
      {
        id: `content_header_${Date.now()}`,
        type: 'IMAGE',
        data: {
          text: '',
          style: DEFAULT_TEXT_STYLE,
          src: '/header_full.png'
        },
        title: 'Cabeçalho',
        x: 50,
        y: 20,
        width: 694,
        height: 60,
        zIndex: 10
      },
      {
        id: `content_title_${Date.now()}`,
        type: 'TEXT_NOTE',
        data: {
          text: 'Resumo Analítico',
          style: { ...TITLE_STYLE, textAlign: 'left' },
          headingLevel: 'H1'
        },
        title: 'Título Resumo',
        x: 50,
        y: 100,
        width: 694,
        height: 50,
        zIndex: 10
      },
      {
        id: `content_body_${Date.now()}`,
        type: 'TEXT_NOTE',
        data: {
          text: `[O texto gerado pela IA ou resumo analítico do núcleo ${options.nucleo} no ano de ${options.year} aparecerá aqui]`,
          style: DEFAULT_TEXT_STYLE
        },
        title: 'Texto Analítico (IA)',
        x: 50,
        y: 170,
        width: 694,
        height: 300,
        zIndex: 10
      }
    ]
  };

  // If it's assiduidade, we add a placeholder for the table
  if (isAssiduidade) {
    contentPage.items.push({
      id: `table_placeholder_${Date.now()}`,
      type: 'TEXT_NOTE',
      data: {
        text: '<< Tabela de Assiduidade e Aproveitamento será importada aqui >>\n(Use a barra lateral para arrastar a Tabela de Alunos do Núcleo)',
        style: { ...DEFAULT_TEXT_STYLE, fontStyle: 'italic', color: '#666666', textAlign: 'center' }
      },
      title: 'Espaço Tabela',
      x: 50,
      y: 450,
      width: 694,
      height: 100,
      zIndex: 10
    });
  }

  pages.push(contentPage);

  return pages;
};
