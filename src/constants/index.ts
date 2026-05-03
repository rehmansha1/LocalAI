import { Platform } from 'react-native';
import { ModelConfig } from '../types';

export const COLORS = {
  bg: '#09090d',
  surface: '#111118',
  surfaceHigh: '#16161f',
  border: '#1f1f2d',
  borderLight: '#2a2a3a',
  accent: '#4f8ef7',
  accentDim: '#1b2b4a',
  vision: '#a78bfa',
  text: '#e0e0ee',
  textSub: '#888899',
  muted: '#44445a',
  success: '#888899',
  warn: '#bfa76a',
  danger: '#b07a7a',
};

export const FONT_FAMILY = Platform.select({

  default: 'sans-serif',
});

export const APP_FONT = { fontFamily: FONT_FAMILY } as const;

export const SYSTEM_PROMPT =
  'You are a smart, helpful assistant. ' +
  'Give detailed, accurate, and useful answers. ' +
  'Think step by step when answering complex questions.';

let _modelsDir: string | null = null;

export const setModelsDir = (dir: string) => {
  _modelsDir = dir;
};

export const getModelsDir = () => _modelsDir;

export const MODELS: Record<string, ModelConfig> = {
  text: {
    id: 'text',
    name: 'Llama 3.2',
    badge: '3B · Text',
    description: 'Fast, capable text assistant. Ideal for writing, Q&A, reasoning.',
    icon: '⚡',
    color: '#4f8ef7',
    url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf?download=true',
    path: () => `${_modelsDir!}/llama-3.2-3b-q4.gguf`,
    filename: 'llama-3.2-3b-q4.gguf',
    minSize: 1_500_000_000,
    sizeMB: 2100,
    supportsVision: false,
    nCtx: 8192,
    nGpuLayers: 0,
    nThreads: 4,
  },
  vision: {
    id: 'vision',
    name: 'Gemma 3',
    badge: '4B · Vision',
    description: 'Understands images + text. Send photos for analysis, OCR, and more.',
    icon: '👁',
    color: '#a78bfa',
    url: 'https://huggingface.co/bartowski/google_gemma-3-4b-it-GGUF/resolve/main/google_gemma-3-4b-it-Q4_K_M.gguf?download=true',
    mmprojUrl: 'https://huggingface.co/bartowski/google_gemma-3-4b-it-GGUF/resolve/main/mmproj-google_gemma-3-4b-it-f16.gguf?download=true',
    path: () => `${_modelsDir!}/gemma-3-4b-vision.gguf`,
    mmprojPath: () => `${_modelsDir!}/gemma-3-4b-mmproj.gguf`,
    filename: 'gemma-3-4b-vision.gguf',
    mmprojFilename: 'gemma-3-4b-mmproj.gguf',
    minSize: 2_000_000_000,
    sizeMB: 2600,
    supportsVision: true,
    nCtx: 4096,
    nGpuLayers: 0,
    nThreads: 4,
  },
};
