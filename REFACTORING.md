# LocalAI - Refactored Component Structure

## Overview
The app has been restructured from a single monolithic component into smaller, reusable components and utilities for better maintainability and readability.

## Directory Structure

```
src/
├── App.tsx                 # Main app component (orchestration layer)
├── constants.ts            # Models config, colors, system prompts
├── types.ts               # Shared TypeScript types
├── utils.ts               # Helper functions (prompt building, colors, etc)
├── hooks.ts               # Custom React hooks
└── components/
    ├── Header.tsx         # Top bar with model pill and RAM badge
    ├── MessagesList.tsx   # FlatList for chat messages
    ├── MessageBubble.tsx  # Individual message bubble
    ├── TypingIndicator.tsx # Animated typing indicator
    ├── Dot.tsx            # Animated dot for typing indicator
    ├── InputBar.tsx       # Text input, send button, image preview
    ├── RamBadge.tsx       # RAM usage indicator
    ├── ModelSelectorModal.tsx # Model selection sheet with ModelCard
    ├── DownloadScreen.tsx # Download progress screen
    ├── LoadingScreen.tsx  # Loading spinner screen
    ├── ErrorScreen.tsx    # Error message screen
    ├── ImageSourceSheet.tsx # Camera/Gallery picker sheet
    └── index.ts           # Barrel export for clean imports
```

## Key Components

### UI Components
- **Header**: Displays active model and RAM usage
- **MessagesList**: Renders chat history with empty state
- **MessageBubble**: Individual message (supports images)
- **InputBar**: Text input, send/stop buttons, image preview
- **TypingIndicator**: Animated dots while AI is responding
- **RamBadge**: Real-time RAM usage with color-coded indicator

### Modal Components
- **ModelSelectorModal**: Download/switch/delete models
- **ImageSourceSheet**: Camera or gallery image picker
- **DownloadScreen**: Download progress with animation
- **LoadingScreen**: Generic loading indicator
- **ErrorScreen**: Error message with retry button

## Custom Hooks

### `useRAMPolling()`
Polls device RAM every 2 seconds
- Returns: `{ ramUsed, ramTotal, ramFree }`

### `useModelsDir()`
Manages models directory creation and validation
- Returns: `{ modelsDir, getModelsDir, ensureModelsDir }`

### `useModelDownloads(modelsDir)`
Tracks which models are downloaded
- Returns: `{ downloaded, setDownloaded, checkDownloads }`

## Utilities

### `buildPrompt(messages, modelId, currentImageUri?)`
Constructs proper prompt format for each model (Llama 3.2 vs LLaVA)

### `stopTokens(modelId)`
Returns model-specific stop tokens for generation

### `ramColor(pct, colors)`
Returns color based on RAM usage percentage

### `uid()`
Generates unique IDs for messages

## App.tsx Structure

Main `App` component now focuses on:
1. **State Management** - Organized by feature (UI, Messages, Models, RAM, Modals, Images, Refs)
2. **Lifecycle** - Init, cleanup, download, loading
3. **Message Handling** - Send/stop message generation with image support
4. **Model Management** - Switch, download, delete models
5. **Rendering** - Clean JSX with composed components

The main app is much easier to read with clear sections and reduced complexity.

## Benefits

✅ **Readability** - Each component has a single responsibility  
✅ **Reusability** - Components can be used independently  
✅ **Maintainability** - Easier to locate and modify features  
✅ **Testability** - Smaller units are easier to unit test  
✅ **Performance** - Components are memoized where appropriate  
✅ **Type Safety** - Proper TypeScript types throughout  

## Migration Notes

If updating from the old single-file version:
- Update imports: `import { Component } from './components'`
- Use hooks for shared logic: `const { ramUsed } = useRAMPolling()`
- Props are well-defined and typed on each component
- All colors and constants now centralized in `constants.ts`
