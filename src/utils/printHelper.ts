export interface PrintOptions {
  documentTitle: string;
  orientation?: 'portrait' | 'landscape';
}

export function printElementById(elementId: string, options: PrintOptions) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  // Create temporary iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    console.error('Could not get iframe document');
    return;
  }

  doc.open();
  doc.write('<html><head><title>' + options.documentTitle + '</title>');

  // Copy stylesheets from original document to preserve Tailwind CSS classes
  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
  stylesheets.forEach((sheet) => {
    doc.write(sheet.outerHTML);
  });

  // Custom orientation and print-specific margins
  doc.write(`
    <style>
      @page {
        size: ${options.orientation || 'portrait'};
        margin: 15mm 15mm 15mm 15mm;
      }
      body {
        margin: 0;
        padding: 0;
        background: white !important;
        color: black !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        font-family: 'Sarabun', 'Sukhothai', system-ui, sans-serif;
      }
      .break-inside-avoid {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .no-print {
        display: none !important;
      }
    </style>
  `);

  doc.write('</head><body>');
  doc.write(`<div class="${options.orientation === 'landscape' ? 'landscape' : 'portrait'}">`);
  doc.write(element.innerHTML);
  doc.write('</div>');
  doc.write('</body></html>');
  doc.close();

  // Wait for resources/stylesheets to resolve, then trigger print
  setTimeout(() => {
    if (iframe.contentWindow) {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Failed to trigger iframe print:', err);
      }
    }
    // Clean up from the main DOM
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 500);
}
