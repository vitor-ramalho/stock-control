export interface EncryptedSecretPayload {
  version: string;
  iv: string;
  tag: string;
  value: string;
}

export abstract class SecretCipherService {
  abstract encrypt(plainText: string): string;
  abstract decrypt(payload: string): string;
}
