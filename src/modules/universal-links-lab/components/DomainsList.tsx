/**
 * DomainsList — Universal Links Lab (feature 041).
 *
 * Reads `expo.ios.associatedDomains` from app.json (passed in via the
 * `domains` prop so the component remains pure / easily testable),
 * normalises each entry, and renders a row with a status pill.
 *
 * Status legend:
 *   - configured: prefixed with `applinks:` and host is non-empty
 *   - placeholder: host equals the demo placeholder `spot.example.com`
 *   - unknown: anything else (incl. malformed entries)
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { ConfiguredDomain, DomainStatus } from '../types';

const PLACEHOLDER_HOST = 'spot.example.com';

export function parseDomain(raw: string): ConfiguredDomain {
  if (!raw.startsWith('applinks:')) {
    return { raw, host: '', status: 'unknown' };
  }
  const host = raw.slice('applinks:'.length).split('?')[0];
  if (host.length === 0) {
    return { raw, host: '', status: 'unknown' };
  }
  const status: DomainStatus = host === PLACEHOLDER_HOST ? 'placeholder' : 'configured';
  return { raw, host, status };
}

interface DomainsListProps {
  readonly domains: readonly string[];
  readonly style?: ViewStyle;
}

const STATUS_LABEL: Record<DomainStatus, string> = {
  configured: 'configured',
  placeholder: 'placeholder',
  unknown: 'unknown',
};

export default function DomainsList({ domains, style }: DomainsListProps) {
  const parsed = domains.map(parseDomain);
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Configured Domains</ThemedText>
      {parsed.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No `applinks:` domains configured. Add one in app.json under `expo.ios.associatedDomains`.
        </ThemedText>
      ) : (
        parsed.map((domain, index) => (
          <View key={index} style={styles.row} testID={`domain-row-${index}`}>
            <ThemedText type="small" style={styles.host}>
              {domain.host.length > 0 ? domain.host : domain.raw}
            </ThemedText>
            <ThemedText
              type="small"
              themeColor={
                domain.status === 'configured'
                  ? 'tintA'
                  : domain.status === 'placeholder'
                    ? 'tintB'
                    : 'textSecondary'
              }
              style={styles.pill}
              testID={`domain-status-${index}`}
            >
              {STATUS_LABEL[domain.status]}
            </ThemedText>
          </View>
        ))
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  host: {
    flex: 1,
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
    overflow: 'hidden',
    fontSize: 12,
  },
});
