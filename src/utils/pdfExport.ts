import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export interface PdfOptions {
  fileName: string;
  orientation?: 'portrait' | 'landscape';
}

export async function exportElementToPdf(elementId: string, options: PdfOptions): Promise<void> {
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  const orientation = options.orientation || 'portrait';
  const isLandscape = orientation === 'landscape';

  // Standard A4 dimensions in mm: portrait = 210x297, landscape = 297x210
  const pdfWidth = isLandscape ? 297 : 210;
  const pdfHeight = isLandscape ? 210 : 297;

  // Create an off-screen sandbox container that is completely immune to:
  // 1. Parent CSS transforms (e.g. scale(a4Zoom))
  // 2. Dark mode color overrides
  // 3. Viewport/screen size limitations
  const sandbox = document.createElement('div');
  sandbox.style.position = 'fixed';
  sandbox.style.left = '-10000px';
  sandbox.style.top = '0';
  sandbox.style.width = isLandscape ? '297mm' : '210mm';
  sandbox.style.height = isLandscape ? '210mm' : '297mm';
  sandbox.style.zIndex = '-99999';
  sandbox.style.background = '#ffffff';
  sandbox.style.margin = '0';
  sandbox.style.padding = '0';
  sandbox.style.overflow = 'hidden';

  // Clone the element deeply
  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.id = `${elementId}-pdf-export-clone`;
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  clone.style.position = 'relative';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.width = isLandscape ? '297mm' : '210mm';
  clone.style.minWidth = isLandscape ? '297mm' : '210mm';
  clone.style.maxWidth = isLandscape ? '297mm' : '210mm';
  clone.style.height = isLandscape ? '210mm' : '297mm';
  clone.style.minHeight = isLandscape ? '210mm' : '297mm';
  clone.style.maxHeight = isLandscape ? '210mm' : '297mm';
  clone.style.boxSizing = 'border-box';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#000000';

  // Apply print margins on portrait documents if not already specified
  if (!isLandscape && elementId === 'printMemoArea') {
    clone.style.paddingTop = '2.5cm';
    clone.style.paddingLeft = '3.0cm';
    clone.style.paddingRight = '2.0cm';
    clone.style.paddingBottom = '2.5cm';
  } else if (!isLandscape && elementId === 'printPermitArea') {
    clone.style.paddingTop = '2.5cm';
    clone.style.paddingLeft = '3.0cm';
    clone.style.paddingRight = '2.0cm';
    clone.style.paddingBottom = '2.5cm';
  }

  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  try {
    // Wait for all fonts and images inside the clone to be fully loaded
    if (document.fonts) {
      await document.fonts.ready;
    }

    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve(true);
            } else {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true);
            }
          })
      )
    );

    // Render with html2canvas-pro at 2.0x scale for crisp Thai typography
    const canvas = await html2canvas(clone, {
      scale: 2.0,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      imageTimeout: 15000,
      width: clone.offsetWidth,
      height: clone.offsetHeight,
      windowWidth: clone.offsetWidth,
      windowHeight: clone.offsetHeight,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const contentHeightMm = (canvas.height * pdfWidth) / canvas.width;

    // Single page fit (with 4mm tolerance for rounding differences)
    if (contentHeightMm <= pdfHeight + 4) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    } else {
      let heightLeft = contentHeightMm;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, contentHeightMm, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 5) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, contentHeightMm, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
    }

    pdf.save(options.fileName || 'document.pdf');
  } finally {
    if (document.body.contains(sandbox)) {
      document.body.removeChild(sandbox);
    }
  }
}

