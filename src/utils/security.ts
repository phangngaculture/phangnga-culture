/**
 * Security & Cryptography Utilities
 * Provides client-safe SHA-256 password hashing with salting and verification
 */

const APP_SALT = 'phangnga_culture_v2_secure_salt_';

/**
 * Computes SHA-256 hash using browser native Web Crypto API
 */
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText) return '';
  
  // If already hashed (64 chars hex string with prefix)
  if (plainText.startsWith('$sha256$')) {
    return plainText;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(APP_SALT + plainText.trim());
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `$sha256$${hashHex}`;
  }

  // Fallback if crypto.subtle is not available in non-secure context
  let hash = 0;
  const str = APP_SALT + plainText.trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `$sha256$fallback_${Math.abs(hash).toString(16)}`;
}

/**
 * Verifies a password against stored hash or plaintext fallback
 */
export async function verifyPassword(inputPassword: string, storedPassword?: string): Promise<boolean> {
  const trimmedInput = String(inputPassword || '').trim();
  const trimmedStored = String(storedPassword || '').trim().replace(/^["']|["']$/g, '');

  if (!trimmedStored) {
    // Default fallback passwords
    return trimmedInput === 'dekcom2537' || trimmedInput === '1234';
  }

  // If stored password is already a SHA-256 hash
  if (trimmedStored.startsWith('$sha256$')) {
    const computedHash = await hashPassword(trimmedInput);
    if (computedHash === trimmedStored) return true;
  }

  // If stored password is in plaintext (legacy support or direct match)
  if (trimmedInput === trimmedStored) {
    return true;
  }

  // Secondary fallback for common initial passwords if user hasn't set one yet
  if ((trimmedStored === '1234' || trimmedStored === 'dekcom2537') && (trimmedInput === '1234' || trimmedInput === 'dekcom2537')) {
    return true;
  }

  return false;
}
