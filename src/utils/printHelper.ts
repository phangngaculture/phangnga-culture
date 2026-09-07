/**
 * Print helper utility to reliably print government documents
 * across all browsers, device viewports, and inside iframe containers.
 */

export interface PrintOptions {
  documentTitle?: string;
  orientation?: 'portrait' | 'landscape';
}

export function printElementById(elementId: string, options: PrintOptions = {}) {
  const { documentTitle = 'เอกสารราชการ', orientation = 'portrait' } = options;
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.warn(`Element #${elementId} not found, falling back to window.print()`);
    window.print();
    return;
  }

  // Create an isolated iframe for clean A4 printing without UI noise
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '10px';
  iframe.style.height = '10px';
  iframe.style.opacity = '0.01';
  iframe.style.border = '0';
  iframe.style.pointerEvents = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Gather active stylesheet links and style tags
  const styleSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="th">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${documentTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=TH+Sarabun+PSK:wght@400;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/th-sarabun-psk">
        ${styleSheets}
        <style>
          @page {
            size: A4 ${orientation};
            margin-top: ${orientation === 'landscape' ? '1.5cm' : '2cm'};
            margin-right: ${orientation === 'landscape' ? '1.5cm' : '2cm'};
            margin-bottom: ${orientation === 'landscape' ? '1.5cm' : '2cm'};
            margin-left: ${orientation === 'landscape' ? '1.5cm' : '3cm'};
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', Tahoma, sans-serif !important;
          }
          .no-print, button, .print-hide, [data-print-hide="true"] {
            display: none !important;
            visibility: hidden !important;
          }
          #${elementId} {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            box-sizing: border-box !important;
            padding: 0 !important;
            overflow: visible !important;
            font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', Tahoma, sans-serif !important;
            font-size: 13pt !important;
            line-height: 1.45 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            visibility: visible !important;
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `);
  doc.close();

  // Give fonts and styles a brief moment to apply before triggering print dialog
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print error, falling back to window.print()', err);
      window.print();
    } finally {
      // Remove iframe after user finishes or cancels print dialog
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  }, 400);
}
