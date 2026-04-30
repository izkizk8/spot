/**
 * ResultCard — Apple Pay Lab (feature 049).
 *
 * Renders the most recent `PaymentResult`. Pure presentational.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { PaymentResult } from '@/native/applepay.types';

interface ResultCardProps {
  readonly style?: ViewStyle;
  readonly result: PaymentResult | null;
  readonly errorMessage: string | null;
}

const STATUS_GLYPH: Readonly<Record<PaymentResult['status'], string>> = {
  success: '✅',
  failure: '⛔',
  cancelled: '⚪',
};

export default function ResultCard({ style, result, errorMessage }: ResultCardProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="apple-pay-result-card"
    >
      <ThemedText type="smallBold">Authorization result</ThemedText>
      {result ? (
        <>
          <ThemedText type="small" testID="apple-pay-result-status">
            {`${STATUS_GLYPH[result.status]} ${result.status}`}
          </ThemedText>
          {result.token ? (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                Transaction id
              </ThemedText>
              <ThemedText type="small" testID="apple-pay-result-transaction-id">
                {result.token.transactionIdentifier}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Network
              </ThemedText>
              <ThemedText type="small" testID="apple-pay-result-network">
                {result.token.paymentNetwork}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Mock payment data (educational; real tokens are processor-specific)
              </ThemedText>
              <ThemedText type="small" testID="apple-pay-result-payment-data">
                {result.token.paymentDataBase64}
              </ThemedText>
            </>
          ) : null}
          {result.errorMessage ? (
            <ThemedText type="small" themeColor="tintB" testID="apple-pay-result-error">
              {result.errorMessage}
            </ThemedText>
          ) : null}
        </>
      ) : (
        <ThemedText type="small" themeColor="textSecondary" testID="apple-pay-result-empty">
          No payment authorized yet. Compose a request and tap "Pay with Pay".
        </ThemedText>
      )}
      {errorMessage && !result?.errorMessage ? (
        <ThemedText type="small" themeColor="tintB" testID="apple-pay-result-extra-error">
          {errorMessage}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.one,
    borderRadius: Spacing.two,
  },
});
