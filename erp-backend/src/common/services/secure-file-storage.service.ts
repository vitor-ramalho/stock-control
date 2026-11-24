export interface StoredFileMetadata {
  storageKey: string;
  mimeType: string;
  size: number;
}

export abstract class SecureFileStorageService {
  abstract save(
    relativePath: string,
    content: Buffer,
    mimeType: string,
  ): Promise<StoredFileMetadata>;

  abstract remove(storageKey: string): Promise<void>;
}
