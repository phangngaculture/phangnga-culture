export interface PrintOptions {
  /**
   * ชื่อเอกสารสำหรับบันทึกเป็นไฟล์ PDF
   * หมายเหตุ: ไม่ถูกนำไปใส่เป็นชื่อเอกสารบนหัวกระดาษของเบราว์เซอร์แล้ว
   */
  documentTitle: string;
  orientation?: 'portrait' | 'landscape';
  /**
   * เพิ่มคลาส `printable-document` ให้โซนที่พิมพ์ด้วย (ค่าเริ่มต้น: true)
   * ตั้งเป็น false เมื่อต้องการคงฟอนต์/รูปแบบเดิมของเอกสารฉบับนั้นไว้
   */
  addPrintableClass?: boolean;
  /**
   * ย่อเอกสารให้พอดี 1 หน้าโดยอัตโนมัติ (สำหรับเอกสาร A4 หน้าเดียว เช่น ใบคำขอ)
   * ใช้กับเอกสารที่มีหลายหน้าโดยธรรมชาติ (ทะเบียนคุม/รายงาน) ไม่ควรเปิด
   * ค่าเริ่มต้น: true (กันเอกสารล้นไปหน้า 2 ว่างเหมือนไฟล์ PDF)
   */
  fitToPage?: boolean;
}

/** โซนเอกสารที่ผู้ใช้ต้องการพิมพ์ */
const PRINT_ROOT_CLASS = 'print-sheet-root';
/** โซ่ของโซนแม่ทั้งหมด (ใช้ซ่อนส่วนอื่นของแอปไม่ให้กินพื้นที่กระดาษ) */
const PRINT_ANCESTOR_CLASS = 'print-sheet-ancestor';
/** ธงที่ <body> ระหว่างสั่งพิมพ์ */
const PRINT_ACTIVE_CLASS = 'print-sheet-active';
/** ตัวแปร CSS ที่ใช้ย่อเอกสารให้พอดี 1 หน้า */
const FIT_ZOOM_VAR = '--print-fit-zoom';

const CSS_PX_PER_INCH = 96;
const MM_PER_INCH = 25.4;

/**
 * ขนาดกระดาษ A4 เต็มใบ (ใช้ร่วมกับ @page ของ printHelper)
 * แนวตั้ง  : @page margin 0 -> เอกสารกว้างเต็ม 210mm สูงได้เต็ม 297mm
 *            (ขอบสารบรรณอยู่ใน padding ของการ์ดเอกสารเอง)
 * แนวนอน  : @page margin 15mm -> กว้าง 267mm สูง 180mm (ทะเบียนคุมหลายหน้า)
 */
const PAGE_SIZE = {
  portrait: { widthMm: 210, heightMm: 297 },
  landscape: { widthMm: 267, heightMm: 180 }
};

function pxToMm(px: number): number {
  return (px * MM_PER_INCH) / CSS_PX_PER_INCH;
}

/**
 * วัดความสูงจริงของเอกสารเมื่ออยู่ใน "สภาพพร้อมพิมพ์"
 * (คง padding/ขอบเดิมของการ์ดเอกสารไว้ แล้ววัดบนความกว้างเท่ากระดาษจริง
 * เพื่อให้ได้ความสูงรวมขอบที่ตรงกับตอนพิมพ์ ไม่ใช่ความสูงเนื้อหาเพียว ๆ)
 * ใช้สำเนาที่ซ่อนไว้ จึงไม่กระทบเอกสารบนจอ
 */
function measurePrintHeightMm(element: HTMLElement, pageWidthMm: number): number {
  const holder = document.createElement('div');
  holder.setAttribute('data-print-measure', 'true');
  holder.style.cssText = [
    'position:absolute',
    'left:-100000px',
    'top:0',
    `width:${pageWidthMm}mm`,
    'padding:0',
    'margin:0',
    'box-sizing:border-box',
    'background:#ffffff',
    'color:#000000',
    'visibility:hidden',
    'pointer-events:none'
  ].join(';');

  const clone = element.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.style.width = '100%';
  clone.style.minWidth = '0';
  clone.style.maxWidth = '100%';
  // คง padding/margin เดิมของการ์ด (ขอบสารบรรณ) ไว้เพื่อให้วัดรวมขอบจริง
  clone.style.height = 'auto';
  clone.style.minHeight = '0';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.transform = 'none';
  clone.style.zoom = '1';

  holder.appendChild(clone);
  document.body.appendChild(holder);

  const heightPx = clone.getBoundingClientRect().height;
  document.body.removeChild(holder);

  return pxToMm(heightPx);
}

/**
 * คำนวณอัตราการย่อเพื่อให้เอกสารทั้งหมดจบใน 1 หน้า
 * (วัดรวมขอบ/ความสูงจริงของเอกสาร แล้วเผื่อขอบปลอดภัย ~1.5%
 * กันเศษทศนิยมของเบราว์เซอร์ดันเนื้อหาล้นไปหน้า 2)
 * คืนค่า 1 = ไม่ต้องย่อ เมื่อเอกสารพอดีหน้าอยู่แล้ว
 */
function computeFitZoom(element: HTMLElement, orientation: 'portrait' | 'landscape'): number {
  const page = orientation === 'landscape' ? PAGE_SIZE.landscape : PAGE_SIZE.portrait;
  // วัดจากการ์ดเอกสารจริง (ที่ล็อก height: 297mm แบบเดียวกับตอนพิมพ์)
  // ถ้าวัดจากการ์ดไม่ได้ (clone สูงผิดปกติเพราะ flex/height) ให้ fallback เป็น scrollHeight ของเนื้อหา
  let contentHeightMm = measurePrintHeightMm(element, page.widthMm);

  if (!contentHeightMm || contentHeightMm > page.heightMm * 1.6) {
    const fallbackPx = element.scrollHeight || element.getBoundingClientRect().height;
    if (fallbackPx > 0) {
      contentHeightMm = pxToMm(fallbackPx);
    }
  }

  // พื้นที่พิมพ์จริง = เต็มหน้า A4 หักขอบปลอดภัย ~2% (359.6mm/297mm -> เผื่อปัดเศษ/ฟอนต์โตกว่าต้นฉบับ)
  const usableHeightMm = page.heightMm * 0.98;

  if (!contentHeightMm || contentHeightMm <= usableHeightMm) return 1;

  // เอกสารแนวตั้งทุกใบ บีบให้จบหน้าเดียวเหมือนไฟล์ PDF (ย่อได้ถึง 45% กันเนื้อหายาวล้น)
  return Math.max(0.45, usableHeightMm / contentHeightMm);
}


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

  // NOTE: ไม่แสดงชื่อเอกสารบนหัวกระดาษของเบราว์เซอร์
  // (หัวกระดาษวันที่/เวลา + ชื่อเอกสาร + URL มาจากตัวเลือก "ส่วนหัวและส่วนท้าย"
  // ของหน้าต่างพิมพ์) จึงล้าง document.title ชั่วคราวขณะพิมพ์ เพื่อให้ช่อง
  // ชื่อเอกสารบนหัวกระดาษว่าง แล้วค่อยคืนค่าหลังพิมพ์เสร็จ
  const originalTitle = document.title;
  let titleBlanked = false;
  if (document.title.trim() !== '') {
    document.title = ' ';
    titleBlanked = true;
  }

  // Add the "printable-document" class to ensure it displays correctly during print
  const shouldAddPrintableClass = options.addPrintableClass !== false;
  const hadClass = element.classList.contains('printable-document');
  if (shouldAddPrintableClass && !hadClass) {
    element.classList.add('printable-document');
  }

  // Mark the whole printable chain so that everything else in the app is
  // collapsed during print and the document always starts on page 1.
  const markedNodes = markPrintChain(element);

  const orientation: 'portrait' | 'landscape' = options.orientation === 'landscape' ? 'landscape' : 'portrait';

  // Fit the whole document (header, body, signatures and details) into a single page
  // so that no trailing block spills over to page 2 — เปิดเป็นค่าเริ่มต้นเสมอ
  // ยกเว้นเอกสารหลายหน้าตามธรรมชาติ (ทะเบียนคุม landscape / โหมดพิมพ์รวม) ที่ส่ง fitToPage: false มาชัดเจน
  const shouldFitToPage = options.fitToPage !== false && orientation !== 'landscape';
  let appliedFitZoom = false;
  if (shouldFitToPage) {
    const fitZoom = computeFitZoom(element, orientation);
    document.documentElement.style.setProperty(FIT_ZOOM_VAR, fitZoom.toFixed(4));
    appliedFitZoom = true;
  }

  // Handle landscape orientation printing explicitly by adding temporary page style
  // portrait  : size A4 portrait + margin 0 -> ขอบกระดาษใช้ padding ในการ์ดเอกสารแทน
  //             กันส่วนหัว/ท้ายเบราว์เซอร์ (วันที่/ชื่อเอกสาร/URL) ไม่ให้พิมพ์ออกมา
  // landscape : margin 15mm (ทะเบียนคุมหลายหน้า)
  let styleSheet: HTMLStyleElement | null = null;
  if (orientation === 'landscape') {
    styleSheet = document.createElement('style');
    styleSheet.innerHTML = `@page { size: A4 landscape; margin: 15mm; }`;
    document.head.appendChild(styleSheet);
  } else {
    styleSheet = document.createElement('style');
    styleSheet.innerHTML = `@page { size: A4 portrait; margin: 0; }`;
    document.head.appendChild(styleSheet);
  }

  let restored = false;
  const restoreState = () => {
    if (restored) return;
    restored = true;

    if (titleBlanked) {
      document.title = originalTitle;
    }
    if (shouldAddPrintableClass && !hadClass) {
      element.classList.remove('printable-document');
    }
    unmarkPrintChain(markedNodes);
    if (appliedFitZoom) {
      document.documentElement.style.removeProperty(FIT_ZOOM_VAR);
    }
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
