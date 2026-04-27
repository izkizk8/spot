/**
 * Stub: DataControls - will be implemented in T013 (US2)
 * This stub allows screen.tsx (T010) to compile.
 */

import React from 'react';
import { View } from 'react-native';

export interface DataControlsProps {
  readonly onRandomize: () => void;
  readonly onAdd: () => void;
  readonly addDisabled: boolean;
  readonly onRemove: () => void;
  readonly removeDisabled: boolean;
  readonly gradientEnabled: boolean;
  readonly onToggleGradient: () => void;
}

export function DataControls(_props: DataControlsProps) {
  return <View testID="data-controls-stub" />;
}
