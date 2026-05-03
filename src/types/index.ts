export type ModelId = 'text' | 'vision';
export type AppPhase = 'checking' | 'downloading' | 'loading' | 'chat' | 'error';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUri?: string;
  pending?: boolean;
}

export interface DownloadState {
  progress: number;
  downloadedMB: number;
  totalMB: number;
  label: string;
}

export interface ModelConfig {
  id: ModelId;
  name: string;
  badge: string;
  description: string;
  icon: string;
  color: string;
  url: string;
  path: () => string;
  filename: string;
  minSize: number;
  sizeMB: number;
  supportsVision: boolean;
  nCtx: number;
  nGpuLayers: number;
  nThreads: number;
  mmprojUrl?: string;
  mmprojPath?: () => string;
  mmprojFilename?: string;
}
