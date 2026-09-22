import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;

function getKey() {
  const base = process.env.CONFIG_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!base) throw new Error('CONFIG_ENCRYPTION_KEY or JWT_SECRET must be set');
  return crypto.createHash('sha256').update(base).digest().subarray(0, KEY_LEN);
}

export function encrypt(plaintext) {
  if (plaintext == null || plaintext === '') return null;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ciphertext, tag]).toString('base64');
}

export function decrypt(ciphertextB64) {
  if (!ciphertextB64) return null;
  const key = getKey();
  const buf = Buffer.from(ciphertextB64, 'base64');
  if (buf.length < IV_LEN + TAG_LEN) return null;
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(buf.length - TAG_LEN);
  const ciphertext = buf.subarray(IV_LEN, buf.length - TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

export function redact(obj, keys = ['key', 'secret', 'password', 'token', 'hash', 'apiKey', 'webhookSecret']) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const k of Object.keys(clone)) {
    if (keys.some((s) => k.toLowerCase().includes(s.toLowerCase()))) {
      clone[k] = '[REDACTED]';
    } else if (typeof clone[k] === 'object') {
      clone[k] = redact(clone[k], keys);
    }
  }
  return clone;
}