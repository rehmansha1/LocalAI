import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import RNFS from 'react-native-fs';
import {
  Asset,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import { initLlama, LlamaContext } from 'llama.rn';

import {
  ChatComposer,
  ChatHeader,
  EmptyState,
  ImageSourceSheet,
  MessageBubble,
  ModelSelectorModal,
} from './src/components';
import { COLORS, MODELS } from './src/constants';
import { appStyles as s } from './src/css/AppStyles';
import { DownloadScreen, ErrorScreen, LoadingScreen } from './src/screens';
import { AppPhase, DownloadState, Message, ModelId } from './src/types';
import { buildPrompt, stopTokens, uid } from './src/utils/helpers';
import {
  ensureModelsDir,
  getImageDataUrl,
  requestStoragePermission,
} from './src/utils/storage';

const modelIds = Object.keys(MODELS) as ModelId[];

// How many px from the bottom still counts as "at the bottom"
const SCROLL_THRESHOLD = 40;

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('checking');
  const [errorMsg, setErrorMsg] = useState('');
  const [dlState, setDlState] = useState<DownloadState>({
    progress: 0,
    downloadedMB: 0,
    totalMB: 1,
    label: 'Downloading model...',
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeModelId, setActiveModelId] = useState<ModelId>('text');
  const [downloaded, setDownloaded] = useState<Record<ModelId, boolean>>({
    text: false,
    vision: false,
  });
  const [showModelSheet, setShowModelSheet] = useState(false);
  const [showImageSheet, setShowImageSheet] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [ramUsed, setRamUsed] = useState(0);
  const [ramTotal, setRamTotal] = useState(0);
  const [ramFree, setRamFree] = useState(0);

  const llamaRef = useRef<LlamaContext | null>(null);
  const listRef = useRef<FlatList<Message>>(null);
  const abortRef = useRef(false);
  const fullTextRef = useRef('');
  const fullTokensRef = useRef<string[]>([]);
  const pendingImageAsset = useRef<Asset | null>(null);

  // true  → user is at/near the bottom; tokens auto-scroll
  // false → user scrolled up; we leave them alone
  const isAtBottomRef = useRef(true);

  const activeModel = MODELS[activeModelId];

  // ─── Scroll helpers ──────────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Fires every scroll frame — keeps isAtBottomRef accurate
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      isAtBottomRef.current = distanceFromBottom <= SCROLL_THRESHOLD;
    },
    [],
  );

  // Fires whenever content grows (new token rendered).
  // Only scrolls when the user hasn't scrolled away.
  const handleContentSizeChange = useCallback(() => {
    if (isAtBottomRef.current) scrollToBottom();
  }, [scrollToBottom]);

  // Called on send — always snap to bottom and re-enable auto-scroll
  const forceScrollToBottom = useCallback(() => {
    isAtBottomRef.current = true;
    scrollToBottom();
  }, [scrollToBottom]);

  // ─── RAM polling ─────────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const pollRam = async () => {
      try {
        const [used, total] = await Promise.all([
          DeviceInfo.getUsedMemory(),
          DeviceInfo.getTotalMemory(),
        ]);
        if (!mounted) return;
        setRamUsed(used / 1024 / 1024);
        setRamTotal(total / 1024 / 1024);
        setRamFree((total - used) / 1024 / 1024);
      } catch {
        // Device memory is nice-to-have UI telemetry.
      }
    };

    pollRam();
    const intervalId = setInterval(pollRam, 2000);
    return () => { mounted = false; clearInterval(intervalId); };
  }, []);

  // ─── Model management ────────────────────────────────────────────────────────

  const checkDownloads = useCallback(async () => {
    await ensureModelsDir();
    const results: Record<ModelId, boolean> = { text: false, vision: false };

    for (const id of modelIds) {
      const model = MODELS[id];
      const exists = await RNFS.exists(model.path());
      if (!exists) continue;
      try {
        const stat = await RNFS.stat(model.path());
        results[id] = stat.size >= model.minSize;
      } catch {
        results[id] = false;
      }
    }

    setDownloaded(results);
    return results;
  }, []);

  const loadModel = useCallback(async (modelId: ModelId) => {
    try {
      setPhase('loading');
      llamaRef.current?.release();
      llamaRef.current = null;

      const model = MODELS[modelId];
      llamaRef.current = await initLlama({
        model: model.path(),
        n_ctx: model.nCtx,
        n_gpu_layers: model.nGpuLayers,
        n_threads: model.nThreads,
        ctx_shift: false,
      } as any);

      if (model.supportsVision && model.mmprojPath) {
        const mmprojPath = model.mmprojPath();
        const success = await llamaRef.current.initMultimodal({
          path: mmprojPath,
          use_gpu: false,
        });
        if (!success) throw new Error('initMultimodal returned false');
      }

      setPhase('chat');
    } catch (error: any) {
      console.error('[Error] loadModel failed:', error?.message, error);
      setErrorMsg(error?.message ?? 'Failed to load model');
      setPhase('error');
    }
  }, []);

  const checkAndInit = useCallback(async () => {
    try {
      setPhase('checking');
      const results = await checkDownloads();
      const preferred = results[activeModelId]
        ? activeModelId
        : modelIds.find(id => results[id]);

      if (preferred) {
        setActiveModelId(preferred);
        await loadModel(preferred);
        return;
      }

      setShowModelSheet(true);
      setPhase('chat');
    } catch (error: any) {
      setErrorMsg(error?.message ?? 'Unknown error');
      setPhase('error');
    }
  }, [activeModelId, checkDownloads, loadModel]);

  useEffect(() => {
    checkAndInit();
    return () => { llamaRef.current?.release(); };
  }, [checkAndInit]);

  const downloadFile = useCallback((
    url: string,
    dest: string,
    label: string,
    minSize: number,
    totalMB: number,
  ): Promise<void> => new Promise((resolve, reject) => {
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
      begin: res => {
        if (res.contentLength > 0) {
          setDlState(prev => ({ ...prev, totalMB: res.contentLength / 1e6 }));
        }
      },
      progress: res => {
        const progress = res.contentLength > 0
          ? res.bytesWritten / res.contentLength
          : 0;
        setDlState(prev => ({ ...prev, progress, downloadedMB: res.bytesWritten / 1e6 }));
      },
    });

    job.promise
      .then(async result => {
        if (result.statusCode !== 200) {
          await RNFS.unlink(dest).catch(() => {});
          reject(new Error(`HTTP ${result.statusCode}`));
          return;
        }
        const stat = await RNFS.stat(dest);
        if (stat.size < minSize) {
          await RNFS.unlink(dest).catch(() => {});
          reject(new Error(`File too small: ${(stat.size / 1e6).toFixed(0)}MB received`));
          return;
        }
        resolve();
      })
      .catch(async error => {
        await RNFS.unlink(dest).catch(() => {});
        reject(new Error(`Download failed: ${error.message}`));
      });
  }), []);

  const downloadModel = useCallback(async (modelId: ModelId) => {
    try {
      const model = MODELS[modelId];
      setShowModelSheet(false);

      const granted = await requestStoragePermission();
      if (!granted) {
        Alert.alert('Permission denied', 'Storage permission is required to save models. You can grant it in the app settings.', [{ text: 'OK' }]);
        return;
      }

      await ensureModelsDir();
      await downloadFile(model.url, model.path(), 'Downloading language model...', model.minSize, model.sizeMB);

      if (model.supportsVision && model.mmprojUrl && model.mmprojPath) {
        await downloadFile(model.mmprojUrl, model.mmprojPath(), 'Downloading vision encoder...', 50_000_000, 300);
      }

      setDownloaded(prev => ({ ...prev, [modelId]: true }));
      setActiveModelId(modelId);
      await loadModel(modelId);
    } catch (error: any) {
      setErrorMsg(error?.message ?? 'Download error');
      setPhase('error');
    }
  }, [downloadFile, loadModel]);

  const switchModel = useCallback(async (modelId: ModelId) => {
    setShowModelSheet(false);
    if (modelId === activeModelId && phase === 'chat') return;
    setMessages([]);
    setActiveModelId(modelId);
    await loadModel(modelId);
  }, [activeModelId, loadModel, phase]);

  const deleteModel = useCallback((modelId: ModelId) => {
    Alert.alert(
      'Delete model',
      `Remove ${MODELS[modelId].name} from your device? You can re-download it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const model = MODELS[modelId];
            await RNFS.unlink(model.path()).catch(() => {});
            if (model.mmprojPath) await RNFS.unlink(model.mmprojPath()).catch(() => {});
            setDownloaded(prev => ({ ...prev, [modelId]: false }));
            if (activeModelId === modelId) {
              llamaRef.current?.release();
              llamaRef.current = null;
              setPhase('chat');
            }
          },
        },
      ],
    );
  }, [activeModelId]);

  // ─── Image picking ───────────────────────────────────────────────────────────

  const handlePickResult = useCallback((response: ImagePickerResponse) => {
    setShowImageSheet(false);
    if (response.didCancel || response.errorCode) return;
    const asset = response.assets?.[0];
    if (!asset?.uri) return;
    setPendingImage(asset.uri);
    pendingImageAsset.current = asset;
  }, []);

  const openCamera = useCallback(() => {
    launchCamera(
      { mediaType: 'photo', quality: 0.7, saveToPhotos: false, includeBase64: true, maxWidth: 512, maxHeight: 512 },
      handlePickResult,
    );
  }, [handlePickResult]);

  const openGallery = useCallback(() => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.7, selectionLimit: 1, includeBase64: true, maxWidth: 512, maxHeight: 512 },
      handlePickResult,
    );
  }, [handlePickResult]);

  // ─── Completion ──────────────────────────────────────────────────────────────

  const buildCompletionOptions = useCallback(async ({
    text, imageUri, imageAsset, history,
  }: {
    text: string;
    imageUri?: string;
    imageAsset: Asset | null;
    history: Message[];
  }) => {
    const completionOpts: any = {
      n_predict: 512,
      temperature: 0.1,
      top_p: 0.9,
      top_k: 40,
      repeat_penalty: 1.1,
      stop: stopTokens(activeModelId),
    };

    if (activeModelId !== 'vision') {
      completionOpts.prompt = buildPrompt(history, activeModelId);
      return completionOpts;
    }

    let imageDataUrl: string | null = null;
    if (imageUri && imageAsset && activeModel.supportsVision) {
      imageDataUrl = await getImageDataUrl(imageAsset);
      if (!imageDataUrl) throw new Error('Failed to prepare image');
    }

    const userContent: any[] = [{ type: 'text', text: text || 'Describe this image.' }];
    if (imageDataUrl) userContent.push({ type: 'image_url', image_url: { url: imageDataUrl } });

    completionOpts.messages = [{ role: 'user', content: userContent }];
    return completionOpts;
  }, [activeModel.supportsVision, activeModelId]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if ((!text && !pendingImage) || isGenerating || !llamaRef.current) return;

    const imageUri = pendingImage ?? undefined;
    const imageAsset = pendingImageAsset.current;
    const assistantId = uid();
    const userMsg: Message = {
      id: uid(),
      role: 'user',
      text: text || (imageUri ? '(image)' : ''),
      imageUri,
    };

    setInput('');
    setPendingImage(null);
    setIsGenerating(true);
    setMessages(prev => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', text: '', pending: true },
    ]);

    // Always snap to bottom when the user sends, and re-enable auto-scroll
    forceScrollToBottom();

    abortRef.current = false;
    fullTextRef.current = '';
    fullTokensRef.current = [];
    pendingImageAsset.current = null;

    try {
      const completionOpts = await buildCompletionOptions({
        text, imageUri, imageAsset, history: [...messages, userMsg],
      });

      await llamaRef.current.completion(
        completionOpts,
        (token: { token: string }) => {
          if (abortRef.current) return;

          fullTextRef.current += token.token;
          fullTokensRef.current = [...fullTokensRef.current, token.token];

          setMessages(prev => {
            const index = prev.findIndex(message => message.id === assistantId);
            if (index === -1) return prev;
            const updated = [...prev];
            updated[index] = {
              id: assistantId,
              role: 'assistant',
              text: fullTextRef.current,
              tokens: fullTokensRef.current,
            };
            return updated;
          });
        },
      );
    } catch (error: any) {
      console.error('[Error] sendMessage failed:', error?.message, error);
      setMessages(prev => [
        ...prev.filter(message => message.id !== assistantId),
        { id: uid(), role: 'assistant', text: `Warning: ${error?.message ?? 'Generation failed'}` },
      ]);
    } finally {
      setIsGenerating(false);
    }
  }, [buildCompletionOptions, forceScrollToBottom, input, isGenerating, messages, pendingImage]);

  const stopGeneration = useCallback(() => {
    abortRef.current = true;
    llamaRef.current?.stopCompletion();
    setIsGenerating(false);
    setMessages(prev => prev.filter(message => !message.pending));
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (phase === 'checking') return <LoadingScreen label="Checking model..." />;
  if (phase === 'downloading') return <DownloadScreen state={dlState} />;
  if (phase === 'loading') return <LoadingScreen label="Loading model into memory..." />;
  if (phase === 'error') return <ErrorScreen message={errorMsg} onRetry={checkAndInit} />;

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} translucent />

      <ChatHeader
        activeModel={activeModel}
        ramUsed={ramUsed}
        ramTotal={ramTotal}
        ramFree={ramFree}
        onOpenModels={() => setShowModelSheet(true)}
      />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={message => message.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={s.messageList}
          ListEmptyComponent={<EmptyState supportsVision={activeModel.supportsVision} />}
          // Track scroll position every frame to know if user is at the bottom
          onScroll={handleScroll}
          scrollEventThrottle={16}
          // Fires when content grows (new token). Scrolls only if at bottom.
          onContentSizeChange={handleContentSizeChange}
        />

        <ChatComposer
          canSendImage={activeModel.supportsVision}
          input={input}
          pendingImage={pendingImage}
          isGenerating={isGenerating}
          onChangeInput={setInput}
          onAttachImage={() => setShowImageSheet(true)}
          onClearImage={() => setPendingImage(null)}
          onSend={sendMessage}
          onStop={stopGeneration}
        />
      </KeyboardAvoidingView>

      <ModelSelectorModal
        visible={showModelSheet}
        activeModelId={activeModelId}
        downloaded={downloaded}
        onClose={() => setShowModelSheet(false)}
        onSelect={switchModel}
        onDownload={downloadModel}
        onDelete={deleteModel}
      />

      <ImageSourceSheet
        visible={showImageSheet}
        onCamera={openCamera}
        onGallery={openGallery}
        onClose={() => setShowImageSheet(false)}
      />
    </SafeAreaView>
  );
}