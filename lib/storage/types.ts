export type StorageBackend = {
  putObject(key: string, data: Buffer, mimeType: string): Promise<void>;
  getObject(key: string): Promise<Buffer | null>;
  deleteObject(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
};
