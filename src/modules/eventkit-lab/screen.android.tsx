/**
 * EventKit Lab Screen — Android variant.
 * Feature: 037-eventkit
 *
 * Calendar tab is fully functional via expo-calendar. Reminders tab shows an
 * AndroidRemindersNotice and renders the same sections with no-op (disabled)
 * controls — useReminders is still imported and short-circuits per R5.
 */

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AndroidRemindersNotice } from './components/AndroidRemindersNotice';
import { AuthorizationCard } from './components/AuthorizationCard';
import { CalendarsList } from './components/CalendarsList';
import { EventComposer } from './components/EventComposer';
import { EventsQueryCard } from './components/EventsQueryCard';
import { ReminderComposer } from './components/ReminderComposer';
import { RemindersList } from './components/RemindersList';
import { RemindersQueryCard } from './components/RemindersQueryCard';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import { useReminders } from './hooks/useReminders';
import type { EventDraft, ReminderDraft } from './types';

type TabKey = 'calendar' | 'reminders';

const noOp = () => {};
const noOpDraft = (_draft: EventDraft | ReminderDraft) => {};
const noOpFilter = () => {};
const noOpEdit = () => {};
const noOpDelete = () => {};

export default function EventKitLabScreen() {
  const calendar = useCalendarEvents();
  // Reminders hook is imported per spec; it short-circuits on Android (R5).
  const reminders = useReminders();

  const [tab, setTab] = useState<TabKey>('calendar');
  const [editingEventId, setEditingEventId] = useState<string | undefined>(undefined);

  const handleEventSave = (draft: EventDraft) => {
    if (editingEventId !== undefined) {
      void calendar.updateEvent(editingEventId, draft);
      setEditingEventId(undefined);
    } else {
      void calendar.createEvent(draft);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <TabBar tab={tab} onChange={setTab} />

      {tab === 'calendar' ? (
        <>
          <AuthorizationCard
            entityType="calendar"
            status={calendar.status}
            onRequestAccess={() => {
              void calendar.requestAccess();
            }}
            inFlight={calendar.inFlight}
          />
          <CalendarsList
            calendars={[...calendar.calendars]}
            onRefresh={() => {
              void calendar.refreshCalendars();
            }}
          />
          <EventsQueryCard
            range={calendar.range}
            events={[...calendar.events]}
            onRangeChange={calendar.setRange}
            onRefresh={() => {
              void calendar.refreshEvents();
            }}
            onEdit={(event) => setEditingEventId(event.id)}
            onDelete={(id) => {
              void calendar.deleteEvent(id);
            }}
          />
          <EventComposer
            calendars={[...calendar.calendars]}
            onSave={handleEventSave}
            inFlight={calendar.inFlight}
            eventId={editingEventId}
          />
        </>
      ) : (
        <>
          <AndroidRemindersNotice />
          <AuthorizationCard
            entityType="reminder"
            status={reminders.status}
            onRequestAccess={noOp}
            inFlight={false}
          />
          <RemindersList lists={[...reminders.lists]} onRefresh={noOp} />
          <RemindersQueryCard
            filter={reminders.filter}
            reminders={[...reminders.reminders]}
            onFilterChange={noOpFilter}
            onRefresh={noOp}
            onEdit={noOpEdit}
            onDelete={noOpDelete}
          />
          <ReminderComposer lists={[]} onSave={noOpDraft} inFlight={false} />
        </>
      )}
    </ScrollView>
  );
}

interface TabBarProps {
  tab: TabKey;
  onChange: (tab: TabKey) => void;
}

function TabBar({ tab, onChange }: TabBarProps) {
  const theme = useTheme();
  const tabs: readonly { key: TabKey; label: string }[] = [
    { key: 'calendar', label: 'Calendar' },
    { key: 'reminders', label: 'Reminders' },
  ];
  return (
    <ThemedView style={styles.tabBar} type="backgroundElement" testID="eventkit-tabbar">
      <View style={styles.tabRow}>
        {tabs.map((t) => {
          const selected = t.key === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              style={[
                styles.tab,
                {
                  backgroundColor: selected ? theme.backgroundSelected : 'transparent',
                },
              ]}
              testID={`eventkit-tab-${t.key}`}
            >
              <ThemedText
                type={selected ? 'smallBold' : 'small'}
                themeColor={selected ? 'text' : 'textSecondary'}
              >
                {t.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  tabBar: {
    padding: Spacing.one,
    borderRadius: Spacing.two,
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
});
