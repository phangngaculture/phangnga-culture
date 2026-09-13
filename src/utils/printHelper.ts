export interface PrintOptions {
  documentTitle: string;
  orientation?: 'portrait' | 'landscape';
}

export function printElementById(elementId: string, options: PrintOptions) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    window.print();
    return;
  }

  // Backup original document title and apply the print title
  const originalTitle = document.title;
  document.title = options.documentTitle;

  // Add the "printable-document" class to ensure it displays correctly during print
  const hadClass = element.classList.contains('printable-document');
  if (!hadClass) {
    element.classList.add('printable-document');
  }

  // Handle landscape orientation printing explicitly by adding temporary page style
  let styleSheet: HTMLStyleElement | null = null;
  if (options.orientation === 'landscape') {
    styleSheet = document.createElement('style');
    styleSheet.innerHTML = `@page { size: landscape; margin: 15mm; }`;
    document.head.appendChild(styleSheet);
  }

  // Print using the top-level window print dialog, which works flawlessly in iframe previews
  try {
    window.print();
  } catch (err) {
    console.error('Failed to trigger window print, attempting fallback:', err);
    // Fallback back to standard behavior if print is not supported
  }

  // Restore state after print dialog closes
  setTimeout(() => {
    document.title = originalTitle;
    if (!hadClass) {
      element.classList.remove('printable-document');
    }
    if (styleSheet && document.head.contains(styleSheet)) {
      document.head.removeChild(styleSheet);
    }
  }, 1000);
}
