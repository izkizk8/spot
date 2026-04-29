import React from 'react';
import { StyleSheet, TextInput, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';

interface TextContentInputProps {
  readonly value: string;
  readonly onChange: (text: string) => void;
  readonly style?: ViewStyle;
}

export default function TextContentInput({ value, onChange, style }: TextContentInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Enter text to share..."
      placeholderTextColor="#999"
      multiline
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    color: '#000',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    fontSize: 15,
    textAlignVertical: 'top',
  },
});
