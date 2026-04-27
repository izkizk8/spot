import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { GlassProps, GlassShape } from './index';

export type { GlassProps, GlassShape } from './index';

function shapeStyle(shape: GlassShape): ViewStyle {
  switch (shape) {
    case 'pill':
      return { borderRadius: 9999 };
    case 'circle':
      return { borderRadius: 9999, aspectRatio: 1 };
    case 'rounded':
    default:
      return { borderRadius: 24 };
  }
}

/**
 * Android fallback for <Glass>: translucent material View with elevation
 * + a 1px hairline border. Honors the same `tint` and `shape` props
 * (FR-016).
 */
export function Glass({
  intensity = 0.6,
  tint,
  shape = 'rounded',
  style,
  children,
}: GlassProps) {
  // Map intensity to background alpha so the visual reads change.
  const alpha = Math.max(0.08, Math.min(0.45, 0.12 + intensity * 0.3));
  const baseBg = `rgba(255,255,255,${alpha.toFixed(3)})`;

  return (
    <View
      style={[
        styles.surface,
        shapeStyle(shape),
        { backgroundColor: tint ?? baseBg },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default Glass;

const styles = StyleSheet.create({
  surface: {
    elevation: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.32)',
  },
});

// Re-export helper consumed by typed style prop.
export type _Style = StyleProp<ViewStyle>;
