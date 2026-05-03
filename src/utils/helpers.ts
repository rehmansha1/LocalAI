import { Message, ModelId } from '../types';
import { SYSTEM_PROMPT } from '../constants';

export const uid = () => Math.random().toString(36).slice(2, 9);

export const buildPrompt = (
  messages: Message[],
  modelId: ModelId,
  currentImageUri?: string,
): string => {
  if (modelId === 'vision') {
    let prompt = "You are a helpful vision assistant.\n\n";

    for (const msg of messages.filter(m => !m.pending)) {
      if (msg.role === 'user') {
        const hasImage = msg.imageUri && msg.imageUri === currentImageUri;
        if (hasImage) {
          prompt += `USER: <image>\n${msg.text}\n`;
        } else {
          prompt += `USER: ${msg.text}\n`;
        }
      } else {
        prompt += `ASSISTANT: ${msg.text}\n`;
      }
    }

    prompt += `ASSISTANT:`;
    return prompt;
  }

  let prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n${SYSTEM_PROMPT}<|eot_id|>\n`;

  for (const msg of messages.filter(m => !m.pending)) {
    const role = msg.role === 'user' ? 'user' : 'assistant';
    prompt += `<|start_header_id|>${role}<|end_header_id|>\n${msg.text}<|eot_id|>\n`;
  }

  prompt += `<|start_header_id|>assistant<|end_header_id|>\n`;

  return prompt;
};

export const stopTokens = (modelId: ModelId) =>
  modelId === 'vision'
    ? ['<end_of_turn>', '<eos>']
    : ['<|eot_id|>', '<|start_header_id|>'];

export const ramColor = (pct: number, colors: any) => {
  if (pct < 0.6) return colors.success;
  if (pct < 0.8) return colors.warn;
  return colors.danger;
};
