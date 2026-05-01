/**
 * DynamicActionsManager — adds, removes, and reorders dynamic shortcuts.
 * Feature: 039-quick-actions
 *
 * Invariant: dynamicItems.length ≤ 4 - effectiveStaticCount.
 */

import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { useQuickActions } from '../hooks/useQuickActions';
import type { QuickActionDefinition } from '../types';
import { ActionRow } from './ActionRow';

const MAX_TOTAL = 4;

const DYNAMIC_TEMPLATE: Omit<QuickActionDefinition, 'type'> = {
  title: 'Dynamic Action',
  subtitle: 'Added at runtime',
  iconName: 'sparkles',
  userInfo: { route: '/modules/quick-actions-lab' },
};

function makeDynamic(index: number): QuickActionDefinition {
  return {
    type: `dynamic-${index}-${Date.now()}`,
    title: `${DYNAMIC_TEMPLATE.title} ${index + 1}`,
    subtitle: DYNAMIC_TEMPLATE.subtitle,
    iconName: DYNAMIC_TEMPLATE.iconName,
    userInfo: { ...DYNAMIC_TEMPLATE.userInfo },
  };
}

export function DynamicActionsManager() {
  const qa = useQuickActions();
  const [effectiveStaticCount, setEffectiveStaticCount] = useState<1 | 2 | 3 | 4>(4);
  const [dynamicItems, setDynamicItems] = useState<QuickActionDefinition[]>([]);

  const cap = MAX_TOTAL - effectiveStaticCount;
  const atCap = dynamicItems.length >= cap;

  const persist = (next: QuickActionDefinition[]) => {
    setDynamicItems(next);
    void qa.setItems(next).catch(() => {
      // bridge errors surface in dev console; UI does not roll back.
    });
  };

  const handleAdd = () => {
    if (atCap) {
      Alert.alert(
        'Cap reached',
        `iOS allows ${MAX_TOTAL} total shortcuts. Lower the static count or remove a dynamic item.`,
      );
      return;
    }
    persist([...dynamicItems, makeDynamic(dynamicItems.length)]);
  };

  const handleRemove = (index: number) => {
    Alert.alert('Remove dynamic action?', dynamicItems[index]?.title ?? 'this action', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const next = dynamicItems.slice();
          next.splice(index, 1);
          persist(next);
        },
      },
    ]);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= dynamicItems.length) return;
    const next = dynamicItems.slice();
    [next[index], next[target]] = [next[target], next[index]] as [
      QuickActionDefinition,
      QuickActionDefinition,
    ];
    persist(next);
  };

  return (
    <ThemedView style={styles.container} type='backgroundElement' testID='dynamic-actions-manager'>
      <ThemedText type='subtitle'>Dynamic actions</ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        Total cap = {MAX_TOTAL}. Pretend static count = {effectiveStaticCount}; dynamic cap = {cap}.
      </ThemedText>

      <ThemedView style={styles.toggleRow} type='backgroundElement'>
        {[1, 2, 3, 4].map((n) => (
          <Pressable
            key={n}
            onPress={() => setEffectiveStaticCount(n as 1 | 2 | 3 | 4)}
            style={[styles.toggle, effectiveStaticCount === n && styles.toggleActive]}
            testID={`pretend-static-${n}`}
          >
            <ThemedText type='small'>{n}</ThemedText>
          </Pressable>
        ))}
      </ThemedView>

      <Pressable
        onPress={handleAdd}
        disabled={atCap}
        style={[styles.addButton, atCap && styles.disabled]}
        testID='add-dynamic'
      >
        <ThemedText type='default'>{atCap ? 'Cap reached' : 'Add dynamic action'}</ThemedText>
      </Pressable>

      {dynamicItems.map((item, idx) => (
        <ThemedView key={item.type} style={styles.itemRow} type='backgroundElement'>
          <ActionRow
            title={item.title}
            subtitle={item.subtitle}
            iconName={item.iconName}
            route={item.userInfo.route}
            disabled
            testID={`dynamic-action-${idx}`}
          />
          <ThemedView style={styles.controls} type='backgroundElement'>
            <Pressable
              onPress={() => handleMove(idx, -1)}
              disabled={idx === 0}
              style={[styles.ctrl, idx === 0 && styles.disabled]}
              testID={`move-up-${idx}`}
            >
              <ThemedText type='small'>↑</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => handleMove(idx, 1)}
              disabled={idx === dynamicItems.length - 1}
              style={[styles.ctrl, idx === dynamicItems.length - 1 && styles.disabled]}
              testID={`move-down-${idx}`}
            >
              <ThemedText type='small'>↓</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => handleRemove(idx)}
              style={styles.ctrl}
              testID={`remove-${idx}`}
            >
              <ThemedText type='small'>✕</ThemedText>
            </Pressable>
          </ThemedView>
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
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  toggle: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#888',
  },
  toggleActive: {
    backgroundColor: '#3578E5',
  },
  addButton: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#3578E5',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  itemRow: {
    gap: Spacing.two,
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'flex-end',
  },
  ctrl: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#888',
  },
});
