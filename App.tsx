/**
 * LocalAI — Offline Android/iOS LLM Chat
 *
 * Models are saved to:
 *   Android → Internal Storage / LocalAI/   (/storage/emulated/0/LocalAI)
 *   iOS     → <App Documents>/LocalAI/
 *
 * AndroidManifest.xml — add inside <manifest>:
 *   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
 *   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
 *                    android:maxSdkVersion="29"/>
 *   <!-- Android 11+ broad file access (shows system dialog) -->
 *   <uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE"/>
 *
 * Extra deps:
 *   npm install react-native-image-picker
 *   (llama.rn, react-native-fs, react-native-device-info already assumed)
 */

import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, Dimensions, Modal, ScrollView, Image, Alert,
  SafeAreaView, Pressable,
} from 'react-native';
import { initLlama, LlamaContext } from 'llama.rn';
import RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';
import {
  launchCamera, launchImageLibrary, ImagePickerResponse, Asset,
} from 'react-native-image-picker';

// ─── Storage Directory ────────────────────────────────────────────────────────
// ExternalDirectoryPath  =  /storage/emulated/0/Android/data/<pkg>/files
// No permissions required on ANY Android version. Browseable via Files app:
//   Internal Storage → Android → data → <package> → files → LocalAI
//
// Falls back to DocumentDirectoryPath if external storage is unavailable
// (e.g. no SD card slot initialised).

let _modelsDir: string | null = null;

const getModelsDir = async (): Promise<string> => {
  if (_modelsDir) return _modelsDir;

  const candidates: string[] = Platform.OS === 'android'
    ? [

      `${RNFS.ExternalDirectoryPath}/LocalAI`,   // preferred — no permissions needed
      `${RNFS.DocumentDirectoryPath}/LocalAI`,   // private fallback
    ]
    : [`${RNFS.DocumentDirectoryPath}/LocalAI`];

  for (const dir of candidates) {
    try {
      const exists = await RNFS.exists(dir);
      if (!exists) await RNFS.mkdir(dir);
      // Quick write-test
      const probe = `${dir}/.probe`;
      await RNFS.writeFile(probe, '1', 'utf8');
      await RNFS.unlink(probe);
      _modelsDir = dir;
      return dir;
    } catch (_) {
      // try next candidate
    }
  }

  throw new Error(
    'Could not create a writable models directory.\n' +
    'Make sure the device has available storage.',
  );
};

/** Ensure the chosen models directory exists (call before any path access) */
const ensureModelsDir = async (): Promise<void> => { await getModelsDir(); };

/** Friendly label shown in the UI */
const getModelsDirDisplay = (): string => {
  if (!_modelsDir) return 'LocalAI/';
  if (_modelsDir.includes('Android/data') || _modelsDir.includes('ExternalDirectory')) {
    return 'Android/data/<pkg>/files/LocalAI';
  }
  return 'App Documents/LocalAI';
};

// ─── Storage permission ───────────────────────────────────────────────────────
// ExternalDirectoryPath needs NO runtime permission, so this is now a no-op.
// Kept as a hook in case you switch to a broader path later.
const requestStoragePermission = async (): Promise<boolean> => true;

// ─── Models Config ────────────────────────────────────────────────────────────
// path() helpers read _modelsDir which is set by ensureModelsDir() before use.

const MODELS = {
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
    nCtx: 2048,
    nGpuLayers: 0,
    nThreads: 4,
  },
  vision: {
    id: 'vision',
    name: 'LLaVA Phi-3',
    badge: 'Mini · Vision',
    description: 'Understands images + text. Send photos for analysis, OCR, and more.',
    icon: '👁',
    color: '#a78bfa',
// swap out the vision model URLs to this well-tested combo:
url: 'https://huggingface.co/mys/ggml_llava-v1.5-7b/resolve/main/ggml-model-q4_k.gguf',
mmprojUrl: 'https://huggingface.co/mys/ggml_llava-v1.5-7b/resolve/main/mmproj-model-f16.gguf',
    path: () => `${_modelsDir!}/llava-phi3-mini.gguf`,
    mmprojPath: () => `${_modelsDir!}/llava-phi3-mini-mmproj.gguf`,
    filename: 'llava-phi3-mini.gguf',
    mmprojFilename: 'llava-phi3-mini-mmproj.gguf',
    minSize: 800_000_000,
    sizeMB: 1800,
    supportsVision: true,
    nCtx: 8192,
    nGpuLayers: 0,
    nThreads: 4,
  },
} as const;

type ModelId = keyof typeof MODELS;

const SYSTEM_PROMPT =
  'You are a smart, helpful assistant. ' +
  'Give detailed, accurate, and useful answers. ' +
  'Think step by step when answering complex questions.';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppPhase = 'checking' | 'downloading' | 'loading' | 'chat' | 'error';

interface DownloadState {
  progress: number;
  downloadedMB: number;
  totalMB: number;
  label: string; // "Downloading model…" / "Downloading vision encoder…"
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUri?: string;
  pending?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Fix 1: Only inject <image> token for the CURRENT image ──────────────────
// Pass currentImageUri separately so buildPrompt knows which message is "now"

const buildPrompt = (
  messages: Message[],
  modelId: ModelId,
  currentImageUri?: string,   // ← add this param
): string => {
  if (modelId === 'vision') {
    // LLaVA 1.5 standard format with explicit instruction
    let prompt = `A chat between a curious user and an artificial intelligence assistant. The assistant is able to understand images and provide detailed analysis of them. The assistant gives helpful, detailed, and polite answers to the user's questions.\n\n`;
    for (const msg of messages.filter(m => !m.pending)) {
      const role = msg.role === 'user' ? 'USER' : 'ASSISTANT';
      // Place <image> token first if this message has an image
      const isImageMsg = msg.imageUri && msg.imageUri === currentImageUri;
      const content = isImageMsg ? `<image>\n${msg.text}` : msg.text;
      prompt += `${role}: ${content}\n`;
    }
    prompt += `ASSISTANT:`;
    return prompt;
  }
  // Llama 3.2 unchanged
  let prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n${SYSTEM_PROMPT}<|eot_id|>\n`;
  for (const msg of messages.filter(m => !m.pending)) {
    const role = msg.role === 'user' ? 'user' : 'assistant';
    prompt += `<|start_header_id|>${role}<|end_header_id|>\n${msg.text}<|eot_id|>\n`;
  }
  prompt += `<|start_header_id|>assistant<|end_header_id|>\n`;
  return prompt;
};
const stopTokens = (modelId: ModelId) =>
  modelId === 'vision'
    ? ['USER:'] // Stop when next user turn begins
    : ['<|eot_id|>', '<|start_header_id|>'];

const ramColor = (pct: number) => {
  if (pct < 0.6) return C.success;
  if (pct < 0.8) return C.warn;
  return C.danger;
};

// ─── Animated Dot (typing) ────────────────────────────────────────────────────

const Dot = ({ delay }: { delay: number }) => {
  const anim = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.25, duration: 380, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[s.dot, { opacity: anim }]} />;
};

const TypingIndicator = () => (
  <View style={[s.assistantRow, { marginBottom: 10 }]}>
    <View style={s.avatar}><Text style={s.avatarText}>AI</Text></View>
    <View style={[s.bubble, s.assistantBubble, s.typingBubble]}>
      <Dot delay={0} /><Dot delay={140} /><Dot delay={280} />
    </View>
  </View>
);

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble = React.memo(({ message }: { message: Message }) => {
  const isUser = message.role === 'user';
  if (message.pending) return <TypingIndicator />;
  return (
    <View style={[s.bubbleRow, isUser ? s.userRow : s.assistantRow]}>
      {!isUser && <View style={s.avatar}><Text style={s.avatarText}>AI</Text></View>}
      <View style={[s.bubble, isUser ? s.userBubble : s.assistantBubble]}>
        {message.imageUri && (
          <Image
            source={{ uri: message.imageUri }}
            style={s.attachedImage}
            resizeMode="cover"
          />
        )}
        {message.text.length > 0 && (
          <Text style={[s.bubbleText, isUser ? s.userText : s.assistantText]}>
            {message.text}
          </Text>
        )}
      </View>
    </View>
  );
});

// ─── RAM Badge ────────────────────────────────────────────────────────────────

const RamBadge = ({ used, total, ramFree }: { used: number; total: number, ramFree: number }) => {
  if (total === 0) return null;
  const pct = used / total;
  const color = ramColor(pct);
  return (
    <View style={s.ramBadge}>
      {/* mini bar */}
      <View style={s.ramTrack}>
        <View style={[s.ramFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[s.ramText, { color }]}>

        RAM {(used / 1024).toFixed(2)}GB / {(total / 1024).toFixed(1)}GB
      </Text>
    </View>
  );
};

// ─── Model Selector Modal ─────────────────────────────────────────────────────

interface ModelCardProps {
  modelId: ModelId;
  activeModelId: ModelId;
  downloaded: Record<ModelId, boolean>;
  onSelect: (id: ModelId) => void;
  onDownload: (id: ModelId) => void;
  onDelete: (id: ModelId) => void;
}

const ModelCard = ({
  modelId, activeModelId, downloaded, onSelect, onDownload, onDelete,
}: ModelCardProps) => {
  const model = MODELS[modelId];
  const isActive = activeModelId === modelId;
  const isDownloaded = downloaded[modelId];

  return (
    <View style={[s.modelCard, isActive && s.modelCardActive]}>
      <View style={[s.modelIconBg, { borderColor: model.color + '44' }]}>
        <Text style={s.modelCardIcon}>{model.icon}</Text>
      </View>
      <View style={s.modelCardBody}>
        <View style={s.modelCardTitleRow}>
          <Text style={s.modelCardName}>{model.name}</Text>
          <View style={[s.modelBadge, { backgroundColor: model.color + '22', borderColor: model.color + '55' }]}>
            <Text style={[s.modelBadgeText, { color: model.color }]}>{model.badge}</Text>
          </View>
        </View>
        <Text style={s.modelCardDesc}>{model.description}</Text>
        <Text style={s.modelCardSize}>~{model.sizeMB > 1000 ? `${(model.sizeMB / 1000).toFixed(1)} GB` : `${model.sizeMB} MB`}</Text>
        {/* File path shown when downloaded so the user can find it in Files app */}
        {isDownloaded && (
          <View style={s.modelPathRow}>
            <Text style={s.modelPathIcon}>📁</Text>
            <Text style={s.modelPathText} numberOfLines={1} ellipsizeMode="middle">
              {getModelsDirDisplay()}/{model.filename}
            </Text>
          </View>
        )}
      </View>

      <View style={s.modelCardActions}>
        {isDownloaded ? (
          <>
            <TouchableOpacity
              style={[s.modelActionBtn, { backgroundColor: model.color }]}
              onPress={() => onSelect(modelId)}
            >
              <Text style={s.modelActionBtnText}>{isActive ? '✓ Active' : 'Use'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modelDeleteBtn} onPress={() => onDelete(modelId)}>
              <Text style={s.modelDeleteText}>✕</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[s.modelActionBtn, s.modelDownloadBtn]}
            onPress={() => onDownload(modelId)}
          >
            <Text style={s.modelActionBtnText}>↓ Download</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Image Source Sheet ───────────────────────────────────────────────────────

const ImageSourceSheet = ({
  visible, onCamera, onGallery, onClose,
}: {
  visible: boolean;
  onCamera: () => void;
  onGallery: () => void;
  onClose: () => void;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={s.sheetOverlay} onPress={onClose}>
      <View style={s.sheet}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>Attach Image</Text>
        <TouchableOpacity style={s.sheetRow} onPress={onCamera}>
          <View style={[s.sheetRowIcon, { backgroundColor: '#4f8ef722' }]}>
            <Text style={s.sheetRowIconText}>📷</Text>
          </View>
          <View>
            <Text style={s.sheetRowLabel}>Camera</Text>
            <Text style={s.sheetRowSub}>Take a new photo</Text>
          </View>
        </TouchableOpacity>
        <View style={s.sheetDivider} />
        <TouchableOpacity style={s.sheetRow} onPress={onGallery}>
          <View style={[s.sheetRowIcon, { backgroundColor: '#a78bfa22' }]}>
            <Text style={s.sheetRowIconText}>🖼</Text>
          </View>
          <View>
            <Text style={s.sheetRowLabel}>Gallery</Text>
            <Text style={s.sheetRowSub}>Choose from your photos</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.sheetCancelBtn} onPress={onClose}>
          <Text style={s.sheetCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  </Modal>
);

// ─── Download Screen ──────────────────────────────────────────────────────────

const DownloadScreen = ({ state }: { state: DownloadState }) => {
  const barAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: state.progress,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [state.progress]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={s.centerScreen}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <View style={s.dlIconRing}>
          <Text style={s.dlIconText}>↓</Text>
        </View>
      </Animated.View>
      <Text style={s.dlTitle}>{state.label}</Text>
      <Text style={s.dlSub}>{state.downloadedMB.toFixed(0)} / {state.totalMB.toFixed(0)} MB</Text>

      <View style={s.dlTrack}>
        <Animated.View style={[s.dlFill, { width: barWidth }]} />
      </View>
      <View style={s.dlRow}>
        <Text style={s.dlPct}>{Math.round(state.progress * 100)}%</Text>
        <Text style={s.dlNote}>Offline after this · stays on device</Text>
      </View>
      <View style={s.dlPathBadge}>
        <Text style={s.dlPathIcon}>📁</Text>
        <Text style={s.dlPathText}>{getModelsDirDisplay()}</Text>
      </View>
    </View>
  );
};

// ─── Loading Screen ───────────────────────────────────────────────────────────

const LoadingScreen = ({ label }: { label: string }) => (
  <View style={s.centerScreen}>
    <ActivityIndicator size="large" color={C.accent} />
    <Text style={s.loadingLabel}>{label}</Text>
  </View>
);

// ─── Error Screen ─────────────────────────────────────────────────────────────

const ErrorScreen = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <View style={s.centerScreen}>
    <Text style={s.errIcon}>⚠</Text>
    <Text style={s.errTitle}>Something went wrong</Text>
    <Text style={s.errMsg}>{message}</Text>
    <TouchableOpacity style={s.retryBtn} onPress={onRetry}>
      <Text style={s.retryText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('checking');
  const [errorMsg, setErrorMsg] = useState('');
  const [dlState, setDlState] = useState<DownloadState>({
    progress: 0, downloadedMB: 0, totalMB: 1, label: 'Downloading model…',
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeModelId, setActiveModelId] = useState<ModelId>('text');
  const [downloaded, setDownloaded] = useState<Record<ModelId, boolean>>({
    text: false, vision: false,
  });
  const [showModelSheet, setShowModelSheet] = useState(false);
  const [showImageSheet, setShowImageSheet] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [ramUsed, setRamUsed] = useState(0);
  const [ramTotal, setRamTotal] = useState(0);
  const [ramFree, setRamFree] = useState(0);
  const llamaRef = useRef<LlamaContext | null>(null);
  const listRef = useRef<FlatList>(null);
  const abortRef = useRef(false);
  const fullTextRef = useRef('');
  const pendingImageAsset = useRef<Asset | null>(null);

  const activeModel = MODELS[activeModelId];

  // ── RAM polling ───────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const [used, total] = await Promise.all([
          DeviceInfo.getUsedMemory(),
          DeviceInfo.getTotalMemory(),
        ]);

        if (mounted) {
          setRamUsed(used / 1024 / 1024);
          setRamTotal(total / 1024 / 1024);
          setRamFree((total - used) / 1024 / 1024);
        }
      } catch (_) { }
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    checkDownloads().then(() => checkAndInit());
    return () => { llamaRef.current?.release(); };
  }, []);

  const checkDownloads = async () => {
    const results: Record<ModelId, boolean> = { text: false, vision: false };
    for (const id of Object.keys(MODELS) as ModelId[]) {
      const m = MODELS[id];
      const exists = await RNFS.exists(m.path());
      if (exists) {
        try {
          const stat = await RNFS.stat(m.path());
          results[id] = stat.size >= m.minSize;
        } catch { results[id] = false; }
      }
    }
    setDownloaded(results);
    return results;
  };

  const checkAndInit = async () => {
    try {
      setPhase('checking');

      // Ensure the shared storage directory exists (creates it on first launch)
      await ensureModelsDir();

      const results = await checkDownloads();
      // Pick first downloaded model, prefer current activeModelId
      const preferred = results[activeModelId] ? activeModelId
        : (Object.keys(results) as ModelId[]).find(id => results[id]);

      if (preferred) {
        setActiveModelId(preferred);
        await loadModel(preferred);
      } else {
        // Nothing downloaded — show model selector
        setShowModelSheet(true);
        setPhase('chat'); // show empty chat behind the sheet
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Unknown error');
      setPhase('error');
    }
  };

  // ── Download ──────────────────────────────────────────────────────────────

  const downloadFile = (
    url: string,
    dest: string,
    label: string,
    minSize: number,
    totalMB: number,
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      setDlState({ progress: 0, downloadedMB: 0, totalMB, label });
      setPhase('downloading');

      const job = RNFS.downloadFile({
        fromUrl: url,
        toFile: dest,
        connectionTimeout: 30000,
        readTimeout: 60000,
        background: true,
        discretionary: false,
        progressInterval: 500,
        begin: (res) => {
          setDlState(prev => ({ ...prev, totalMB: res.contentLength / 1e6 }));
        },
        progress: (res) => {
          const pct = res.bytesWritten / res.contentLength;
          setDlState(prev => ({
            ...prev,
            progress: pct,
            downloadedMB: res.bytesWritten / 1e6,
          }));
        },
      });

      job.promise
        .then(async (result) => {
          if (result.statusCode !== 200) {
            await RNFS.unlink(dest).catch(() => { });
            reject(new Error(`HTTP ${result.statusCode}`));
            return;
          }
          const stat = await RNFS.stat(dest);
          if (stat.size < minSize) {
            await RNFS.unlink(dest).catch(() => { });
            reject(new Error(`File too small: ${(stat.size / 1e6).toFixed(0)}MB received`));
            return;
          }
          resolve();
        })
        .catch(async (err) => {
          await RNFS.unlink(dest).catch(() => { });
          reject(new Error(`Download failed: ${err.message}`));
        });
    });

  const downloadModel = async (modelId: ModelId) => {
    try {
      const m = MODELS[modelId];
      setShowModelSheet(false);

      // 1. Ask for storage permission (Android only)
      const granted = await requestStoragePermission();
      if (!granted) {
        Alert.alert(
          'Permission denied',
          'Storage permission is required to save models where you can browse them. ' +
          'You can grant it in the app settings.',
          [{ text: 'OK' }],
        );
        return;
      }

      // 2. Make sure the LocalAI folder exists on disk
      await ensureModelsDir();

      // 3. Download main model file
      await downloadFile(
        m.url, m.path(), 'Downloading language model…', m.minSize, m.sizeMB,
      );

      // 4. Vision encoder (LLaVA only)
      if (m.supportsVision && 'mmprojUrl' in m && m.mmprojUrl) {
        await downloadFile(
          m.mmprojUrl,
          (m as typeof MODELS['vision']).mmprojPath(),
          'Downloading vision encoder…',
          50_000_000,
          300,
        );
      }

      setDownloaded(prev => ({ ...prev, [modelId]: true }));
      setActiveModelId(modelId);
      await loadModel(modelId);
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Download error');
      setPhase('error');
    }
  };

  // ── Load Model ────────────────────────────────────────────────────────────

const loadModel = async (modelId: ModelId) => {
  try {
    setPhase('loading');
    llamaRef.current?.release();
    llamaRef.current = null;

    const m = MODELS[modelId];
    const opts: any = {
      model: m.path(),
      n_ctx: m.nCtx,
      n_gpu_layers: m.nGpuLayers,
      n_threads: m.nThreads,
    };

    llamaRef.current = await initLlama(opts);
    console.log('[Model] loaded:', modelId);

    // Initialize multimodal support for vision models
    if (m.supportsVision && 'mmprojPath' in m) {
      try {
        const mmprojPath = (m as typeof MODELS['vision']).mmprojPath();
        const success = await llamaRef.current.initMultimodal({
          path: mmprojPath,
          use_gpu: true,
        });
        console.log('[Multimodal] initialized:', success ? 'success' : 'failed');
      } catch (mmErr: any) {
        console.warn('[Multimodal] init warning:', mmErr?.message);
        // Don't fail completely, model might still work for text
      }
    }

    setPhase('chat');
  } catch (e: any) {
    console.error('[Error] loadModel failed:', e?.message, e);
    setErrorMsg(e?.message ?? 'Failed to load model');
    setPhase('error');
  }
};

  // ── Switch model ──────────────────────────────────────────────────────────

  const switchModel = async (modelId: ModelId) => {
    setShowModelSheet(false);
    if (modelId === activeModelId && phase === 'chat') return;
    setMessages([]);
    setActiveModelId(modelId);
    await loadModel(modelId);
  };

  const deleteModel = (modelId: ModelId) => {
    Alert.alert(
      'Delete model',
      `Remove ${MODELS[modelId].name} from your device? You can re-download it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const m = MODELS[modelId];
            await RNFS.unlink(m.path()).catch(() => { });
            if ('mmprojPath' in m) {
              await RNFS.unlink((m as typeof MODELS['vision']).mmprojPath()).catch(() => { });
            }
            setDownloaded(prev => ({ ...prev, [modelId]: false }));
            if (activeModelId === modelId) {
              llamaRef.current?.release();
              llamaRef.current = null;
              setPhase('chat');
            }
          },
        },
      ]
    );
  };

  // ── Image Picker ──────────────────────────────────────────────────────────
  const handlePickResult = (res: ImagePickerResponse) => {
    setShowImageSheet(false);
    if (res.didCancel || res.errorCode) return;
    const asset = res.assets?.[0];
    if (!asset?.uri) return;

    setPendingImage(asset.uri);           // for preview display
    pendingImageAsset.current = asset;    // ✅ keep full asset with base64
  };

  const openCamera = () =>
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        includeBase64: true,   // ✅ always get base64
      },
      handlePickResult,
    );



  const openGallery = () =>
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
        includeBase64: true,   // ✅ always get base64
      },
      handlePickResult,
    );
  // ── Send ──────────────────────────────────────────────────────────────────
  const prepareImageForInference = async (
    res: Asset,  // asset from picker result
  ): Promise<string | null> => {
    if (!res.uri) return null;
    const tmpPath = `${RNFS.CachesDirectoryPath}/llava_input.jpg`;

    try {
      if (res.base64) {
        // Most reliable — write raw base64 directly
        await RNFS.writeFile(tmpPath, res.base64, 'base64');
        console.log('[Image] prepared from base64:', tmpPath);
        return tmpPath;
      }

      // Fallback: file:// URI (iOS typically)
      if (res.uri.startsWith('file://')) {
        const srcPath = res.uri.replace(/^file:\/\//, '');
        await RNFS.copyFile(srcPath, tmpPath);
        console.log('[Image] prepared from URI:', tmpPath);
        return tmpPath;
      }

      // Try direct copy
      await RNFS.copyFile(res.uri, tmpPath);
      console.log('[Image] prepared from direct URI:', tmpPath);
      return tmpPath;
    } catch (e: any) {
      console.error('[Image] failed to prepare:', e?.message);
      return null;
    }
  }
  // ─── Update sendMessage to use the fixes ─────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if ((!text && !pendingImage) || isGenerating || !llamaRef.current) return;

    const imageUri = pendingImage ?? undefined;
    setInput('');
    setPendingImage(null);
    setIsGenerating(true);
    abortRef.current = false;
    fullTextRef.current = '';

    const userMsg: Message = {
      id: uid(),
      role: 'user',
      text: text || (imageUri ? '(image)' : ''),
      imageUri,
    };
    const assistantId = uid();
    const pendingMsg: Message = { id: assistantId, role: 'assistant', text: '', pending: true };

    setMessages(prev => [...prev, userMsg, pendingMsg]);

    try {
      const history = [...messages, userMsg];

      // Prepare image if present
      let resolvedImagePath: string | null = null;
      const imageAsset = pendingImageAsset.current;
      pendingImageAsset.current = null;

      if (imageUri && imageAsset && activeModel.supportsVision) {
        resolvedImagePath = await prepareImageForInference(imageAsset);
        if (!resolvedImagePath) {
          throw new Error('Failed to prepare image');
        }
      }

      const completionOpts: any = {
        prompt: buildPrompt(history, activeModelId, imageUri),
        emit_partial_completion: true,
        n_predict: 1024,
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        repeat_penalty: 1.1,
        stop: stopTokens(activeModelId),
      };

      // Add image only if successfully prepared
      if (resolvedImagePath) {
        completionOpts.media_paths = [resolvedImagePath];
      }

      await llamaRef.current.completion(
        completionOpts,
        (token: { token: string }) => {
          if (abortRef.current) return;
          fullTextRef.current += token.token;
          setMessages(prev => {
            const idx = prev.findIndex(m => m.id === assistantId);
            if (idx === -1) return prev;
            const updated = [...prev];
            updated[idx] = { id: assistantId, role: 'assistant', text: fullTextRef.current };
            return updated;
          });
        },
      );
    } catch (e: any) {
      console.error('[Error] sendMessage failed:', e?.message, e);
      setMessages(prev => [
        ...prev.filter(m => m.id !== assistantId),
        { id: uid(), role: 'assistant', text: `⚠ ${e?.message ?? 'Generation failed'}` },
      ]);
    } finally {
      setIsGenerating(false);
    }
  }, [input, pendingImage, isGenerating, messages, activeModelId, activeModel]);
  const stopGeneration = () => {
    abortRef.current = true;
    llamaRef.current?.stopCompletion();
    setIsGenerating(false);
    setMessages(prev => prev.filter(m => !m.pending));
  };

  // ── Render screens ────────────────────────────────────────────────────────

  if (phase === 'checking') return <LoadingScreen label="Checking model…" />;
  if (phase === 'downloading') return <DownloadScreen state={dlState} />;
  if (phase === 'loading') return <LoadingScreen label="Loading model into memory…" />;
  if (phase === 'error') return <ErrorScreen message={errorMsg} onRetry={checkAndInit} />;

  // ── Chat UI ───────────────────────────────────────────────────────────────

  const canSendImage = activeModel.supportsVision;

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} translucent />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.modelPill} onPress={() => setShowModelSheet(true)} activeOpacity={0.75}>
          <Text style={[s.modelPillIcon, { color: activeModel.color }]}>{activeModel.icon}</Text>
          <View>
            <Text style={s.modelPillName}>{activeModel.name}</Text>
            <Text style={s.modelPillBadge}>{activeModel.badge}</Text>
          </View>
          <Text style={s.modelPillChevron}>⌄</Text>
        </TouchableOpacity>

        <RamBadge used={ramUsed} total={ramTotal} ramFree={ramFree} />
      </View>

      {/* ── Messages ── */}
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={s.messageList}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>◎</Text>
              <Text style={s.emptyTitle}>LocalAI</Text>
              <Text style={s.emptySub}>
                {activeModel.supportsVision
                  ? 'Send text or attach an image — runs fully offline'
                  : 'Fully offline · Nothing leaves your device'}
              </Text>
            </View>
          }
        />

        {/* ── Input bar ── */}
        <View style={s.inputWrap}>
          {/* Pending image preview */}
          {pendingImage && (
            <View style={s.previewWrap}>
              <Image source={{ uri: pendingImage }} style={s.previewThumb} />
              <TouchableOpacity style={s.previewRemove} onPress={() => setPendingImage(null)}>
                <Text style={s.previewRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.inputBar}>
            {/* Image attach button — only shown for vision model */}
            {canSendImage && (
              <TouchableOpacity
                style={[s.attachBtn, pendingImage && s.attachBtnActive]}
                onPress={() => setShowImageSheet(true)}
              >
                <Text style={s.attachIcon}>⊕</Text>
              </TouchableOpacity>
            )}

            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder={canSendImage ? 'Ask anything or attach image…' : 'Ask anything…'}
              placeholderTextColor={C.muted}
              multiline
              maxLength={2000}
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />

            {isGenerating ? (
              <TouchableOpacity style={s.stopBtn} onPress={stopGeneration}>
                <Text style={s.stopIcon}>◼</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.sendBtn, !input.trim() && !pendingImage && s.sendBtnOff]}
                onPress={sendMessage}
                disabled={!input.trim() && !pendingImage}
              >
                <Text style={s.sendIcon}>▲</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ── Model Selector Modal ── */}
      <Modal
        visible={showModelSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModelSheet(false)}
      >
        <Pressable style={s.sheetOverlay} onPress={() => setShowModelSheet(false)}>
          <Pressable style={s.modelSheet} onPress={() => { }}>
            <View style={s.sheetHandle} />
            <Text style={s.modelSheetTitle}>Choose Model</Text>
            <Text style={s.modelSheetSub}>Models run 100% on-device. No data leaves your phone.</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
              {(Object.keys(MODELS) as ModelId[]).map(id => (
                <ModelCard
                  key={id}
                  modelId={id}
                  activeModelId={activeModelId}
                  downloaded={downloaded}
                  onSelect={switchModel}
                  onDownload={downloadModel}
                  onDelete={deleteModel}
                />
              ))}
              <View style={{ height: 24 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Image Source Sheet ── */}
      <ImageSourceSheet
        visible={showImageSheet}
        onCamera={openCamera}
        onGallery={openGallery}
        onClose={() => setShowImageSheet(false)}
      />
    </SafeAreaView>
  );
}

// ─── Theme ────────────────────────────────────────────────────────────────────

const C = {
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

const { width } = Dimensions.get('window');

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 28 : 4,  // ✅ use actual status bar height
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modelPillIcon: { fontSize: 16 },
  modelPillName: { fontSize: 14, fontWeight: '700', color: C.text, letterSpacing: 0.3 },
  modelPillBadge: { fontSize: 10, color: C.muted, letterSpacing: 0.4 },
  modelPillChevron: { fontSize: 13, color: C.muted, marginLeft: 2 },

  // RAM
  ramBadge: {
    alignItems: 'flex-end',
    gap: 3,
  },
  ramTrack: {
    width: 48,
    height: 3,
    backgroundColor: C.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  ramFill: {
    height: 3,
    borderRadius: 2,
  },
  ramText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Messages
  messageList: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexGrow: 1,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 14,
    maxWidth: width * 0.83,
  },
  userRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantRow: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
    borderWidth: 1,
    borderColor: C.accent + '44',
  },
  avatarText: { fontSize: 9, fontWeight: '800', color: C.accent, letterSpacing: 0.5 },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexShrink: 1,
  },
  userBubble: {
    backgroundColor: C.accent,
    borderBottomRightRadius: 5,
  },
  assistantBubble: {
    backgroundColor: C.surface,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: C.border,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  assistantText: { color: C.text },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.muted },

  // Attached image in bubble
  attachedImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 8,
  },

  // Input
  inputWrap: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
    paddingBottom: Platform.OS === 'ios' ? 4 : 8,
  },
  previewWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  previewThumb: {
    width: 68,
    height: 68,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  previewRemove: {
    position: 'absolute',
    top: 4,
    left: 72,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRemoveText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachBtnActive: {
    backgroundColor: C.accentDim,
    borderColor: C.accent + '66',
  },
  attachIcon: { fontSize: 20, color: C.muted },
  input: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.borderLight,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: C.text,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: C.accentDim, opacity: 0.5 },
  sendIcon: { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: -1 },
  stopBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: { color: '#fff', fontSize: 12 },

  // Empty state
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100,
  },
  emptyIcon: { fontSize: 38, color: C.border, marginBottom: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.textSub, marginBottom: 6, letterSpacing: 0.5 },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20, maxWidth: 260 },

  // Shared center screen
  centerScreen: {
    flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32,
  },

  // Download screen
  dlIconRing: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent + '66',
    alignItems: 'center', justifyContent: 'center', marginBottom: 22,
  },
  dlIconText: { fontSize: 26, color: C.accent, fontWeight: '700' },
  dlTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 4 },
  dlSub: { fontSize: 13, color: C.muted, marginBottom: 24 },
  dlTrack: {
    width: '100%', height: 4, backgroundColor: C.surface,
    borderRadius: 2, overflow: 'hidden', marginBottom: 10,
  },
  dlFill: { height: 4, backgroundColor: C.accent, borderRadius: 2 },
  dlRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  dlPct: { fontSize: 14, fontWeight: '700', color: C.accent },
  dlNote: { fontSize: 12, color: C.muted },
  dlPathBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dlPathIcon: { fontSize: 13 },
  dlPathText: { fontSize: 11, color: C.textSub, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  // Loading screen
  loadingLabel: { marginTop: 18, fontSize: 14, color: C.muted, letterSpacing: 0.4 },

  // Error screen
  errIcon: { fontSize: 38, color: C.danger, marginBottom: 14 },
  errTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8 },
  errMsg: { fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  retryBtn: {
    paddingHorizontal: 30, paddingVertical: 12,
    backgroundColor: C.accent, borderRadius: 22,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Image source sheet
  sheetOverlay: {
    flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.surfaceHigh, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingBottom: 34, paddingTop: 14, paddingHorizontal: 20,
    borderWidth: 1, borderBottomWidth: 0, borderColor: C.borderLight,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.borderLight, marginBottom: 18,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 18, alignSelf: 'flex-start' },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', paddingVertical: 10 },
  sheetRowIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sheetRowIconText: { fontSize: 20 },
  sheetRowLabel: { fontSize: 15, fontWeight: '600', color: C.text },
  sheetRowSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  sheetDivider: { height: 1, backgroundColor: C.border, width: '100%', marginVertical: 4 },
  sheetCancelBtn: {
    marginTop: 16, width: '100%', paddingVertical: 13,
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  sheetCancelText: { color: C.text, fontWeight: '600', fontSize: 15 },

  // Model sheet
  modelSheet: {
    backgroundColor: C.surfaceHigh, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 14, paddingHorizontal: 16,
    borderWidth: 1, borderBottomWidth: 0, borderColor: C.borderLight,
    alignItems: 'center', maxHeight: '85%',
  },
  modelSheetTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 4, alignSelf: 'flex-start' },
  modelSheetSub: { fontSize: 12, color: C.muted, alignSelf: 'flex-start', marginBottom: 18, lineHeight: 18 },

  // Model card
  modelCard: {
    width: '100%', flexDirection: 'column',
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 10, gap: 10,
  },
  modelCardActive: { borderColor: C.accent + '55', backgroundColor: C.accentDim + '66' },
  modelIconBg: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.surfaceHigh, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  modelCardIcon: { fontSize: 20 },
  modelCardBody: { flex: 1, gap: 3 },
  modelCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  modelCardName: { fontSize: 15, fontWeight: '700', color: C.text },
  modelBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1,
  },
  modelBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  modelCardDesc: { fontSize: 12, color: C.textSub, lineHeight: 17 },
  modelCardSize: { fontSize: 11, color: C.muted },
  modelPathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    backgroundColor: C.surfaceHigh,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  modelPathIcon: { fontSize: 11 },
  modelPathText: {
    fontSize: 10,
    color: C.muted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
  },
  modelCardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  modelActionBtn: {
    flex: 1, paddingVertical: 9,
    borderRadius: 10, alignItems: 'center',
  },
  modelDownloadBtn: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderLight },
  modelActionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  modelDeleteBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  modelDeleteText: { color: C.danger, fontWeight: '700', fontSize: 13 },
});