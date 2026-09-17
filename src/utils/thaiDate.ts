const THAI_MONTHS_LONG = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

function parseDateSafe(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === 'object' && val !== null) {
    if (typeof val.toDate === 'function') {
      try {
        const d = val.toDate();
        return d && !isNaN(d.getTime()) ? d : null;
      } catch {
        // fallback
      }
    }
    if ('seconds' in val && typeof val.seconds === 'number') {
      const d = new Date(val.seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
    if ('_seconds' in val && typeof val._seconds === 'number') {
      const d = new Date(val._seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
  }
  if (typeof val === 'string') {
    const clean = val.includes('T') ? val.split('T')[0] : val;
    const d = new Date(clean);
    return isNaN(d.getTime()) ? null : d;
  }
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function formatThaiDate(
  dateInput: any,
  style: 'short' | 'medium' | 'long' | 'full' | 'official' = 'medium'
): string {
  const d = parseDateSafe(dateInput);
  if (!d) return '';
  
  const date = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear() + 543;
  const dayOfWeek = d.getDay();
  
  const DAYS_LONG = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
  
  if (style === 'short') {
    return `${date} ${THAI_MONTHS_SHORT[month]} ${String(year).slice(-2)}`;
  }
  if (style === 'medium') {
    return `${date} ${THAI_MONTHS_SHORT[month]} ${year}`;
  }
  if (style === 'full') {
    return `วัน${DAYS_LONG[dayOfWeek]}ที่ ${date} ${THAI_MONTHS_LONG[month]} พ.ศ. ${year}`;
  }
  if (style === 'official') {
    return `${date} ${THAI_MONTHS_LONG[month]} ${year}`;
  }
  return `${date} ${THAI_MONTHS_LONG[month]} ${year}`;
}

export function formatThaiDateRange(
  startDateStr: any,
  endDateStr: any
): string {
  const start = parseDateSafe(startDateStr);
  if (!start) return '';
  
  const end = parseDateSafe(endDateStr);
  if (!end) {
    return formatThaiDate(start, 'medium');
  }
  
  // If same day
  if (start.toDateString() === end.toDateString()) {
    return formatThaiDate(start, 'medium');
  }
  
  const startDay = start.getDate();
  const startMonth = start.getMonth();
  const startYear = start.getFullYear() + 543;
  
  const endDay = end.getDate();
  const endMonth = end.getMonth();
  const endYear = end.getFullYear() + 543;
  
  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${THAI_MONTHS_SHORT[startMonth]} ${startYear}`;
    } else {
      return `${startDay} ${THAI_MONTHS_SHORT[startMonth]} - ${endDay} ${THAI_MONTHS_SHORT[endMonth]} ${startYear}`;
    }
  } else {
    return `${formatThaiDate(start, 'short')} - ${formatThaiDate(end, 'short')}`;
  }
}

export function formatThaiTime(timeStr: string): string {
  if (!timeStr) return '';
  if (timeStr.includes('น.')) return timeStr;
  const cleaned = timeStr.replace(':', '.');
  return `${cleaned} น.`;
}

export function toThaiNumerals(num: number | string): string {
  const arabicDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  const str = String(num);
  return str.split('').map(char => {
    const idx = arabicDigits.indexOf(char);
    return idx !== -1 ? thaiDigits[idx] : char;
  }).join('');
}

let sharedAudioCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      sharedAudioCtx = new AudioCtxClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playAppSound(type: string, enabled: boolean = true) {
  if (!enabled) return;
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(330, ctx.currentTime); // E4
      osc.frequency.setValueAtTime(220, ctx.currentTime + 0.15); // A3
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'click') {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'type') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {
    // Ignore silent audio errors
  }
}
