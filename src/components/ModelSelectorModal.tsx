import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { MODELS } from '../constants';
import { modelSelectorModalStyles as s } from '../css/ModelSelectorModalStyles';
import { ModelId } from '../types';
import { ModelCard } from './ModelCard';

interface ModelSelectorModalProps {
  visible: boolean;
  activeModelId: ModelId;
  downloaded: Record<ModelId, boolean>;
  onClose: () => void;
  onSelect: (id: ModelId) => void;
  onDownload: (id: ModelId) => void;
  onDelete: (id: ModelId) => void;
}

export const ModelSelectorModal = ({
  visible,
  activeModelId,
  downloaded,
  onClose,
  onSelect,
  onDownload,
  onDelete,
}: ModelSelectorModalProps) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={s.sheetOverlay} onPress={onClose}>
      <Pressable style={s.modelSheet} onPress={() => {}}>
        <View style={s.sheetHandle} />
        <Text style={s.modelSheetTitle}>Choose Model</Text>
        <Text style={s.modelSheetSub}>Models run 100% on-device. No data leaves your phone.</Text>

        <ScrollView showsVerticalScrollIndicator={false} style={s.scroll}>
          {(Object.keys(MODELS) as ModelId[]).map(id => (
            <ModelCard
              key={id}
              model={MODELS[id]}
              isActive={activeModelId === id}
              isDownloaded={downloaded[id]}
              onSelect={() => onSelect(id)}
              onDownload={() => onDownload(id)}
              onDelete={() => onDelete(id)}
            />
          ))}
          <View style={s.bottomSpacer} />
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);
