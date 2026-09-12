import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PdfOptions {
  fileName: string;
  orientation?: 'portrait' | 'landscape';
}

export async function exportElementToPdf(elementId: string, options: PdfOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  // Scale up by 2x for high-quality, crisp vector/typographic printing
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    allowTaint: true,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const orientation = options.orientation || 'portrait';
  
  // Standard A4 dimensions in mm: portrait = 210x297, landscape = 297x210
  const pdfWidth = orientation === 'landscape' ? 297 : 210;
  const pdfHeight = orientation === 'landscape' ? 210 : 297;
  
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4',
  });

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  let heightLeft = imgHeight;
  let position = 0;

  // Add first page
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pdfHeight;

  // Append remaining pages if content height exceeds single page height
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;
  }

  pdf.save(options.fileName || 'document.pdf');
}
