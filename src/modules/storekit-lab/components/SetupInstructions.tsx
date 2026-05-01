/**
 * SetupInstructions — StoreKit Lab (feature 050).
 *
 * Static reference card explaining how to populate the catalog
 * with real products. The plugin only writes a placeholder
 * Info.plist hint; the operator must drop in a
 * Configuration.storekit file or wire up App Store Connect.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface SetupInstructionsProps {
  readonly style?: ViewStyle;
}

const STEPS: readonly { title: string; body: string }[] = Object.freeze([
  {
    title: '1. Add a StoreKit Configuration file',
    body: 'In Xcode: File → New → File → StoreKit Configuration File. Name it Configuration.storekit and add at least one product per type (consumable, non-consumable, auto-renewable, non-renewing). The bundled with-storekit plugin seeds the SKStoreKitConfigurationFilePath Info.plist hint with the placeholder "Configuration.storekit".',
  },
  {
    title: '2. Wire the file into the run scheme',
    body: 'Edit the run scheme → Options → StoreKit Configuration → select the file. Sandbox purchases now resolve from the local catalog without Apple ID interaction.',
  },
  {
    title: '3. (Production) Configure App Store Connect',
    body: 'In App Store Connect, register every product id under "In-App Purchases" with the same identifiers used in demo-products.ts. The bundle id must match your Merchant ID configuration.',
  },
  {
    title: '4. Test on a sandbox account',
    body: 'Sign out of the App Store on the device, run the app, and tap Buy on any product. The sandbox sheet returns deterministic outcomes (success / userCancelled / pending). AppStore.sync() restores past purchases.',
  },
]);

export default function SetupInstructions({ style }: SetupInstructionsProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type='backgroundElement'
      testID='storekit-setup-instructions'
    >
      <ThemedText type='smallBold'>Setup instructions</ThemedText>
      {STEPS.map((step) => (
        <ThemedView key={step.title} style={styles.step} type='backgroundElement'>
          <ThemedText type='small'>{step.title}</ThemedText>
          <ThemedText type='small' themeColor='textSecondary'>
            {step.body}
          </ThemedText>
        </ThemedView>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
  step: {
    gap: Spacing.one,
  },
});
