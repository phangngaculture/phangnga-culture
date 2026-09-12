const THAI_MONTHS_LONG = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

export function formatThaiDate(
  dateInput: string | Date | undefined,
  style: 'short' | 'medium' | 'long' | 'full' | 'official' = 'medium'
): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  
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
  startDateStr: string | Date,
  endDateStr: string | Date | undefined
): string {
  if (!startDateStr) return '';
  const start = typeof startDateStr === 'string' ? new Date(startDateStr) : startDateStr;
  if (isNaN(start.getTime())) return '';
  
  if (!endDateStr) {
    return formatThaiDate(start, 'medium');
  }
  
  const end = typeof endDateStr === 'string' ? new Date(endDateStr) : endDateStr;
  if (isNaN(end.getTime())) {
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

export function playAppSound(type: string, enabled: boolean = true) {
  if (!enabled) return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
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
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}
