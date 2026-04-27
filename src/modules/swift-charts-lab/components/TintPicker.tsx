/**
 * Stub: TintPicker - will be implemented in T017 (US3)
 * This stub allows screen.tsx (T010) to compile.
 */

import React from 'react';
import { View } from 'react-native';
import type { Tint } from '../data';

export interface TintPickerProps {
  readonly value: Tint;
  readonly onChange: (next: Tint) => void;
  readonly tints: readonly Tint[];
}

export function TintPicker(_props: TintPickerProps) {
  return <View testID="tint-picker-stub" />;
}
