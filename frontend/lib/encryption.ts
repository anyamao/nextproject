// lib/encryption.ts
import JSEncrypt from "jsencrypt";

// Публичный ключ бэкенда (для шифрования)
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
-----END PUBLIC KEY-----`;

export function encryptPassword(password: string): string {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(PUBLIC_KEY);
  return encryptor.encrypt(password) || password;
}
