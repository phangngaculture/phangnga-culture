// Thai date formatting and audio alert utilities

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export function formatThaiDate(dateStr: string, format: 'full' | 'short' | 'official' = 'full'): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;

  const year = parseInt(parts[0], 10) + 543;
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (format === 'short') {
    return `${day} ${THAI_MONTHS_SHORT[monthIdx]} ${year}`;
  }

  if (format === 'official') {
    // Official memo format: e.g. "๕ กันยายน ๒๕๖๙" or standard numbers "5 กันยายน 2569"
    return `${day} ${THAI_MONTHS_FULL[monthIdx]} ${year}`;
  }

  return `${day} ${THAI_MONTHS_FULL[monthIdx]} พ.ศ. ${year}`;
}

export function formatThaiTime(timeStr?: string): string {
  if (!timeStr) return '-';
  // If time is HH:MM or HH:MM:SS
  const trimmed = timeStr.trim();
  if (trimmed.endsWith('น.')) return trimmed;
  return `${trimmed} น.`;
}

export function formatThaiDateTime(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return '-';
  const dateFormatted = formatThaiDate(dateStr, 'short');
  if (!timeStr) return dateFormatted;
  return `${dateFormatted} เวลา ${formatThaiTime(timeStr)}`;
}

export function formatThaiDateRange(startDateStr: string, endDateStr?: string): string {
  if (!startDateStr) return '-';
  if (!endDateStr || startDateStr === endDateStr) {
    return formatThaiDate(startDateStr, 'full');
  }

  const startParts = startDateStr.split('-');
  const endParts = endDateStr.split('-');
  if (startParts.length < 3 || endParts.length < 3) {
    return `${formatThaiDate(startDateStr, 'short')} - ${formatThaiDate(endDateStr, 'short')}`;
  }

  const sYear = parseInt(startParts[0], 10) + 543;
  const sMonth = parseInt(startParts[1], 10) - 1;
  const sDay = parseInt(startParts[2], 10);

  const eYear = parseInt(endParts[0], 10) + 543;
  const eMonth = parseInt(endParts[1], 10) - 1;
  const eDay = parseInt(endParts[2], 10);

  if (sYear === eYear && sMonth === eMonth) {
    return `${sDay} - ${eDay} ${THAI_MONTHS_FULL[sMonth]} พ.ศ. ${sYear}`;
  }

  if (sYear === eYear) {
    return `${sDay} ${THAI_MONTHS_SHORT[sMonth]} - ${eDay} ${THAI_MONTHS_SHORT[eMonth]} พ.ศ. ${sYear}`;
  }

  return `${formatThaiDate(startDateStr, 'short')} - ${formatThaiDate(endDateStr, 'short')}`;
}

export function toThaiNumerals(text: string | number): string {
  const thaiNums = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(text).replace(/[0-9]/g, (digit) => thaiNums[parseInt(digit, 10)]);
}

export function playAppSound(type: 'success' | 'alert' | 'click', enabled: boolean = true): void {
  if (!enabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'alert') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(349.23, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch {
    // Ignore audio error if blocked by browser policy
  }
}
