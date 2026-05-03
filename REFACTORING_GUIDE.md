# LocalAI Refactored Architecture

This refactoring organizes the monolithic App.tsx into a modular, maintainable component structure.

## Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── ImageSourceSheet.tsx    # Modal for selecting image source
│   ├── MessageBubble.tsx        # Individual message display
│   ├── ModelCard.tsx            # Model selection card
│   ├── RamBadge.tsx             # RAM usage indicator
│   └── TypingIndicator.tsx      # Animated typing dots
├── screens/            # Full-screen components
│   ├── DownloadScreen.tsx       # Model download progress
│   ├── ErrorScreen.tsx          # Error display
│   └── LoadingScreen.tsx        # Loading spinner
├── constants/          # Static configuration
│   └── index.ts        # Colors, models config, system prompt
├── types/              # TypeScript interfaces
│   └── index.ts        # All type definitions
├── utils/              # Helper functions
│   ├── storage.ts      # File system & directory management
│   └── helpers.ts      # Prompts, tokens, color utilities
└── App.tsx            # Main entry point (simplified)
```

## Benefits

✅ **Separation of Concerns** - Components have single responsibilities
✅ **Reusability** - Components can be easily reused in other projects
✅ **Testability** - Isolated components are easier to unit test
✅ **Maintainability** - Clear file organization makes updates easier
✅ **Scalability** - Easy to add new models, screens, or features
✅ **Type Safety** - Centralized types prevent bugs

## Component Descriptions

### Components (UI building blocks)

- **MessageBubble**: Renders individual chat messages with images
- **TypingIndicator**: Shows animated typing dots for assistant responses
- **RamBadge**: Displays real-time RAM usage progress bar
- **ModelCard**: Displays model options with download/delete actions
- **ImageSourceSheet**: Bottom sheet for camera/gallery selection

### Screens (Full-page views)

- **LoadingScreen**: Shows spinner during model loading
- **ErrorScreen**: Displays error messages with retry button
- **DownloadScreen**: Shows model download progress with animation

### Utilities

- **storage.ts**: Handles file I/O, directory setup, image encoding
- **helpers.ts**: Prompt building, token management, color utilities

### Constants

- **COLORS**: Theme color palette
- **MODELS**: Model configuration (URLs, paths, capabilities)
- **SYSTEM_PROMPT**: LLM system instructions

### Types

- **Message**: Chat message interface
- **ModelId**: Union type for model names
- **AppPhase**: App state phases
- **ModelConfig**: Complete model configuration

## Usage in App.tsx

The refactored App.tsx now:
1. Imports components cleanly
2. Manages state and business logic at the top level
3. Delegates rendering to smaller components
4. Remains focused on orchestration rather than implementation details

### Example Component Import

```tsx
import { MessageBubble } from './components/MessageBubble';
import { LoadingScreen } from './screens/LoadingScreen';
import { DownloadScreen } from './screens/DownloadScreen';
import { COLORS, MODELS } from './constants';
```

## Next Steps for Further Refactoring

1. **Extract hooks**: Create `useModels.ts`, `useMessages.ts` for state management
2. **Context API**: Move global state to React Context
3. **Styling**: Extract all StyleSheet objects to separate files
4. **Testing**: Add Jest tests for each component
5. **Navigation**: Add React Navigation if expanding to multiple screens
