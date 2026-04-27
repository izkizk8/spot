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
 * Web fallback for <Glass>: View with CSS `backdrop-filter`. The
 * `backdropFilter` property is the *only* StyleSheet-discipline exception
 * acknowledged by this feature (plan.md §Constitution Check) — RN's
 * StyleSheet typings don't yet model it, so it is applied via an inline
 * style object scoped to this single file (FR-017).
 */
export function Glass({ intensity = 0.6, tint, shape = 'rounded', style, children }: GlassProps) {
  const blurPx = Math.round(4 + intensity * 24); // 0..1 -> 4..28 px
  // Inline backdrop-filter style: documented exception. Cast to ViewStyle
  // because RN's typings don't include the web-only property.
  const backdrop: StyleProp<ViewStyle> = {
    // @ts-expect-error -- web-only CSS property not modeled by RN typings.
    backdropFilter: `blur(${blurPx}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${blurPx}px) saturate(180%)`,
  };

  return (
    <View
      style={[
        styles.surface,
        shapeStyle(shape),
        { backgroundColor: tint ?? 'rgba(255,255,255,0.16)' },
        backdrop,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
  },
});
