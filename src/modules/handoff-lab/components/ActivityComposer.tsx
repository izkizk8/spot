/**
 * ActivityComposer — feature 040 / T029 / US2.
 *
 * Form for editing an `ActivityDefinition` and dispatching it to
 * `useHandoffActivity().setCurrent`.
 *
 * @see specs/040-handoff-continuity/data-model.md §1, §4
 */

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { HANDOFF_DEMO_ACTIVITY_TYPE } from '../activity-types';
import { useHandoffActivity } from '../hooks/useHandoffActivity';
import type { ActivityDefinition } from '../types';

import KeyValueEditor, { findDuplicateKey, type KeyValueRow } from './KeyValueEditor';

const ACTIVITY_TYPE_RE = /^[a-zA-Z0-9._-]+$/;

export interface ComposerFormState {
  activityType: string;
  title: string;
  webpageURL: string;
  userInfoRows: KeyValueRow[];
  requiredKeys: Record<string, boolean>;
  isEligibleForHandoff: boolean;
  isEligibleForSearch: boolean;
  isEligibleForPrediction: boolean;
  errors: {
    activityType?: string;
    webpageURL?: string;
    userInfo?: string;
    requiredKeys?: string;
  };
}

const DEFAULT_STATE: ComposerFormState = {
  activityType: HANDOFF_DEMO_ACTIVITY_TYPE,
  title: 'Handoff demo activity',
  webpageURL: '',
  userInfoRows: [{ key: 'demo', value: 'value' }],
  requiredKeys: {},
  isEligibleForHandoff: true,
  isEligibleForSearch: true,
  isEligibleForPrediction: true,
  errors: {},
};

function validateActivityType(value: string): string | undefined {
  if (value.length === 0) return 'activityType is required';
  if (!ACTIVITY_TYPE_RE.test(value)) {
    return 'activityType must be a reverse-DNS string ([a-zA-Z0-9._-])';
  }
  if (!value.includes('.')) {
    return 'activityType must be a reverse-DNS string with at least one dot';
  }
  return undefined;
}

function validateWebpageURL(value: string): string | undefined {
  if (value.length === 0) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return 'webpageURL must be a valid URL';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'webpageURL must use http or https';
  }
  return undefined;
}

function computeErrors(state: Omit<ComposerFormState, 'errors'>): ComposerFormState['errors'] {
  const errors: ComposerFormState['errors'] = {};
  const at = validateActivityType(state.activityType);
  if (at !== undefined) errors.activityType = at;
  const wp = validateWebpageURL(state.webpageURL);
  if (wp !== undefined) errors.webpageURL = wp;
  const dup = findDuplicateKey(state.userInfoRows);
  if (dup !== null) errors.userInfo = `duplicate key: ${dup}`;
  const userInfoKeys = new Set(state.userInfoRows.map((r) => r.key).filter((k) => k.length > 0));
  const missingRequired = Object.entries(state.requiredKeys)
    .filter(([key, checked]) => checked && !userInfoKeys.has(key))
    .map(([key]) => key);
  if (missingRequired.length > 0) {
    errors.requiredKeys = `requiredUserInfoKeys references missing key(s): ${missingRequired.join(', ')}`;
  }
  return errors;
}

export function composerStateToDefinition(state: ComposerFormState): ActivityDefinition | null {
  if (Object.keys(state.errors).length > 0) return null;
  const userInfo: Record<string, string> = {};
  for (const row of state.userInfoRows) {
    if (row.key.length > 0) userInfo[row.key] = row.value;
  }
  const requiredUserInfoKeys = Object.entries(state.requiredKeys)
    .filter(([key, checked]) => checked && key in userInfo)
    .map(([key]) => key)
    .toSorted();
  const def: ActivityDefinition = {
    activityType: state.activityType,
    title: state.title,
    userInfo,
    requiredUserInfoKeys,
    isEligibleForHandoff: state.isEligibleForHandoff,
    isEligibleForSearch: state.isEligibleForSearch,
    isEligibleForPrediction: state.isEligibleForPrediction,
  };
  if (state.webpageURL.length > 0) {
    def.webpageURL = state.webpageURL;
  }
  return def;
}

interface ActivityComposerProps {
  readonly style?: ViewStyle;
}

export default function ActivityComposer({ style }: ActivityComposerProps) {
  const theme = useTheme();
  const hook = useHandoffActivity();
  const [draft, setDraft] = useState<Omit<ComposerFormState, 'errors'>>({
    activityType: DEFAULT_STATE.activityType,
    title: DEFAULT_STATE.title,
    webpageURL: DEFAULT_STATE.webpageURL,
    userInfoRows: DEFAULT_STATE.userInfoRows,
    requiredKeys: DEFAULT_STATE.requiredKeys,
    isEligibleForHandoff: DEFAULT_STATE.isEligibleForHandoff,
    isEligibleForSearch: DEFAULT_STATE.isEligibleForSearch,
    isEligibleForPrediction: DEFAULT_STATE.isEligibleForPrediction,
  });

  const errors = useMemo(() => computeErrors(draft), [draft]);
  const state: ComposerFormState = { ...draft, errors };
  const definition = composerStateToDefinition(state);
  const canSubmit = definition !== null;

  const handleSubmit = () => {
    if (definition === null) return;
    void hook.setCurrent(definition).catch(() => {
      // Errors surface via the hook; composer ignores them.
    });
  };

  const inputStyle: TextStyle = {
    color: theme.text,
    borderColor: theme.backgroundSelected,
    backgroundColor: theme.backgroundElement,
  };

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Compose Activity</ThemedText>

      <ThemedText type="smallBold">activityType</ThemedText>
      <TextInput
        style={[styles.input, inputStyle]}
        value={draft.activityType}
        onChangeText={(text) => setDraft((s) => ({ ...s, activityType: text }))}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {errors.activityType !== undefined ? (
        <ThemedText type="small" themeColor="tintB" style={styles.error}>
          {errors.activityType}
        </ThemedText>
      ) : null}

      <ThemedText type="smallBold">title</ThemedText>
      <TextInput
        style={[styles.input, inputStyle]}
        value={draft.title}
        onChangeText={(text) => setDraft((s) => ({ ...s, title: text }))}
      />

      <ThemedText type="smallBold">webpageURL (optional)</ThemedText>
      <TextInput
        style={[styles.input, inputStyle]}
        value={draft.webpageURL}
        onChangeText={(text) => setDraft((s) => ({ ...s, webpageURL: text }))}
        placeholder="https://example.com/path"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {errors.webpageURL !== undefined ? (
        <ThemedText type="small" themeColor="tintB" style={styles.error}>
          {errors.webpageURL}
        </ThemedText>
      ) : null}

      <ThemedText type="smallBold">userInfo</ThemedText>
      <KeyValueEditor
        rows={draft.userInfoRows}
        onChange={(rows) => setDraft((s) => ({ ...s, userInfoRows: rows }))}
      />

      <ThemedText type="smallBold">requiredUserInfoKeys</ThemedText>
      {draft.userInfoRows
        .filter((row) => row.key.length > 0)
        .map((row) => (
          <View key={row.key} style={styles.toggleRow}>
            <ThemedText type="small">{row.key}</ThemedText>
            <Switch
              value={Boolean(draft.requiredKeys[row.key])}
              onValueChange={(checked) =>
                setDraft((s) => ({ ...s, requiredKeys: { ...s.requiredKeys, [row.key]: checked } }))
              }
            />
          </View>
        ))}
      {errors.requiredKeys !== undefined ? (
        <ThemedText type="small" themeColor="tintB" style={styles.error}>
          {errors.requiredKeys}
        </ThemedText>
      ) : null}

      <View style={styles.toggleRow}>
        <ThemedText type="small">isEligibleForHandoff</ThemedText>
        <Switch
          value={draft.isEligibleForHandoff}
          onValueChange={(v) => setDraft((s) => ({ ...s, isEligibleForHandoff: v }))}
        />
      </View>
      <View style={styles.toggleRow}>
        <ThemedText type="small">isEligibleForSearch</ThemedText>
        <Switch
          value={draft.isEligibleForSearch}
          onValueChange={(v) => setDraft((s) => ({ ...s, isEligibleForSearch: v }))}
        />
      </View>
      <View style={styles.toggleRow}>
        <ThemedText type="small">isEligibleForPrediction</ThemedText>
        <Switch
          value={draft.isEligibleForPrediction}
          onValueChange={(v) => setDraft((s) => ({ ...s, isEligibleForPrediction: v }))}
        />
      </View>

      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        testID="become-current-btn"
        accessibilityState={{ disabled: !canSubmit }}
        style={[
          styles.submitBtn,
          { backgroundColor: canSubmit ? theme.tintA : theme.backgroundElement },
        ]}
      >
        <ThemedText type="smallBold" themeColor={canSubmit ? 'background' : 'textSecondary'}>
          Become current
        </ThemedText>
      </Pressable>
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
    marginBottom: Spacing.one,
  },
  input: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  submitBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  error: {
    fontStyle: 'italic',
  },
});
