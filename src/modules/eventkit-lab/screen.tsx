/**
 * EventKit Lab Screen — iOS variant.
 * Feature: 037-eventkit
 */

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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

export default function EventKitLabScreen() {
  // Hooks live at the screen level so tab state is preserved across switches.
  const calendar = useCalendarEvents();
  const reminders = useReminders();

  const [tab, setTab] = useState<TabKey>('calendar');
  const [editingEventId, setEditingEventId] = useState<string | undefined>(undefined);
  const [editingReminderId, setEditingReminderId] = useState<string | undefined>(undefined);

  const handleEventSave = (draft: EventDraft) => {
    if (editingEventId !== undefined) {
      void calendar.updateEvent(editingEventId, draft);
      setEditingEventId(undefined);
    } else {
      void calendar.createEvent(draft);
    }
  };

  const handleReminderSave = (draft: ReminderDraft) => {
    if (editingReminderId !== undefined) {
      void reminders.updateReminder(editingReminderId, draft);
      setEditingReminderId(undefined);
    } else {
      void reminders.createReminder(draft);
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
          <AuthorizationCard
            entityType="reminder"
            status={reminders.status}
            onRequestAccess={() => {
              void reminders.requestAccess();
            }}
            inFlight={reminders.inFlight}
          />
          <RemindersList
            lists={[...reminders.lists]}
            onRefresh={() => {
              void reminders.refreshLists();
            }}
          />
          <RemindersQueryCard
            filter={reminders.filter}
            reminders={[...reminders.reminders]}
            onFilterChange={reminders.setFilter}
            onRefresh={() => {
              void reminders.refreshReminders();
            }}
            onEdit={(reminder) => setEditingReminderId(reminder.id)}
            onDelete={(id) => {
              void reminders.deleteReminder(id);
            }}
          />
          <ReminderComposer
            lists={[...reminders.lists]}
            onSave={handleReminderSave}
            inFlight={reminders.inFlight}
            reminderId={editingReminderId}
          />
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
