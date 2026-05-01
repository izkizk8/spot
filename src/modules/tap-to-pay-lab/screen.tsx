/**
 * Tap to Pay Lab — iOS screen (feature 051).
 *
 * Composes the showcase sections: EntitlementBanner, CapabilityCard,
 * DiscoverButton, PaymentComposer, AcceptPaymentButton, ResultCard,
 * SetupNotes. The native bridge is exercised through the `useTapToPay`
 * hook.
 */

import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { AcceptPaymentOptions } from '@/native/taptopay.types';
import AcceptPaymentButton from './components/AcceptPaymentButton';
import CapabilityCard from './components/CapabilityCard';
import DiscoverButton from './components/DiscoverButton';
import EntitlementBanner from './components/EntitlementBanner';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import PaymentComposer from './components/PaymentComposer';
import ResultCard from './components/ResultCard';
import SetupNotes from './components/SetupNotes';
import { useTapToPay } from './hooks/useTapToPay';

export default function TapToPayLabScreen() {
  const tp = useTapToPay();
  const { checkSupport, discover, acceptPayment } = tp;

  const [paymentOpts, setPaymentOpts] = useState<AcceptPaymentOptions | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    void checkSupport();
  }, [checkSupport]);

  const handleAcceptPayment = async () => {
    if (paymentOpts) {
      setIsProcessing(true);
      await acceptPayment(paymentOpts);
      setIsProcessing(false);
    }
  };

  // Check iOS version (iOS 16.0+); CapabilityCard surfaces version mismatches.
  const iosVersionOk = Platform.Version ? parseInt(String(Platform.Version), 10) >= 16 : true;

  // Show IOSOnlyBanner on non-iOS platforms only; iOS version gating is shown via CapabilityCard.
  if (Platform.OS !== 'ios') {
    return (
      <ThemedView style={styles.container}>
        <IOSOnlyBanner />
      </ThemedView>
    );
  }

  const entitlementStatus =
    tp.entitled === true ? 'granted' : tp.entitled === false ? 'missing' : 'unknown';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <EntitlementBanner style={styles.card} status={entitlementStatus} />
        <CapabilityCard
          style={styles.card}
          supported={tp.supported ?? false}
          iosVersionOk={iosVersionOk}
          entitled={tp.entitled}
        />
        <DiscoverButton
          style={styles.card}
          status={tp.discovery}
          onPress={() => {
            void discover();
          }}
        />
        <PaymentComposer style={styles.card} onPaymentReady={setPaymentOpts} />
        <AcceptPaymentButton
          style={styles.card}
          onPress={() => {
            void handleAcceptPayment();
          }}
          loading={isProcessing}
          disabled={!paymentOpts}
        />
        <ResultCard style={styles.card} result={tp.lastResult} />
        <SetupNotes style={styles.card} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    marginBottom: Spacing.two,
  },
});
