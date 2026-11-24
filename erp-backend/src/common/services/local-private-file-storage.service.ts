import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import {
  SecureFileStorageService,
  StoredFileMetadata,
} from './secure-file-storage.service';

@Injectable()
export class LocalPrivateFileStorageService implements SecureFileStorageService {
  private readonly rootPath: string;

  constructor() {
    this.rootPath = process.env.SECURE_FILES_ROOT || '/var/lib/stock-control/private-files';
  }

  async save(
    relativePath: string,
    content: Buffer,
    mimeType: string,
  ): Promise<StoredFileMetadata> {
    const targetPath = join(this.rootPath, relativePath);
    await fs.mkdir(dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, content);

    return {
      storageKey: relativePath,
      mimeType,
      size: content.length,
    };
  }

  async remove(storageKey: string): Promise<void> {
    const targetPath = join(this.rootPath, storageKey);
    await fs.rm(targetPath, { force: true });
  }
}
