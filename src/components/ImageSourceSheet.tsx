import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { imageSourceSheetStyles as s } from '../css/ImageSourceSheetStyles';

interface ImageSourceSheetProps {
  visible: boolean;
  onCamera: () => void;
  onGallery: () => void;
  onClose: () => void;
}

export const ImageSourceSheet = ({
  visible,
  onCamera,
  onGallery,
  onClose,
}: ImageSourceSheetProps) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={s.sheetOverlay} onPress={onClose}>
      <View style={s.sheet}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>Attach Image</Text>
        <TouchableOpacity style={s.sheetRow} onPress={onCamera}>
          <View style={[s.sheetRowIcon, s.cameraIconBg]}>
            <Text style={s.sheetRowIconText}>📷</Text>
          </View>
          <View>
            <Text style={s.sheetRowLabel}>Camera</Text>
            <Text style={s.sheetRowSub}>Take a new photo</Text>
          </View>
        </TouchableOpacity>
        <View style={s.sheetDivider} />
        <TouchableOpacity style={s.sheetRow} onPress={onGallery}>
          <View style={[s.sheetRowIcon, s.galleryIconBg]}>
            <Text style={s.sheetRowIconText}>🖼</Text>
          </View>
          <View>
            <Text style={s.sheetRowLabel}>Gallery</Text>
            <Text style={s.sheetRowSub}>Choose from your photos</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.sheetCancelBtn} onPress={onClose}>
          <Text style={s.sheetCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  </Modal>
);

