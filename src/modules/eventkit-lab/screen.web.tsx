/**
 * EventKit Lab Screen — Web variant.
 * Feature: 037-eventkit
 *
 * MUST NOT import expo-calendar directly. Imports the hooks (which short-circuit
 * on web) and typed shapes from ./types only. All controls are inert no-ops.
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
import { IOSOnlyBanner } from './components/IOSOnlyBanner';
import { ReminderComposer } from './components/ReminderComposer';
import { RemindersList } from './components/RemindersList';
import { RemindersQueryCard } from './components/RemindersQueryCard';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import { useReminders } from './hooks/useReminders';
import type { EventDraft, ReminderDraft } from './types';

type TabKey = 'calendar' | 'reminders';

const noOp = () => {};
const noOpEventDraft = (_draft: EventDraft) => {};
const noOpReminderDraft = (_draft: ReminderDraft) => {};
const noOpRange = () => {};
const noOpFilter = () => {};
const noOpEdit = () => {};
const noOpDelete = () => {};

export default function EventKitLabScreen() {
  // Hooks short-circuit on web — values are restricted/empty stubs.
  const calendar = useCalendarEvents();
  const reminders = useReminders();

  const [tab, setTab] = useState<TabKey>('calendar');

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <IOSOnlyBanner />
      <TabBar tab={tab} onChange={setTab} />

      {tab === 'calendar' ? (
        <>
          <AuthorizationCard
            entityType="calendar"
            status={calendar.status}
            onRequestAccess={noOp}
            inFlight={false}
          />
          <CalendarsList calendars={[]} onRefresh={noOp} />
          <EventsQueryCard
            range={calendar.range}
            events={[]}
            onRangeChange={noOpRange}
            onRefresh={noOp}
            onEdit={noOpEdit}
            onDelete={noOpDelete}
          />
          <EventComposer calendars={[]} onSave={noOpEventDraft} inFlight={false} />
        </>
      ) : (
        <>
          <AuthorizationCard
            entityType="reminder"
            status={reminders.status}
            onRequestAccess={noOp}
            inFlight={false}
          />
          <RemindersList lists={[]} onRefresh={noOp} />
          <RemindersQueryCard
            filter={reminders.filter}
            reminders={[]}
            onFilterChange={noOpFilter}
            onRefresh={noOp}
            onEdit={noOpEdit}
            onDelete={noOpDelete}
          />
          <ReminderComposer lists={[]} onSave={noOpReminderDraft} inFlight={false} />
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
