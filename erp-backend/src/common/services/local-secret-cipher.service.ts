import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { EncryptedSecretPayload, SecretCipherService } from './secret-cipher.service';

const CIPHER_ALGORITHM = 'aes-256-gcm';
const PAYLOAD_VERSION = 'v1';

@Injectable()
export class LocalSecretCipherService implements SecretCipherService {
  private readonly key: Buffer;

  constructor() {
    const source = process.env.SECRET_ENCRYPTION_KEY;
    if (!source || source.trim().length < 32) {
      throw new InternalServerErrorException(
        'SECRET_ENCRYPTION_KEY is required and must be at least 32 chars',
      );
    }

    this.key = createHash('sha256').update(source, 'utf8').digest();
  }

  encrypt(plainText: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(CIPHER_ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);

    const payload: EncryptedSecretPayload = {
      version: PAYLOAD_VERSION,
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      value: encrypted.toString('base64'),
    };

    return JSON.stringify(payload);
  }

  decrypt(payload: string): string {
    const parsed = JSON.parse(payload) as EncryptedSecretPayload;
    if (parsed.version !== PAYLOAD_VERSION) {
      throw new InternalServerErrorException('Unsupported encrypted payload version');
    }

    const decipher = createDecipheriv(
      CIPHER_ALGORITHM,
      this.key,
      Buffer.from(parsed.iv, 'base64'),
    );

    decipher.setAuthTag(Buffer.from(parsed.tag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(parsed.value, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
