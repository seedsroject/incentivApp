import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';

/**
 * Converte uma URL de imagem ou string base64 para um ArrayBuffer compatível com jsPDF.
 * Simulado para este escopo.
 */
async function fetchImageAsBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });
}

/**
 * Gera a Capa Oficial e Contracapa do Relatório (Páginas 1 e 2)
 */
export async function generateReportCoverAndIntro(
    reportType: 'assiduidade' | 'pdlie',
    title: string,
    proponente: string,
    city: string,
    year: string,
    aiSummaryText: string
): Promise<Uint8Array> {
    // 1. Inicializar o jsPDF
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 2. Cores da Capa
    const bgColor = reportType === 'assiduidade' ? '#002855' : '#fbb034'; // Azul Escuro ou Amarelo
    const textColor = reportType === 'assiduidade' ? '#FFFFFF' : '#002855';

    // --- CAPA PRINCIPAL (Página 1) ---

    // Fundo Principal (com curva na base)
    doc.setFillColor(bgColor);
    doc.rect(0, 30, pageWidth, pageHeight - 70, 'F');
    
    // Curva visual simulada na base do bloco colorido
    doc.ellipse(pageWidth / 2, pageHeight - 40, pageWidth / 1.5, 20, 'F');

    // Título Central
    doc.setTextColor(textColor);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    
    // Quebra do título em linhas
    const splitTitle = doc.splitTextToSize(title, pageWidth - 40);
    doc.text(splitTitle, 20, 160);

    // Texto de Rodapé da Capa
    doc.setTextColor('#0066cc');
    doc.setFontSize(14);
    doc.text(proponente, 20, pageHeight - 20);

    doc.setFillColor(reportType === 'assiduidade' ? '#000000' : '#8dc63f'); // Preto ou Verde
    doc.rect(pageWidth - 80, pageHeight - 30, 80, 20, 'F');
    doc.setTextColor('#FFFFFF');
    doc.setFontSize(16);
    doc.text(`${city} - CE`, pageWidth - 10, pageHeight - 22, { align: 'right' });
    doc.text(year, pageWidth - 10, pageHeight - 14, { align: 'right' });

    // --- CONTRACAPA / TEXTO INTRODUTÓRIO (Página 2) ---
    doc.addPage();
    
    // Cabeçalho Simples na Contracapa
    doc.setTextColor('#002855');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(proponente, 20, 30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Se a IA gerou um texto, nós o pintamos aqui
    if (aiSummaryText) {
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 20, 60, { maxWidth: pageWidth - 40 });
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#333333');
        const splitSummary = doc.splitTextToSize(aiSummaryText, pageWidth - 40);
        doc.text(splitSummary, 20, 90);
    } else {
        // Texto padrão
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 20, 60, { maxWidth: pageWidth - 40 });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Relatório elaborado a partir dos dados do sistema referentes ao ano de ${year}.`, 20, 90, { maxWidth: pageWidth - 40 });
    }

    // Rodapé da Contracapa
    doc.setTextColor('#002855');
    doc.setFontSize(10);
    doc.text(`${city} | CE`, 20, pageHeight - 30);
    doc.text(year, 20, pageHeight - 25);

    // Retorna o PDF da Capa + Intro como Uint8Array (para o pdf-lib usar depois)
    const pdfOutput = doc.output('arraybuffer');
    return new Uint8Array(pdfOutput);
}


/**
 * Mescla a Capa Gerada com um array de Arquivos PDF Existentes (Anexos/Boletins)
 */
export async function createFinalDossier(
    coverPdfBytes: Uint8Array,
    attachmentBase64Pdfs: string[] // Array de PDFs anexos em base64 da nossa persistência
): Promise<Uint8Array> {
    
    // 1. Criar o documento PDF Final vazio
    const finalDoc = await PDFDocument.create();

    // 2. Carregar e copiar a Capa
    const coverDoc = await PDFDocument.load(coverPdfBytes);
    const coverPages = await finalDoc.copyPages(coverDoc, coverDoc.getPageIndices());
    coverPages.forEach(page => finalDoc.addPage(page));

    // 3. Iterar e apendar cada Anexo
    for (const attachmentBase64 of attachmentBase64Pdfs) {
        try {
            // Decodifica a string base64 do nosso DB (tirando o prefixo data:application/pdf se houver)
            const cleanBase64 = attachmentBase64.includes('base64,') 
                ? attachmentBase64.split('base64,')[1] 
                : attachmentBase64;
                
            const attachmentDoc = await PDFDocument.load(cleanBase64);
            const attachmentPages = await finalDoc.copyPages(attachmentDoc, attachmentDoc.getPageIndices());
            attachmentPages.forEach(page => finalDoc.addPage(page));
        } catch (error) {
            console.error("Erro ao fazer merge de anexo:", error);
            // Ignorar pdf corrompido e seguir
        }
    }

    // 4. Salvar como Uint8Array
    const mergedPdfBytes = await finalDoc.save();
    return mergedPdfBytes;
}

/**
 * Função Utilitária para acionar o Download do Uint8Array direto no navegador
 */
export const triggerPdfDownload = (pdfBytes: Uint8Array, filename: string) => {
    // Para resolver o erro de TS2322
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
