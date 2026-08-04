import crypto from 'node:crypto';

const VERSION = 'v1';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const encodedKey = process.env.BANK_DATA_ENCRYPTION_KEY?.trim();
  if (!encodedKey) {
    throw new Error(
      'BANK_DATA_ENCRYPTION_KEY is required before storing banking data.',
    );
  }

  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      'BANK_DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key.',
    );
  }

  return key;
}

export function encryptSensitiveValue(value: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);
  const authenticationTag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString('base64url'),
    authenticationTag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
}
