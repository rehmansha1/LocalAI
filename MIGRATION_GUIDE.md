# Migration Guide: Using Refactored Components

This guide shows how to update your App.tsx to use the new component structure.

## Before (Monolithic)
```tsx
// Everything was in App.tsx (1400+ lines)
- Theme/Colors defined at bottom
- All components defined inline
- All utilities mixed in main file
- Hard to test or reuse
```

## After (Modular)

### Step 1: Import Components

```tsx
// Screens
import { LoadingScreen, ErrorScreen, DownloadScreen } from './src/screens';

// Components
import { 
  MessageBubble, 
  RamBadge, 
  ModelCard, 
  ImageSourceSheet 
} from './src/components';

// Constants & Types
import { COLORS, MODELS } from './src/constants';
import { ModelId, Message, AppPhase, DownloadState } from './src/types';

// Utilities
import { 
  ensureModelsDir, 
  getModelsDirDisplay, 
  requestStoragePermission,
  getImageDataUrl 
} from './src/utils/storage';
import { 
  uid, 
  buildPrompt, 
  stopTokens 
} from './src/utils/helpers';
```

### Step 2: Use Components in Render

**Before:**
```tsx
// 100+ lines of component definitions, style objects, etc.
const MessageBubble = React.memo(({ message }: { message: Message }) => {
  // ... 50 lines of component code
});

const RamBadge = ({ used, total, ramFree }: { ... }) => {
  // ... 30 lines of component code
};
```

**After:**
```tsx
// In your render method, just use the component:
<FlatList
  data={messages}
  renderItem={({ item }) => <MessageBubble message={item} />}
/>

<RamBadge used={ramUsed} total={ramTotal} ramFree={ramFree} />
```

### Step 3: Screen Rendering

**Before:**
```tsx
if (phase === 'loading') return <LoadingScreen label="Loading…" />;
// ... but had to define LoadingScreen inline
```

**After:**
```tsx
import { LoadingScreen } from './src/screens';

// In render:
if (phase === 'checking') return <LoadingScreen label="Checking model…" />;
if (phase === 'downloading') return <DownloadScreen state={dlState} />;
if (phase === 'loading') return <LoadingScreen label="Loading model into memory…" />;
if (phase === 'error') return <ErrorScreen message={errorMsg} onRetry={checkAndInit} />;
```

### Step 4: Model Card Usage

**Before:**
```tsx
const ModelCard = ({
  modelId, activeModelId, downloaded, onSelect, ...
}: ModelCardProps) => {
  const model = MODELS[modelId];
  // ... 80 lines of card implementation
};
```

**After:**
```tsx
import { ModelCard } from './src/components';

// In your modal/sheet:
{(Object.keys(MODELS) as ModelId[]).map(id => (
  <ModelCard
    key={id}
    model={MODELS[id]}
    isActive={activeModelId === id}
    isDownloaded={downloaded[id]}
    onSelect={() => switchModel(id)}
    onDownload={() => downloadModel(id)}
    onDelete={() => deleteModel(id)}
  />
))}
```

## Refactored App.tsx Structure

Your simplified App.tsx now focuses on:

```tsx
export default function App() {
  // 1. State management (hooks at top)
  const [phase, setPhase] = useState<AppPhase>('checking');
  const [messages, setMessages] = useState<Message[]>([]);
  // ... other state

  // 2. Effects for initialization
  useEffect(() => {
    checkDownloads().then(() => checkAndInit());
  }, []);

  // 3. Main logic (download, init, send, etc.)
  const checkDownloads = async () => { ... };
  const loadModel = async (modelId: ModelId) => { ... };
  const sendMessage = useCallback(async () => { ... });

  // 4. Render different screens/UI
  if (phase === 'loading') return <LoadingScreen label="..." />;
  if (phase === 'error') return <ErrorScreen message={errorMsg} onRetry={checkAndInit} />;
  
  // Main chat UI
  return (
    <SafeAreaView>
      <View style={s.header}>
        <RamBadge used={ramUsed} total={ramTotal} ramFree={ramFree} />
      </View>
      
      <FlatList
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
      />
      
      <ImageSourceSheet visible={showImageSheet} {...handlers} />
    </SafeAreaView>
  );
}
```

## File Locations

```
Your refactored structure:
├── src/
│   ├── components/
│   │   ├── index.ts (easy imports)
│   │   ├── MessageBubble.tsx
│   │   ├── RamBadge.tsx
│   │   ├── ModelCard.tsx
│   │   ├── TypingIndicator.tsx
│   │   └── ImageSourceSheet.tsx
│   ├── screens/
│   │   ├── index.ts
│   │   ├── LoadingScreen.tsx
│   │   ├── ErrorScreen.tsx
│   │   └── DownloadScreen.tsx
│   ├── constants/
│   │   └── index.ts (COLORS, MODELS, SYSTEM_PROMPT)
│   ├── types/
│   │   └── index.ts (all TypeScript interfaces)
│   ├── utils/
│   │   ├── index.ts
│   │   ├── storage.ts (file operations)
│   │   └── helpers.ts (prompt building, etc.)
│   └── App.tsx (NOW MUCH CLEANER!)
```

## Import Examples

```tsx
// Clean, organized imports
import {
  MessageBubble,
  RamBadge,
  ModelCard,
  ImageSourceSheet,
} from './src/components';

import {
  LoadingScreen,
  ErrorScreen,
  DownloadScreen,
} from './src/screens';

import { COLORS, MODELS } from './src/constants';
import { Message, ModelId, AppPhase } from './src/types';
import { buildPrompt, uid, stopTokens } from './src/utils';
```

## Benefits You Get

✅ **Cleaner App.tsx** - Down from 1400+ lines to 500-700 lines
✅ **Easy Testing** - Test each component independently
✅ **Reusability** - Copy components to other projects
✅ **Navigation** - Easy to add React Navigation between screens
✅ **Styling** - Styles are co-located with components
✅ **Team Friendly** - Multiple developers can work on different components
✅ **Maintenance** - Changes to one component don't affect others

## Next Steps

1. ✅ Copy component files to your project
2. ✅ Update your imports in App.tsx
3. ✅ Test that everything still works
4. ✅ Consider extracting custom hooks (useMessages, useModels)
5. ✅ Add Redux/Context if state gets more complex
