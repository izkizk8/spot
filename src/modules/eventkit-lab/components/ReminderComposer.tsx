/**
 * ReminderComposer — Form for creating or updating a reminder.
 *
 * Title is required (Save disabled when empty). Due date is optional
 * (toggle to include). List and priority are picked via segmented controls.
 */

import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { CalendarSummary, ReminderDraft } from '../types';

type Priority = ReminderDraft['priority'];

interface ReminderComposerProps {
  lists: CalendarSummary[];
  onSave: (draft: ReminderDraft) => void;
  inFlight: boolean;
  reminderId?: string;
}

const PRIORITIES: readonly Priority[] = ['none', 'low', 'medium', 'high'] as const;
const PRIORITY_LABELS: Record<Priority, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

function defaultDue(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

export function ReminderComposer({ lists, onSave, inFlight, reminderId }: ReminderComposerProps) {
  const theme = useTheme();
  const isUpdate = reminderId !== undefined;

  const writableLists = useMemo(() => lists.filter((l) => l.allowsModifications), [lists]);

  const [title, setTitle] = useState('');
  const [hasDueDate, setHasDueDate] = useState(false);
  const [priority, setPriority] = useState<Priority>('none');
  const [listId, setListId] = useState<string>(writableLists[0]?.id ?? '');

  const trimmedTitle = title.trim();
  const canSave = trimmedTitle.length > 0 && listId !== '' && !inFlight;

  const handleSave = () => {
    const draft: ReminderDraft = {
      title: trimmedTitle,
      dueDate: hasDueDate ? defaultDue() : undefined,
      listId,
      priority,
    };
    onSave(draft);
  };

  return (
    <ThemedView
      style={styles.container}
      type='backgroundElement'
      testID='eventkit-reminder-composer'
    >
      <ThemedText type='subtitle' style={styles.title}>
        {isUpdate ? 'Edit reminder' : 'New reminder'}
      </ThemedText>

      <View style={styles.field}>
        <ThemedText type='smallBold'>Title *</ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder='Reminder title'
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
          testID='eventkit-reminder-title'
        />
      </View>

      <View style={styles.toggleRow}>
        <ThemedText type='smallBold'>Due date</ThemedText>
        <Switch
          value={hasDueDate}
          onValueChange={setHasDueDate}
          testID='eventkit-reminder-hasdue'
        />
      </View>

      <View style={styles.field}>
        <ThemedText type='smallBold'>List</ThemedText>
        {writableLists.length === 0 ? (
          <ThemedText type='small' themeColor='textSecondary'>
            No writable lists available
          </ThemedText>
        ) : (
          <View style={styles.pickerGrid}>
            {writableLists.map((list) => {
              const selected = list.id === listId;
              return (
                <Pressable
                  key={list.id}
                  onPress={() => setListId(list.id)}
                  style={[
                    styles.pickerOption,
                    {
                      backgroundColor: selected ? theme.backgroundSelected : theme.background,
                    },
                  ]}
                  testID={`eventkit-reminder-list-${list.id}`}
                >
                  <View style={[styles.swatch, { backgroundColor: list.color }]} />
                  <ThemedText type={selected ? 'smallBold' : 'small'}>{list.title}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText type='smallBold'>Priority</ThemedText>
        <View style={styles.pickerGrid}>
          {PRIORITIES.map((p) => {
            const selected = p === priority;
            return (
              <Pressable
                key={p}
                onPress={() => setPriority(p)}
                style={[
                  styles.pickerOption,
                  {
                    backgroundColor: selected ? theme.backgroundSelected : theme.background,
                  },
                ]}
                testID={`eventkit-reminder-priority-${p}`}
              >
                <ThemedText type={selected ? 'smallBold' : 'small'}>
                  {PRIORITY_LABELS[p]}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        style={[
          styles.saveButton,
          { backgroundColor: canSave ? theme.tintA : theme.backgroundSelected },
        ]}
        onPress={handleSave}
        disabled={!canSave}
        testID='eventkit-reminder-save'
      >
        <ThemedText type='default' themeColor={canSave ? 'background' : 'textSecondary'}>
          {inFlight ? 'Saving…' : isUpdate ? 'Update' : 'Save'}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.three,
  },
  title: {
    marginBottom: Spacing.one,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
  },
  swatch: {
    width: Spacing.three,
    height: Spacing.three,
    borderRadius: Spacing.two,
  },
  saveButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
});
