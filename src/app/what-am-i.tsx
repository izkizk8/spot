import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function WhatAmIScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type='title'>你是什么</ThemedText>
      <ThemedText type='small' themeColor='textSecondary' style={styles.body}>
        我是一个 AI 助手，可以帮你回答问题、解释代码、一起排查 bug。
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  body: {
    lineHeight: 20,
  },
});
