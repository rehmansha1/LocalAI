import React from 'react';
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants';
import { chatComposerStyles as s } from '../css/ChatComposerStyles';

interface ChatComposerProps {
  canSendImage: boolean;
  input: string;
  pendingImage: string | null;
  isGenerating: boolean;
  onChangeInput: (value: string) => void;
  onAttachImage: () => void;
  onClearImage: () => void;
  onSend: () => void;
  onStop: () => void;
}

export const ChatComposer = ({
  canSendImage,
  input,
  pendingImage,
  isGenerating,
  onChangeInput,
  onAttachImage,
  onClearImage,
  onSend,
  onStop,
}: ChatComposerProps) => {
  const disabled = !input.trim() && !pendingImage;

  return (
    <View style={s.inputWrap}>
      {pendingImage && (
        <View style={s.previewWrap}>
          <Image source={{ uri: pendingImage }} style={s.previewThumb} />
          <TouchableOpacity style={s.previewRemove} onPress={onClearImage}>
            <Text style={s.previewRemoveText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={s.inputBar}>
        {canSendImage && (
          <TouchableOpacity
            style={[s.attachBtn, pendingImage && s.attachBtnActive]}
            onPress={onAttachImage}
          >
            <Text style={s.attachIcon}>⊕</Text>
          </TouchableOpacity>
        )}

        <TextInput
          style={s.input}
          value={input}
          onChangeText={onChangeInput}
          placeholder={canSendImage ? 'Ask anything or attach image...' : 'Ask anything...'}
          placeholderTextColor={COLORS.muted}
          multiline
          maxLength={2000}
          onSubmitEditing={onSend}
          blurOnSubmit={false}
        />

        {isGenerating ? (
          <TouchableOpacity style={s.stopBtn} onPress={onStop}>
            <Text style={s.stopIcon}>◼</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.sendBtn, disabled && s.sendBtnOff]}
            onPress={onSend}
            disabled={disabled}
          >
            <Text style={s.sendIcon}>▲</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
