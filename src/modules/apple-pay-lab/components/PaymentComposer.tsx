/**
 * PaymentComposer — Apple Pay Lab (feature 049).
 *
 * Controlled form: merchant id, country / currency code,
 * supported networks (multi-toggle), required contact fields
 * (multi-toggle). Pure presentational; emits a callback with
 * the next request shape on every change.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type {
  ContactFieldRequirements,
  PaymentRequestOptions,
  SupportedNetwork,
} from '@/native/applepay.types';

import { NETWORK_CATALOG } from '../supported-networks';

interface PaymentComposerProps {
  readonly style?: ViewStyle;
  readonly request: PaymentRequestOptions;
  readonly onChange: (next: PaymentRequestOptions) => void;
}

const CONTACT_FIELDS: readonly { key: keyof ContactFieldRequirements; label: string }[] =
  Object.freeze([
    { key: 'billing', label: 'Billing address' },
    { key: 'shipping', label: 'Shipping address' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
  ]);

export default function PaymentComposer({ style, request, onChange }: PaymentComposerProps) {
  const theme = useTheme();

  const setField = useCallback(
    <K extends keyof PaymentRequestOptions>(key: K, value: PaymentRequestOptions[K]) => {
      onChange({ ...request, [key]: value });
    },
    [onChange, request],
  );

  const toggleNetwork = useCallback(
    (n: SupportedNetwork) => {
      const has = request.supportedNetworks.includes(n);
      const next = has
        ? request.supportedNetworks.filter((x) => x !== n)
        : [...request.supportedNetworks, n];
      setField('supportedNetworks', next);
    },
    [request.supportedNetworks, setField],
  );

  const toggleContactField = useCallback(
    (key: keyof ContactFieldRequirements) => {
      const next: ContactFieldRequirements = {
        ...request.requiredContactFields,
        [key]: !request.requiredContactFields[key],
      };
      setField('requiredContactFields', next);
    },
    [request.requiredContactFields, setField],
  );

  const inputStyle = [styles.input, { color: theme.text }];

  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="apple-pay-payment-composer"
    >
      <ThemedText type="smallBold">Payment composer</ThemedText>

      <View style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          Merchant identifier
        </ThemedText>
        <TextInput
          value={request.merchantIdentifier}
          onChangeText={(t) => setField('merchantIdentifier', t)}
          placeholder="merchant.com.example"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          style={inputStyle}
          testID="apple-pay-composer-merchant"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, styles.flex1]}>
          <ThemedText type="small" themeColor="textSecondary">
            Country code
          </ThemedText>
          <TextInput
            value={request.countryCode}
            onChangeText={(t) => setField('countryCode', t.toUpperCase())}
            placeholder="US"
            maxLength={2}
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="characters"
            style={inputStyle}
            testID="apple-pay-composer-country"
          />
        </View>
        <View style={[styles.field, styles.flex1]}>
          <ThemedText type="small" themeColor="textSecondary">
            Currency code
          </ThemedText>
          <TextInput
            value={request.currencyCode}
            onChangeText={(t) => setField('currencyCode', t.toUpperCase())}
            placeholder="USD"
            maxLength={3}
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="characters"
            style={inputStyle}
            testID="apple-pay-composer-currency"
          />
        </View>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Supported networks
      </ThemedText>
      <View style={styles.toggleGrid} testID="apple-pay-composer-networks">
        {NETWORK_CATALOG.map((n) => {
          const active = request.supportedNetworks.includes(n.id);
          return (
            <Pressable
              key={n.id}
              onPress={() => toggleNetwork(n.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              testID={`apple-pay-composer-network-${n.id}`}
              style={[
                styles.toggle,
                {
                  backgroundColor: active ? theme.tintA : theme.backgroundSelected,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color: active ? '#ffffff' : theme.text,
                }}
              >
                {n.displayName}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Required contact fields
      </ThemedText>
      <View style={styles.toggleGrid} testID="apple-pay-composer-contact-fields">
        {CONTACT_FIELDS.map(({ key, label }) => {
          const active = request.requiredContactFields[key];
          return (
            <Pressable
              key={key}
              onPress={() => toggleContactField(key)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              testID={`apple-pay-composer-contact-${key}`}
              style={[
                styles.toggle,
                {
                  backgroundColor: active ? theme.tintA : theme.backgroundSelected,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color: active ? '#ffffff' : theme.text,
                }}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex1: {
    flex: 1,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8E8E93',
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  toggleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  toggle: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
  },
});
