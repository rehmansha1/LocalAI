import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { getModelsDir, setModelsDir } from '../constants';

export const ensureModelsDir = async (): Promise<void> => {
  if (getModelsDir()) return;
  await getModelsDirPath();
};

export const getModelsDirPath = async (): Promise<string> => {
  if (getModelsDir()) return getModelsDir()!;

  const candidates: string[] = Platform.OS === 'android'
    ? [
      `${RNFS.ExternalDirectoryPath}/LocalAI`,
      `${RNFS.DocumentDirectoryPath}/LocalAI`,
    ]
    : [`${RNFS.DocumentDirectoryPath}/LocalAI`];

  for (const dir of candidates) {
    try {
      const exists = await RNFS.exists(dir);
      if (!exists) await RNFS.mkdir(dir);
      const probe = `${dir}/.probe`;
      await RNFS.writeFile(probe, '1', 'utf8');
      await RNFS.unlink(probe);
      setModelsDir(dir);
      return dir;
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    'Could not create a writable models directory.\n' +
    'Make sure the device has available storage.',
  );
};

export const getModelsDirDisplay = (): string => {
  const dir = getModelsDir();
  if (!dir) return 'LocalAI/';
  if (dir.includes('Android/data') || dir.includes('ExternalDirectory')) {
    return 'Android/data/<pkg>/files/LocalAI';
  }
  return 'App Documents/LocalAI';
};

export const requestStoragePermission = async (): Promise<boolean> => true;

export const getImageDataUrl = async (asset: any): Promise<string | null> => {
  try {
    if (asset.base64) {
      console.log('[Image] using base64 from picker');
      return `data:image/jpeg;base64,${asset.base64}`;
    }

    if (asset.uri) {
      const path = asset.uri.replace(/^file:\/\//, '');
      const b64 = await RNFS.readFile(path, 'base64');
      console.log('[Image] read base64 from file');
      return `data:image/jpeg;base64,${b64}`;
    }

    return null;
  } catch (e: any) {
    console.error('[Image] getImageDataUrl failed:', e?.message);
    return null;
  }
};
