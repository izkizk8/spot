/**
 * Apple Pay Lab — iOS screen (feature 049).
 *
 * Composes the showcase sections: CapabilityCard,
 * PaymentComposer, SummaryItemsEditor, PayButton, ResultCard,
 * SetupNotes. The native bridge is exercised through the
 * `useApplePay` hook.
 */

import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import CapabilityCard from './components/CapabilityCard';
import PayButton from './components/PayButton';
import PaymentComposer from './components/PaymentComposer';
import ResultCard from './components/ResultCard';
import SetupNotes from './components/SetupNotes';
import SummaryItemsEditor from './components/SummaryItemsEditor';
import { useApplePay } from './hooks/useApplePay';

export default function ApplePayLabScreen() {
  const ap = useApplePay();

  const onPay = useCallback(() => {
    void ap.pay();
  }, [ap]);

  const onSummaryChange = useCallback(
    (items: readonly { label: string; amount: string }[]) => {
      ap.setRequest({ ...ap.request, summaryItems: items });
    },
    [ap],
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <CapabilityCard
          style={styles.card}
          canMakePayments={ap.canMakePayments}
          perNetwork={ap.perNetwork}
        />
        <PaymentComposer style={styles.card} request={ap.request} onChange={ap.setRequest} />
        <SummaryItemsEditor
          style={styles.card}
          items={ap.request.summaryItems}
          onChange={onSummaryChange}
        />
        <PayButton
          style={styles.card}
          onPress={onPay}
          loading={ap.isPaying}
          disabled={!ap.canMakePayments}
        />
        <ResultCard style={styles.card} result={ap.lastResult} errorMessage={ap.lastError} />
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
