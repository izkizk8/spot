import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

export type GlassShape = 'pill' | 'rounded' | 'circle';

export interface GlassProps {
  /**
   * Logical blur intensity in 0..1. Mapped to GlassView's `glassEffectStyle`
   * presets. Higher values choose the more pronounced 'regular' style.
   */
  intensity?: number;
  /** Tint color (hex with optional alpha). */
  tint?: string;
  /** Shape preset that drives the corner radius. */
  shape?: GlassShape;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

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

export function Glass({
  intensity = 0.6,
  tint,
  shape = 'rounded',
  style,
  children,
}: GlassProps) {
  // expo-glass-effect requires iOS 17+. Fall back to a plain themed translucent
  // View when the runtime API is unavailable so the component never throws.
  if (!isLiquidGlassAvailable()) {
    return (
      <View
        style={[
          styles.fallback,
          shapeStyle(shape),
          tint != null && { backgroundColor: tint },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  const glassStyle = intensity >= 0.5 ? 'regular' : 'clear';

  return (
    <GlassView
      glassEffectStyle={glassStyle}
      tintColor={tint}
      isInteractive
      style={[shapeStyle(shape), style]}
    >
      {children}
    </GlassView>
  );
}

export default Glass;

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
  },
});
