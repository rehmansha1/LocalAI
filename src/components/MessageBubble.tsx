import React from 'react';
import { Image, Text, View } from 'react-native';
import { messageBubbleStyles as s } from '../css/MessageBubbleStyles';
import { Message } from '../types';
import { TypingIndicator } from './TypingIndicator';
import { AnimatedToken } from './AnimatedToken';

interface MessageBubbleProps {
  message: Message;
}

// Only assistant text uses Fira Mono — user bubbles stay on the system font.
const ASSISTANT_FONT = { fontFamily: 'FiraMono-Regular' } as const;

export const MessageBubble = React.memo(({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  if (message.pending) return <TypingIndicator />;

  return (
    <View style={[s.bubbleRow, isUser ? s.userRow : s.assistantRow]}>
      {!isUser && (
        <View style={s.avatar}>
          <Text style={s.avatarText}>AI</Text>
        </View>
      )}

      <View style={[s.bubble, isUser ? s.userBubble : s.assistantBubble]}>
        {message.imageUri && (
          <Image
            source={{ uri: message.imageUri }}
            style={s.attachedImage}
            resizeMode="cover"
          />
        )}

        {isUser ? (
          message.text.length > 0 && (
            <Text style={[s.bubbleText, s.userText]}>
              {message.text}
            </Text>
          )
        ) : message.tokens && message.tokens.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {message.tokens.map((token, i) => (
              <AnimatedToken
                key={i}
                text={token}
                // Fira Mono applied per-token so every animated chunk
                // uses the right font as soon as it pops in
                style={[s.bubbleText, s.assistantText, ASSISTANT_FONT]}
              />
            ))}
          </View>
        ) : (
          message.text.length > 0 && (
            <Text style={[s.bubbleText, s.assistantText, ASSISTANT_FONT]}>
              {message.text}
            </Text>
          )
        )}
      </View>
    </View>
  );
});

MessageBubble.displayName = 'MessageBubble';