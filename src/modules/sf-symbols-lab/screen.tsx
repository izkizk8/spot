/**
 * @file screen.tsx
 * @description SF Symbols Lab main screen (T016)
 * Per contracts/test-plan.md Story 3.
 */

import * as React from 'react';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AnimatedSymbol } from './components/AnimatedSymbol';
import { SymbolPicker } from './components/SymbolPicker';
import { EffectPicker } from './components/EffectPicker';
import { TintPicker } from './components/TintPicker';
import { SYMBOLS, EFFECTS, TINTS } from './catalog';
import type { CuratedSymbol, EffectMetadata, Speed, Repeat, TintToken } from './types';

export function SfSymbolsLabScreen() {
  const theme = useTheme();

  // State
  const [selectedSymbol, setSelectedSymbol] = useState<CuratedSymbol>(SYMBOLS[0]);
  const [selectedEffect, setSelectedEffect] = useState<EffectMetadata>(EFFECTS[0]);
  const [speed, setSpeed] = useState<Speed>('normal');
  const [repeat, setRepeat] = useState<Repeat>('once');
  const [tint, setTint] = useState<TintToken>(TINTS[0]);
  const [secondarySymbol, setSecondarySymbol] = useState<CuratedSymbol>(SYMBOLS[1]);
  const [playToken, setPlayToken] = useState<number>(0);

  // Derived values
  const tintColor = theme[tint];
  const isReplace = selectedEffect.id === 'replace';
  const speedEnabled = selectedEffect.respondsToSpeed;
  const repeatEnabled = selectedEffect.respondsToRepeat;

  // Handlers
  const handlePlayEffect = () => {
    if (playToken > 0 && repeat === 'indefinite') {
      // Stop indefinite repeat
      setPlayToken(0);
    } else {
      // Start effect
      setPlayToken((prev) => prev + 1);
    }
  };

  const handleEffectSelect = (effect: EffectMetadata) => {
    setSelectedEffect(effect);
    // Reset playToken when changing effects
    setPlayToken(0);
  };

  const handleTintSelect = (newTint: TintToken) => {
    setTint(newTint);
  };

  // Secondary picker options (exclude primary symbol)
  const secondaryOptions = SYMBOLS.filter((s) => s.name !== selectedSymbol.name);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {/* iOS 17+ banner for non-iOS platforms */}
      {Platform.OS !== 'ios' && (
        <ThemedView style={styles.banner}>
          <ThemedText type='small'>iOS 17+ only</ThemedText>
        </ThemedView>
      )}

      {/* Preview */}
      <ThemedView style={styles.section}>
        <ThemedText type='subtitle'>SF Symbols Lab</ThemedText>
        <ThemedText type='small' themeColor='textSecondary'>
          Explore iOS 17 symbol effects with real-time preview
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.previewContainer}>
        <AnimatedSymbol
          name={selectedSymbol.name}
          secondaryName={secondarySymbol.name}
          effect={selectedEffect.id}
          speed={speed}
          repeat={repeat}
          tintColor={tintColor}
          size={64}
          playToken={playToken}
        />
      </ThemedView>

      {/* Symbol Picker */}
      <ThemedView style={styles.section}>
        <ThemedText type='small' style={styles.label}>
          Symbol
        </ThemedText>
        <SymbolPicker
          symbols={SYMBOLS}
          selectedName={selectedSymbol.name}
          onSelect={setSelectedSymbol}
          tintColor={tintColor}
        />
      </ThemedView>

      {/* Effect Picker */}
      <ThemedView style={styles.section}>
        <ThemedText type='small' style={styles.label}>
          Effect
        </ThemedText>
        <EffectPicker
          effects={EFFECTS}
          selectedId={selectedEffect.id}
          onSelect={handleEffectSelect}
        />
      </ThemedView>

      {/* Speed Control */}
      <ThemedView style={[styles.section, !speedEnabled && styles.disabled]}>
        <ThemedText type='small' style={styles.label}>
          Speed
        </ThemedText>
        <View style={styles.segmentedControl} pointerEvents={speedEnabled ? 'auto' : 'none'}>
          {(['slow', 'normal', 'fast'] as const).map((s) => (
            <Pressable
              key={s}
              role='button'
              accessibilityState={{ selected: speed === s }}
              onPress={() => setSpeed(s)}
              style={[
                styles.segment,
                {
                  backgroundColor: speed === s ? theme.backgroundSelected : theme.backgroundElement,
                },
              ]}
            >
              <ThemedText type='small'>{s.charAt(0).toUpperCase() + s.slice(1)}</ThemedText>
            </Pressable>
          ))}
        </View>
      </ThemedView>

      {/* Repeat Control */}
      <ThemedView style={[styles.section, !repeatEnabled && styles.disabled]}>
        <ThemedText type='small' style={styles.label}>
          Repeat
        </ThemedText>
        <View style={styles.segmentedControl} pointerEvents={repeatEnabled ? 'auto' : 'none'}>
          {(
            [
              { value: 'once', label: 'Once' },
              { value: 'thrice', label: '3 times' },
              { value: 'indefinite', label: 'Indefinite' },
            ] as const
          ).map(({ value, label }) => (
            <Pressable
              key={value}
              role='button'
              accessibilityState={{ selected: repeat === value }}
              onPress={() => setRepeat(value)}
              style={[
                styles.segment,
                {
                  backgroundColor:
                    repeat === value ? theme.backgroundSelected : theme.backgroundElement,
                },
              ]}
            >
              <ThemedText type='small'>{label}</ThemedText>
            </Pressable>
          ))}
        </View>
      </ThemedView>

      {/* Tint Picker */}
      <ThemedView style={styles.section}>
        <ThemedText type='small' style={styles.label}>
          Tint
        </ThemedText>
        <TintPicker tints={TINTS} selectedTint={tint} onSelect={handleTintSelect} />
      </ThemedView>

      {/* Replace Mini-Picker */}
      {isReplace && (
        <ThemedView style={styles.section}>
          <ThemedText type='small' style={styles.label}>
            Replace With
          </ThemedText>
          <SymbolPicker
            symbols={secondaryOptions}
            selectedName={secondarySymbol.name}
            onSelect={setSecondarySymbol}
            tintColor={tintColor}
          />
        </ThemedView>
      )}

      {/* Play Effect Button */}
      <ThemedView style={styles.section}>
        <Pressable
          role='button'
          onPress={handlePlayEffect}
          style={[styles.playButton, { backgroundColor: theme.backgroundElement }]}
        >
          <ThemedText type='default' style={styles.playButtonText}>
            {playToken > 0 && repeat === 'indefinite' ? 'Stop Effect' : 'Play Effect'}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: Spacing.four,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  banner: {
    marginHorizontal: Spacing.three,
    padding: Spacing.two,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    marginHorizontal: Spacing.three,
  },
  label: {
    paddingHorizontal: Spacing.three,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  playButton: {
    marginHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    fontWeight: '600',
  },
});
