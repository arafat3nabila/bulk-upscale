export type UpscaleFactor = 2 | 4;

export type ProcessingStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'error' | 'canceled';

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  width: number;
  height: number;
  size: number;
  status: ProcessingStatus;
  progress: number;
  scaleFactor: UpscaleFactor;
  outputUrl?: string;
  outputBlob?: Blob;
  outputWidth?: number;
  outputHeight?: number;
  outputSize?: number;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface AppSettings {
  backendUrl: string;
  apiEndpoint: string;
  defaultScaleFactor: UpscaleFactor;
  concurrency: number;
  hfToken?: string;
}

export interface BatchStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  error: number;
  totalOriginalSize: number;
  totalOutputSize: number;
}
