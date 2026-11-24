import { LocalSecretCipherService } from './local-secret-cipher.service';

describe('LocalSecretCipherService', () => {
  const originalKey = process.env.SECRET_ENCRYPTION_KEY;

  afterEach(() => {
    process.env.SECRET_ENCRYPTION_KEY = originalKey;
  });

  it('encrypts and decrypts values', () => {
    process.env.SECRET_ENCRYPTION_KEY = 'this-is-a-very-strong-test-key-1234567890';

    const service = new LocalSecretCipherService();
    const encrypted = service.encrypt('super-secret-value');

    expect(encrypted).not.toContain('super-secret-value');

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe('super-secret-value');
  });
});
