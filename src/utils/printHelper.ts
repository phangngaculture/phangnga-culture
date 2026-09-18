export interface PrintOptions {
  documentTitle: string;
  orientation?: 'portrait' | 'landscape';
  /**
   * เพิ่มคลาส `printable-document` ให้โซนที่พิมพ์ด้วย (ค่าเริ่มต้น: true)
   * ตั้งเป็น false เมื่อต้องการคงฟอนต์/รูปแบบเดิมของเอกสารฉบับนั้นไว้
   */
  addPrintableClass?: boolean;
}

/** โซนเอกสารที่ผู้ใช้ต้องการพิมพ์ */
const PRINT_ROOT_CLASS = 'print-sheet-root';
/** โซ่ของโซนแม่ทั้งหมด (ใช้ซ่อนส่วนอื่นของแอปไม่ให้กินพื้นที่กระดาษ) */
const PRINT_ANCESTOR_CLASS = 'print-sheet-ancestor';
/** ธงที่ <body> ระหว่างสั่งพิมพ์ */
const PRINT_ACTIVE_CLASS = 'print-sheet-active';

/**
 * ติดคลาสตามเส้นทางของเอกสาร (ตัวเอง + โซนแม่ทุกชั้น + body)
 * เพื่อให้ CSS @media print ซ่อนส่วนอื่นของแอปทั้งหมดได้
 * ปัญหาเดิม: เนื้อหาแอปถูกซ่อนด้วย visibility แต่ยังกินพื้นที่กระดาษ
 * ทำให้เอกสารไปเริ่มที่หน้าถัดไปและถูกตัดแบ่งหลายหน้า
 */
function markPrintChain(element: HTMLElement): HTMLElement[] {
  const marked: HTMLElement[] = [];

  element.classList.add(PRINT_ROOT_CLASS);
  marked.push(element);

  let parent = element.parentElement;
  while (parent) {
    parent.classList.add(PRINT_ANCESTOR_CLASS);
    marked.push(parent);
    parent = parent.parentElement;
  }

  document.body.classList.add(PRINT_ACTIVE_CLASS);
  return marked;
}

function unmarkPrintChain(marked: HTMLElement[]) {
  marked.forEach((node) => {
    node.classList.remove(PRINT_ROOT_CLASS, PRINT_ANCESTOR_CLASS);
  });
  document.body.classList.remove(PRINT_ACTIVE_CLASS);
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
  const shouldAddPrintableClass = options.addPrintableClass !== false;
  const hadClass = element.classList.contains('printable-document');
  if (shouldAddPrintableClass && !hadClass) {
    element.classList.add('printable-document');
  }

  // Mark the whole printable chain so that everything else in the app is
  // collapsed during print and the document always starts on page 1.
  const markedNodes = markPrintChain(element);

  // Handle landscape orientation printing explicitly by adding temporary page style
  let styleSheet: HTMLStyleElement | null = null;
  if (options.orientation === 'landscape') {
    styleSheet = document.createElement('style');
    styleSheet.innerHTML = `@page { size: landscape; margin: 15mm; }`;
    document.head.appendChild(styleSheet);
  }

  let restored = false;
  const restoreState = () => {
    if (restored) return;
    restored = true;

    document.title = originalTitle;
    if (shouldAddPrintableClass && !hadClass) {
      element.classList.remove('printable-document');
    }
    unmarkPrintChain(markedNodes);
    if (styleSheet && document.head.contains(styleSheet)) {
      document.head.removeChild(styleSheet);
    }
  };

  // Restore as soon as the print dialog is dismissed (all modern browsers)
  window.addEventListener('afterprint', restoreState, { once: true });

  // Print using the top-level window print dialog, which works flawlessly in iframe previews
  try {
    window.print();
  } catch (err) {
    console.error('Failed to trigger window print, attempting fallback:', err);
    // Fallback back to standard behavior if print is not supported
  }

  // Safety net: restore state even when `afterprint` never fires (e.g. some iframes)
  setTimeout(restoreState, 1500);
}
