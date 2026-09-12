/**
 * Voice & Audio Alerts Engine for M-Culture Phangnga Fleet Management
 * Supports Web Audio API harmonic chimes and Web Speech API Thai Text-to-Speech (TTS)
 */

export interface VoiceSettings {
  enabled: boolean;
  chimeEnabled: boolean;
  voiceVolume: number; // 0.0 to 1.0
  voiceRate: number; // 0.8 to 1.3
  voicePitch: number; // 0.8 to 1.2
  speakNewBooking: boolean;
  speakApproval: boolean;
  speakMission: boolean;
  speakInspection: boolean;
  preferredVoiceURI?: string;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  chimeEnabled: true,
  voiceVolume: 1.0,
  voiceRate: 1.0,
  voicePitch: 1.0,
  speakNewBooking: true,
  speakApproval: true,
  speakMission: true,
  speakInspection: true
};

const VOICE_SETTINGS_STORAGE_KEY = 'mculture_voice_alerts_settings';

/**
 * Load voice settings from localStorage
 */
export function getVoiceSettings(): VoiceSettings {
  if (typeof window === 'undefined') return DEFAULT_VOICE_SETTINGS;
  try {
    const raw = localStorage.getItem(VOICE_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_VOICE_SETTINGS;
    return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
}

/**
 * Save voice settings to localStorage
 */
export function saveVoiceSettings(settings: VoiceSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOICE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save voice settings:', err);
  }
}

/**
 * Check if Web Speech API is supported
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Get available Thai voices on this device/browser
 */
export function getAvailableThaiVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  try {
    const voices = window.speechSynthesis.getVoices();
    return voices.filter(
      (v) =>
        v.lang.toLowerCase().includes('th') ||
        v.name.toLowerCase().includes('thai') ||
        v.lang === 'th-TH' ||
        v.lang === 'th_TH'
    );
  } catch {
    return [];
  }
}

/**
 * Play a high-fidelity Web Audio chime (Bell / Crystal / Fanfare)
 */
export function playChimeSound(
  type: 'crystal' | 'fanfare' | 'gentle' | 'alert' = 'crystal',
  volume: number = 0.8
): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume * 0.3)), now);
    masterGain.connect(ctx.destination);

    if (type === 'crystal') {
      // 3-tone rising crystal chime (G5 -> C6 -> E6)
      const notes = [783.99, 1046.5, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        noteGain.gain.setValueAtTime(0, now + idx * 0.09);
        noteGain.gain.linearRampToValueAtTime(0.3, now + idx * 0.09 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.55);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.6);
      });
    } else if (type === 'fanfare') {
      // Majestic 4-tone approval fanfare chime (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        noteGain.gain.setValueAtTime(0, now + idx * 0.1);
        noteGain.gain.linearRampToValueAtTime(0.35, now + idx * 0.1 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.7);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.75);
      });
    } else if (type === 'alert') {
      // 2-tone soft warning chime
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(349.23, now + 0.15);

      noteGain.gain.setValueAtTime(0.2, now);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.45);
    } else {
      // Gentle soft notification ping
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      noteGain.gain.setValueAtTime(0.25, now);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    // Ignore audio context errors if browser blocks auto-play
  }
}

/**
 * Format ID for Thai speech synthesizer so it speaks each digit cleanly
 */
export function formatCodeForSpeech(code: string): string {
  if (!code) return '';
  return code
    .replace(/CAR-/gi, 'ซี เอ อาร์ ')
    .replace(/FL-/gi, 'เอฟ แอล ')
    .replace(/พง\s*๐๐๓๒\(พิเศษ\)\/ว\s*/g, 'เลขที่ ')
    .replace(/[0-9]/g, (d) => ` ${d} `);
}

/**
 * Clean Thai text for natural TTS pronunciation
 */
export function sanitizeThaiSpeechText(text: string): string {
  return text
    .replace(/ผอ\./g, 'ผู้อำนวยการ')
    .replace(/กม\./g, 'กิโลเมตร')
    .replace(/น\./g, 'นาฬิกา')
    .replace(/จ\./g, 'จังหวัด')
    .replace(/อ\./g, 'อำเภอ')
    .replace(/ต\./g, 'ตำบล')
    .replace(/สนง\./g, 'สำนักงาน')
    .replace(/วธ\./g, 'กระทรวงวัฒนธรรม');
}

/**
 * Speak Thai text using Web Speech API with optional chime preamble
 */
export function speakThai(
  text: string,
  options?: {
    chime?: 'crystal' | 'fanfare' | 'gentle' | 'alert' | false;
    force?: boolean;
    onEnd?: () => void;
  }
): void {
  const settings = getVoiceSettings();

  // If globally disabled and not forced, return
  if (!settings.enabled && !options?.force) return;

  // Play chime if enabled
  const chimeType = options?.chime !== undefined ? options.chime : 'crystal';
  if (settings.chimeEnabled && chimeType) {
    playChimeSound(chimeType, settings.voiceVolume);
  }

  if (!isSpeechSynthesisSupported()) return;

  try {
    // Cancel previous speaking to prevent overlapping speech queue
    window.speechSynthesis.cancel();

    const cleanedText = sanitizeThaiSpeechText(text);
    const utterance = new SpeechSynthesisUtterance(cleanedText);

    utterance.lang = 'th-TH';
    utterance.rate = Math.max(0.7, Math.min(1.4, settings.voiceRate || 1.0));
    utterance.pitch = Math.max(0.7, Math.min(1.3, settings.voicePitch || 1.0));
    utterance.volume = Math.max(0.1, Math.min(1.0, settings.voiceVolume || 1.0));

    // Try finding the best Thai voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(
      (v) =>
        (settings.preferredVoiceURI && v.voiceURI === settings.preferredVoiceURI) ||
        (v.lang === 'th-TH' && (v.name.includes('Kanya') || v.name.includes('Narisa') || v.name.includes('Siri') || v.name.includes('Google')))
    );

    if (!selectedVoice) {
      selectedVoice = voices.find(
        (v) => v.lang.toLowerCase().startsWith('th') || v.name.toLowerCase().includes('thai')
      );
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    if (options?.onEnd) {
      utterance.onend = () => options.onEnd?.();
      utterance.onerror = () => options.onEnd?.();
    }

    // Delay slightly if chime was played, so chime and speech don't muddle
    const delay = settings.chimeEnabled && chimeType ? 320 : 50;
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis speak error:', e);
      }
    }, delay);
  } catch (err) {
    console.warn('Speech synthesis failed:', err);
  }
}

/**
 * Stop any ongoing speech
 */
export function stopVoiceAlert(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * Event-Driven Announcement Helpers
 */

/**
 * Announce when a new booking request is submitted
 */
export function announceNewBooking(booking: {
  id: string;
  name?: string;
  purpose?: string;
  carName?: string;
  destination?: string;
}): void {
  const settings = getVoiceSettings();
  if (!settings.enabled || !settings.speakNewBooking) return;

  const requester = booking.name ? `จากคุณ ${booking.name}` : '';
  const speechText = `มีคำขอใช้รถยนต์ราชการใหม่ ${requester} หมายเลข ${formatCodeForSpeech(
    booking.id
  )} เพื่อ ${booking.purpose || 'ปฏิบัติภารกิจ'}`;

  speakThai(speechText, { chime: 'crystal' });
}

/**
 * Announce when a booking is officially approved & signed
 */
export function announceBookingApproved(booking: {
  id: string;
  name?: string;
  carName?: string;
  approvedBy?: string;
}): void {
  const settings = getVoiceSettings();
  if (!settings.enabled || !settings.speakApproval) return;

  const speechText = `ใบขอใช้รถราชการ หมายเลข ${formatCodeForSpeech(
    booking.id
  )} ได้รับการอนุมัติและลงนามเรียบร้อยแล้ว ยานพาหนะพร้อมสำหรับการเดินทาง`;

  speakThai(speechText, { chime: 'fanfare' });
}

/**
 * Announce when a booking is rejected / returned
 */
export function announceBookingRejected(booking: { id: string; comment?: string }): void {
  const settings = getVoiceSettings();
  if (!settings.enabled || !settings.speakApproval) return;

  const speechText = `ใบขอใช้รถ หมายเลข ${formatCodeForSpeech(
    booking.id
  )} ไม่ได้รับการอนุมัติ กรุณาตรวจสอบข้อคิดเห็นในระบบ`;

  speakThai(speechText, { chime: 'alert' });
}

/**
 * Announce when a driver begins a mission
 */
export function announceMissionStarted(booking: { id: string; carName?: string }): void {
  const settings = getVoiceSettings();
  if (!settings.enabled || !settings.speakMission) return;

  const vehicleInfo = booking.carName ? `รถ ${booking.carName}` : 'รถยนต์ราชการ';
  const speechText = `${vehicleInfo} เริ่มออกปฏิบัติภารกิจแล้ว ขอให้เดินทางโดยสวัสดิภาพ`;

  speakThai(speechText, { chime: 'gentle' });
}

/**
 * Announce when a driver completes a mission
 */
export function announceMissionCompleted(booking: { id: string; totalDistance?: number }): void {
  const settings = getVoiceSettings();
  if (!settings.enabled || !settings.speakMission) return;

  const distanceText = booking.totalDistance ? ` ระยะทางรวม ${booking.totalDistance} กิโลเมตร` : '';
  const speechText = `ภารกิจหมายเลข ${formatCodeForSpeech(
    booking.id
  )} เสร็จสิ้นเรียบร้อยแล้ว${distanceText} บันทึกข้อมูลลงระบบแล้ว`;

  speakThai(speechText, { chime: 'gentle' });
}

/**
 * Announce when logistics officer finishes vehicle inspection
 */
export function announceAssetInspection(booking: { id: string; inspectorName?: string }): void {
  const settings = getVoiceSettings();
  if (!settings.enabled || !settings.speakInspection) return;

  const speechText = `เจ้าหน้าที่พัสดุได้ตรวจรับสภาพรถยนต์ สำหรับใบขอใช้รถ ${formatCodeForSpeech(
    booking.id
  )} เรียบร้อยแล้ว`;

  speakThai(speechText, { chime: 'gentle' });
}

/**
 * Test voice alert types interactively from UI
 */
export function testVoiceAlert(
  type: 'new_booking' | 'approved' | 'rejected' | 'mission_started' | 'mission_completed'
): void {
  switch (type) {
    case 'new_booking':
      speakThai(
        'ทดสอบเสียงระบบ: มีคำขอใช้รถยนต์ราชการใหม่ จากคุณนริศรา หมายเลข ซี เอ อาร์ 69001 เพื่อปฏิบัติราชการ',
        { chime: 'crystal', force: true }
      );
      break;
    case 'approved':
      speakThai(
        'ทดสอบเสียงระบบ: ใบขอใช้รถราชการ หมายเลข ซี เอ อาร์ 69001 ได้รับการอนุมัติและลงนามเรียบร้อยแล้ว ยานพาหนะพร้อมสำหรับการเดินทาง',
        { chime: 'fanfare', force: true }
      );
      break;
    case 'rejected':
      speakThai(
        'ทดสอบเสียงระบบ: ใบขอใช้รถ หมายเลข ซี เอ อาร์ 69001 ไม่ได้รับการอนุมัติ กรุณาตรวจสอบข้อคิดเห็น',
        { chime: 'alert', force: true }
      );
      break;
    case 'mission_started':
      speakThai(
        'ทดสอบเสียงระบบ: รถยนต์ส่วนกลาง โตโยต้า คัมรี่ เริ่มออกปฏิบัติภารกิจแล้ว ขอให้เดินทางโดยสวัสดิภาพ',
        { chime: 'gentle', force: true }
      );
      break;
    case 'mission_completed':
      speakThai(
        'ทดสอบเสียงระบบ: ภารกิจหมายเลข ซี เอ อาร์ 69001 เสร็จสิ้นเรียบร้อยแล้ว บันทึกข้อมูลลงระบบแล้ว',
        { chime: 'gentle', force: true }
      );
      break;
  }
}
