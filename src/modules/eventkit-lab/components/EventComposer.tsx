/**
 * EventComposer — Form for creating or updating an event.
 *
 * Title is required (Save disabled when empty). Calendar selection respects
 * read-only calendars (allowsModifications=false). Alarm offset and all-day
 * toggle are exposed via simple segmented pickers.
 */

import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import {
  ALARM_OFFSET_LABELS,
  ALARM_OFFSET_PRESETS,
  type AlarmOffsetPreset,
} from '../alarm-offsets';
import type { CalendarSummary, EventDraft } from '../types';

interface EventComposerProps {
  calendars: CalendarSummary[];
  onSave: (draft: EventDraft) => void;
  inFlight: boolean;
  eventId?: string;
}

function defaultStart(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

function defaultEnd(start: Date): Date {
  const d = new Date(start);
  d.setHours(d.getHours() + 1);
  return d;
}

export function EventComposer({ calendars, onSave, inFlight, eventId }: EventComposerProps) {
  const theme = useTheme();
  const isUpdate = eventId !== undefined;

  const writableCalendars = useMemo(
    () => calendars.filter((c) => c.allowsModifications),
    [calendars],
  );

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [alarmOffset, setAlarmOffset] = useState<AlarmOffsetPreset>('none');
  const [calendarId, setCalendarId] = useState<string>(writableCalendars[0]?.id ?? '');

  const trimmedTitle = title.trim();
  const canSave =
    trimmedTitle.length > 0 && calendarId !== '' && !inFlight;

  const handleSave = () => {
    const start = defaultStart();
    const end = defaultEnd(start);
    const draft: EventDraft = {
      title: trimmedTitle,
      location: location.trim() === '' ? undefined : location.trim(),
      startDate: start,
      endDate: end,
      allDay,
      calendarId,
      alarmOffset: alarmOffset === 'none' ? undefined : alarmOffset,
    };
    onSave(draft);
  };

  return (
    <ThemedView style={styles.container} type="backgroundElement" testID="eventkit-event-composer">
      <ThemedText type="subtitle" style={styles.title}>
        {isUpdate ? 'Edit event' : 'New event'}
      </ThemedText>

      <View style={styles.field}>
        <ThemedText type="smallBold">Title *</ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Event title"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
          testID="eventkit-event-title"
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">Location</ThemedText>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Optional"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
          testID="eventkit-event-location"
        />
      </View>

      <View style={styles.toggleRow}>
        <ThemedText type="smallBold">All-day</ThemedText>
        <Switch value={allDay} onValueChange={setAllDay} testID="eventkit-event-allday" />
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">Calendar</ThemedText>
        {writableCalendars.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            No writable calendars available
          </ThemedText>
        ) : (
          <View style={styles.pickerGrid}>
            {writableCalendars.map((cal) => {
              const selected = cal.id === calendarId;
              return (
                <Pressable
                  key={cal.id}
                  onPress={() => setCalendarId(cal.id)}
                  style={[
                    styles.pickerOption,
                    {
                      backgroundColor: selected ? theme.backgroundSelected : theme.background,
                    },
                  ]}
                  testID={`eventkit-event-cal-${cal.id}`}
                >
                  <View style={[styles.swatch, { backgroundColor: cal.color }]} />
                  <ThemedText type={selected ? 'smallBold' : 'small'}>{cal.title}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">Alarm</ThemedText>
        <View style={styles.pickerGrid}>
          {ALARM_OFFSET_PRESETS.map((preset) => {
            const selected = preset === alarmOffset;
            return (
              <Pressable
                key={preset}
                onPress={() => setAlarmOffset(preset)}
                style={[
                  styles.pickerOption,
                  {
                    backgroundColor: selected ? theme.backgroundSelected : theme.background,
                  },
                ]}
                testID={`eventkit-event-alarm-${preset}`}
              >
                <ThemedText type={selected ? 'smallBold' : 'small'}>
                  {ALARM_OFFSET_LABELS[preset]}
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
        testID="eventkit-event-save"
      >
        <ThemedText type="default" themeColor={canSave ? 'background' : 'textSecondary'}>
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
