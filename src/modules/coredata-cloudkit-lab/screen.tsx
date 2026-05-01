/**
 * Core Data + CloudKit Lab — iOS screen (feature 052).
 *
 * Composes the showcase sections: account status, sync pill,
 * notes list, editor, conflict demo, migration card, and setup
 * instructions. The native bridge is exercised through the
 * `useNotesStore` hook.
 */

import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import AccountStatusCard from './components/AccountStatusCard';
import ConflictDemo from './components/ConflictDemo';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import MigrationCard from './components/MigrationCard';
import NoteEditor from './components/NoteEditor';
import NotesList from './components/NotesList';
import SetupInstructions from './components/SetupInstructions';
import SyncStatusPill from './components/SyncStatusPill';
import { useNotesStore } from './hooks/useNotesStore';
import type { Note } from './note-types';

export default function CoreDataCloudKitLabScreen() {
  const store = useNotesStore();
  const { refreshAccount, refreshNotes } = store;

  const [editing, setEditing] = useState<Note | null>(null);

  useEffect(() => {
    void refreshAccount();
    void refreshNotes();
  }, [refreshAccount, refreshNotes]);

  if (Platform.OS !== 'ios') {
    return (
      <ThemedView style={styles.container}>
        <IOSOnlyBanner />
      </ThemedView>
    );
  }

  const handleSubmit = (draft: { title: string; body: string }) => {
    if (editing) {
      void store.updateNote(editing.id, draft);
      setEditing(null);
    } else {
      void store.createNote(draft);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AccountStatusCard style={styles.card} status={store.accountStatus} />
        <SyncStatusPill style={styles.card} state={store.syncState} />
        <NotesList
          style={styles.card}
          notes={store.notes}
          loading={store.loading}
          onEdit={setEditing}
          onDelete={(n) => {
            void store.deleteNote(n.id);
          }}
        />
        <NoteEditor
          style={styles.card}
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
        <ConflictDemo
          style={styles.card}
          selected={editing ?? store.notes[0] ?? null}
          onTrigger={(id) => {
            void store.simulateConflict(id);
          }}
        />
        <MigrationCard style={styles.card} />
        <SetupInstructions style={styles.card} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    marginBottom: Spacing.two,
  },
});
