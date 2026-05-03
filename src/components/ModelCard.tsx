import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ModelConfig } from '../types';
import { modelCardStyles as s } from '../css/ModelCardStyles';
import { getModelsDirDisplay } from '../utils/storage';

interface ModelCardProps {
  model: ModelConfig;
  isActive: boolean;
  isDownloaded: boolean;
  onSelect: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export const ModelCard = ({
  model,
  isActive,
  isDownloaded,
  onSelect,
  onDownload,
  onDelete,
}: ModelCardProps) => {
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
        <Text style={s.modelCardSize}>
          ~{model.sizeMB > 1000 ? `${(model.sizeMB / 1000).toFixed(1)} GB` : `${model.sizeMB} MB`}
        </Text>
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
              onPress={onSelect}
            >
              <Text style={s.modelActionBtnText}>{isActive ? '✓ Active' : 'Use'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modelDeleteBtn} onPress={onDelete}>
              <Text style={s.modelDeleteText}>✕</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[s.modelActionBtn, s.modelDownloadBtn]} onPress={onDownload}>
            <Text style={s.modelActionBtnText}>↓ Download</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

