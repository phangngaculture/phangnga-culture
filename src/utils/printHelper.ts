export interface PrintOptions {
  documentTitle: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Prints a single document element in an isolated window.
 *
 * The previous implementation called window.print() on the application page.
 * That page intentionally keeps the A4 preview hidden on some views with
 * opacity/position utility classes, so browsers could capture an empty or
 * incomplete page.  Cloning the selected document into a print-only window
 * avoids those layout and visibility conflicts.
 */
export function printElementById(elementId: string, options: PrintOptions) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    window.print();
    return;
  }

  const printWindow = window.open('', '_blank', 'width=900,height=1100');

  // If the browser blocks a popup, fall back to the current page while making
  // every hidden ancestor visible for the duration of the print operation.
  if (!printWindow) {
    printFromCurrentPage(element, options);
    return;
  }

  const title = escapeHtml(options.documentTitle || document.title);
  const baseHref = escapeHtml(document.baseURI);
  const styles = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n');
  const clonedElement = element.cloneNode(true) as HTMLElement;
  clonedElement.classList.add('printable-document');
  clonedElement.removeAttribute('aria-hidden');

  const orientation = options.orientation === 'landscape' ? 'landscape' : 'portrait';
  const printCss = `
    @page { size: A4 ${orientation}; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff !important; }
    body { color: #000 !important; }
    .printable-document {
      display: block !important;
      visibility: visible !important;
      position: relative !important;
      opacity: 1 !important;
      transform: none !important;
      left: auto !important;
      top: auto !important;
      width: 100% !important;
      margin: 0 !important;
      box-shadow: none !important;
      border: 0 !important;
    }
    .printable-document * { visibility: visible !important; }
    button, .no-print, [data-print-hide="true"] { display: none !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  `;

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><base href="${baseHref}"><title>${title}</title>${styles}<style>${printCss}</style></head>
<body>${clonedElement.outerHTML}</body></html>`);
  printWindow.document.close();

  let closed = false;
  const closePrintWindow = () => {
    if (closed) return;
    closed = true;
    printWindow.close();
  };

  printWindow.addEventListener('afterprint', closePrintWindow, { once: true });

  const waitForAssets = async () => {
    try {
      if (printWindow.document.fonts?.ready) {
        await printWindow.document.fonts.ready;
      }
      const images = Array.from(printWindow.document.images);
      await Promise.all(images.map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        });
      }));
    } catch (error) {
      console.warn('Some print assets could not be fully loaded:', error);
    }

    // Allow the cloned layout and web fonts one final rendering frame.
    await new Promise<void>((resolve) => {
      printWindow.requestAnimationFrame(() => {
        printWindow.requestAnimationFrame(() => resolve());
      });
    });

    if (!closed) {
      printWindow.focus();
      printWindow.print();
      // Firefox may not emit afterprint when the user saves/cancels from the
      // preview UI. This is only a cleanup fallback after the dialog is done.
      window.setTimeout(closePrintWindow, 30000);
    }
  };

  void waitForAssets();
}

function printFromCurrentPage(element: HTMLElement, options: PrintOptions) {
  const originalTitle = document.title;
  const originalAttributes = new Map<HTMLElement, string | null>();
  let current: HTMLElement | null = element;

  while (current) {
    originalAttributes.set(current, current.getAttribute('style'));
    current.style.opacity = '1';
    current.style.visibility = 'visible';
    current.style.position = 'static';
    current.style.left = 'auto';
    current.style.top = 'auto';
    current.style.transform = 'none';
    current.style.pointerEvents = 'auto';
    current = current.parentElement;
  }

  const hadClass = element.classList.contains('printable-document');
  if (!hadClass) element.classList.add('printable-document');
  document.title = options.documentTitle;

  const restore = () => {
    document.title = originalTitle;
    originalAttributes.forEach((style, node) => {
      if (style === null) node.removeAttribute('style');
      else node.setAttribute('style', style);
    });
    if (!hadClass) element.classList.remove('printable-document');
    window.removeEventListener('afterprint', restore);
  };

  window.addEventListener('afterprint', restore, { once: true });
  window.print();
  window.setTimeout(restore, 30000);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character] || character);
}
