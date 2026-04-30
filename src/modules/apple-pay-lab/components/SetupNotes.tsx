/**
 * SetupNotes — Apple Pay Lab (feature 049).
 *
 * Static reference card explaining what an operator needs to
 * actually charge a card with the Apple Pay surface in this
 * lab. Pure presentational.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface SetupNotesProps {
  readonly style?: ViewStyle;
}

const STEPS: readonly { title: string; body: string }[] = Object.freeze([
  {
    title: '1. Register a Merchant ID',
    body: 'In the Apple Developer portal, create a Merchant ID following the reverse-DNS pattern "merchant.<your-bundle>". The "with-apple-pay" plugin seeds the placeholder "merchant.com.izkizk8.spot" — replace it before shipping.',
  },
  {
    title: '2. Enable the in-app payments capability',
    body: 'The bundled config plugin writes the `com.apple.developer.in-app-payments` entitlement. Re-prebuild after editing the merchant id list.',
  },
  {
    title: '3. Pick a payment processor',
    body: 'Apple Pay returns an opaque payment token; you forward it to a processor (Stripe, Square, Adyen, …) which decrypts it and charges the card. This lab returns a mock token shape only.',
  },
  {
    title: '4. Test in the sandbox',
    body: 'Sign in to a sandbox iCloud account on a real device, add a sandbox card to Wallet, and exercise this lab. The simulator can render the sheet but cannot complete an authorization.',
  },
]);

export default function SetupNotes({ style }: SetupNotesProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="apple-pay-setup-notes"
    >
      <ThemedText type="smallBold">Setup notes</ThemedText>
      {STEPS.map((step) => (
        <ThemedView key={step.title} style={styles.step} type="backgroundElement">
          <ThemedText type="small">{step.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
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
