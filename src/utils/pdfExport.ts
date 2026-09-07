import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export interface PdfExportOptions {
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
}

// Physical A4 Dimensions in millimeters (ISO 216 standard)
const A4_PORTRAIT_WIDTH_MM = 210;
const A4_PORTRAIT_HEIGHT_MM = 297;

// Exact standard CSS Pixel conversion (96 CSS pixels per 25.4 mm)
const MM_TO_PX = 96 / 25.4; // 3.779527559055118

/**
 * Exports a DOM element to an authentic A4 PDF file with high DPI.
 * Adheres strictly to Thai official government form standards:
 * - Fixed A4 paper size (210 x 297 mm in Portrait)
 * - Measurement unit: 'mm'
 * - Completely decoupled from user browser viewport, windowWidth, or responsive breakpoints
 * - Supports 100% scale physical printing without scaling or shrinking
 */
export async function exportElementToPdf(
  elementId: string,
  options: PdfExportOptions = {}
): Promise<boolean> {
  const { fileName = 'เอกสารราชการ.pdf', orientation = 'portrait' } = options;
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found for PDF export`);
    throw new Error(`Element #${elementId} not found`);
  }

  const isLandscape = orientation === 'landscape';
  const targetWidthMm = isLandscape ? A4_PORTRAIT_HEIGHT_MM : A4_PORTRAIT_WIDTH_MM; // 297 or 210
  const targetHeightMm = isLandscape ? A4_PORTRAIT_WIDTH_MM : A4_PORTRAIT_HEIGHT_MM; // 210 or 297

  const targetWidthPx = Math.round(targetWidthMm * MM_TO_PX);
  const targetHeightPx = Math.round(targetHeightMm * MM_TO_PX);

  // Ensure fonts (TH Sarabun, Prompt) are loaded before capturing
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness errors
    }
  }

  // Ensure all embedded images (signature, garuda stamp) are fully loaded
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );

  // High-DPI scale (2x gives crisp 192 DPI print quality)
  const scale = 2;

  // Capture element on fixed physical A4 geometry, ignoring browser viewport
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollX: 0,
    scrollY: 0,
    width: targetWidthPx,
    height: targetHeightPx,
    windowWidth: targetWidthPx,
    windowHeight: targetHeightPx,
    onclone: (clonedDoc) => {
      // Isolate cloned document from host window viewport constraints
      if (clonedDoc.body) {
        clonedDoc.body.style.margin = '0';
        clonedDoc.body.style.padding = '0';
        clonedDoc.body.style.background = '#ffffff';
        clonedDoc.body.style.width = `${targetWidthPx}px`;
        clonedDoc.body.style.minWidth = `${targetWidthPx}px`;
      }

      const clonedEl = clonedDoc.getElementById(elementId);
      if (clonedEl) {
        clonedEl.style.boxSizing = 'border-box';
        clonedEl.style.width = `${targetWidthMm}mm`;
        clonedEl.style.minWidth = `${targetWidthMm}mm`;
        clonedEl.style.maxWidth = `${targetWidthMm}mm`;
        clonedEl.style.height = `${targetHeightMm}mm`;
        clonedEl.style.minHeight = `${targetHeightMm}mm`;
        clonedEl.style.maxHeight = `${targetHeightMm}mm`;
        clonedEl.style.overflow = 'hidden';
        clonedEl.style.margin = '0 auto';
        clonedEl.style.boxShadow = 'none';
        clonedEl.style.border = 'none';
        clonedEl.style.backgroundColor = '#ffffff';
        clonedEl.style.transform = 'none';
        clonedEl.style.fontFamily = "'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', Tahoma, sans-serif";
      }
    },
  });

  // Initialize jsPDF with exact ISO A4 dimensions in millimeters
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: isLandscape ? [targetWidthMm, targetHeightMm] : [targetWidthMm, targetHeightMm],
    compress: true,
  });

  const pagePixelWidth = targetWidthPx * scale;
  const pagePixelHeight = targetHeightPx * scale;
  const totalCanvasHeight = canvas.height;
  const totalCanvasWidth = canvas.width;

  // Calculate pages required (if content overflows single A4 page)
  const totalPages = Math.max(1, Math.ceil((totalCanvasHeight - 10) / pagePixelHeight));

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      pdf.addPage(
        isLandscape ? [targetWidthMm, targetHeightMm] : [targetWidthMm, targetHeightMm],
        isLandscape ? 'landscape' : 'portrait'
      );
    }

    // Slice exact A4 page canvas to prevent any aspect ratio distortion
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = pagePixelWidth;
    pageCanvas.height = pagePixelHeight;
    const pageCtx = pageCanvas.getContext('2d');

    if (pageCtx) {
      pageCtx.fillStyle = '#ffffff';
      pageCtx.fillRect(0, 0, pagePixelWidth, pagePixelHeight);

      const srcY = page * pagePixelHeight;
      const srcHeight = Math.min(pagePixelHeight, totalCanvasHeight - srcY);

      pageCtx.drawImage(
        canvas,
        0, srcY, totalCanvasWidth, srcHeight,
        0, 0, pagePixelWidth, srcHeight
      );

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);

      // Render onto PDF at exact 1:1 physical millimeter coordinates
      pdf.addImage(
        pageImgData,
        'JPEG',
        0,
        0,
        targetWidthMm,
        targetHeightMm,
        undefined,
        'FAST'
      );
    }
  }

  const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  pdf.save(safeFileName);
  return true;
}
