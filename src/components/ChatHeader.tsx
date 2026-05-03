import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { chatHeaderStyles as s } from '../css/ChatHeaderStyles';
import { ModelConfig } from '../types';
import { RamBadge } from './RamBadge';

interface ChatHeaderProps {
  activeModel: ModelConfig;
  ramUsed: number;
  ramTotal: number;
  ramFree: number;
  onOpenModels: () => void;
}

export const ChatHeader = ({
  activeModel,
  ramUsed,
  ramTotal,
  ramFree,
  onOpenModels,
}: ChatHeaderProps) => (
  <View style={s.header}>
    <TouchableOpacity style={s.modelPill} onPress={onOpenModels} activeOpacity={0.75}>
      <Text style={[s.modelPillIcon, { color: activeModel.color }]}>{activeModel.icon}</Text>
      <View>
        <Text style={s.modelPillName}>{activeModel.name}</Text>
        <Text style={s.modelPillBadge}>{activeModel.badge}</Text>
      </View>
      <Text style={s.modelPillChevron}>⌄</Text>
    </TouchableOpacity>

    <RamBadge used={ramUsed} total={ramTotal} ramFree={ramFree} />
  </View>
);
