/**
 * SiwaButton — Wraps AppleAuthenticationButton with appearance pickers.
 *
 * Three pickers: Variant (DEFAULT / CONTINUE / SIGN_UP), Style (BLACK / WHITE /
 * WHITE_OUTLINE), Corner (Square=0 / Round=8 / Pill=height/2).
 *
 * On iOS, renders the real AppleAuthenticationButton. On non-iOS or when
 * disabled, renders a disabled placeholder Pressable.
 */

import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import * as AppleAuthentication from 'expo-apple-authentication';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type Variant = 'default' | 'continue' | 'signUp';
type Style = 'black' | 'white' | 'whiteOutline';
type Corner = 'square' | 'round' | 'pill';

interface SiwaButtonProps {
  variant: Variant;
  style: Style;
  corner: Corner;
  onPress: () => void;
  disabled?: boolean;
  onVariantChange: (v: Variant) => void;
  onStyleChange: (s: Style) => void;
  onCornerChange: (c: Corner) => void;
}

function variantToButtonType(v: Variant): number {
  switch (v) {
    case 'continue':
      return AppleAuthentication.AppleAuthenticationButtonType.CONTINUE;
    case 'signUp':
      return AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP;
    default:
      return AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN;
  }
}

function styleToButtonStyle(s: Style): number {
  switch (s) {
    case 'white':
      return AppleAuthentication.AppleAuthenticationButtonStyle.WHITE;
    case 'whiteOutline':
      return AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE;
    default:
      return AppleAuthentication.AppleAuthenticationButtonStyle.BLACK;
  }
}

function cornerToRadius(c: Corner, height: number): number {
  switch (c) {
    case 'pill':
      return height / 2;
    case 'round':
      return 8;
    default:
      return 0;
  }
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.segmentedControl}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          style={[styles.segment, value === opt && styles.segmentActive]}
          onPress={() => !disabled && onChange(opt)}
          disabled={disabled}
        >
          <ThemedText
            type="small"
            themeColor={value === opt ? 'tintA' : 'textSecondary'}
            style={styles.segmentText}
          >
            {opt}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

export default function SiwaButton({
  variant,
  style,
  corner,
  onPress,
  disabled,
  onVariantChange,
  onStyleChange,
  onCornerChange,
}: SiwaButtonProps) {
  const buttonHeight = 44;
  const buttonType = variantToButtonType(variant);
  const buttonStyle = styleToButtonStyle(style);
  const cornerRadius = cornerToRadius(corner, buttonHeight);

  return (
    <ThemedView style={styles.container} type="backgroundElement">
      <ThemedText type="subtitle" style={styles.title}>
        Sign in with Apple
      </ThemedText>

      <View style={styles.pickerRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Variant:
        </ThemedText>
        <SegmentedControl
          value={variant}
          options={['default', 'continue', 'signUp'] as const}
          onChange={onVariantChange}
          disabled={disabled}
        />
      </View>

      <View style={styles.pickerRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Style:
        </ThemedText>
        <SegmentedControl
          value={style}
          options={['black', 'white', 'whiteOutline'] as const}
          onChange={onStyleChange}
          disabled={disabled}
        />
      </View>

      <View style={styles.pickerRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Corner:
        </ThemedText>
        <SegmentedControl
          value={corner}
          options={['square', 'round', 'pill'] as const}
          onChange={onCornerChange}
          disabled={disabled}
        />
      </View>

      <View style={[styles.buttonWrapper, { height: buttonHeight }]}>
        {Platform.OS === 'ios' && !disabled ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={buttonType}
            buttonStyle={buttonStyle}
            cornerRadius={cornerRadius}
            onPress={onPress}
            style={styles.appleButton}
          />
        ) : (
          <Pressable
            style={[styles.fallbackButton, { borderRadius: cornerRadius }]}
            disabled
            testID="siwa-button-fallback"
          >
            <ThemedText type="default" themeColor="textSecondary">
              Sign in with Apple (iOS only)
            </ThemedText>
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  title: {
    marginBottom: Spacing.one,
  },
  pickerRow: {
    gap: Spacing.two,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  segment: {
    flex: 1,
    padding: Spacing.two,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  segmentText: {
    fontSize: 12,
  },
  buttonWrapper: {
    marginTop: Spacing.two,
  },
  appleButton: {
    width: '100%',
    height: '100%',
  },
  fallbackButton: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
