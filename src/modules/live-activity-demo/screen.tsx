import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import bridge from '@/native/live-activity';
import type { LiveActivitySession } from '@/native/live-activity.types';

/**
 * Live Activity Demo screen.
 *
 * UI: Start / Update / End buttons + status display.
 * Local state: session (current Live Activity), errorMessage (user-facing error).
 *
 * On mount, reconciles with the system state via `bridge.current()` (FR-009).
 * Button enable/disable per FR-008.
 *
 * @see specs/007-live-activities-dynamic-island/tasks.md T018
 */
export function LiveActivityDemoScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [session, setSession] = useState<LiveActivitySession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // FR-009: Reconcile to system state on mount
  useEffect(() => {
    bridge.current().then((currentSession) => {
      setSession(currentSession);
    });
  }, []);

  // Check if Live Activities are available on this platform
  const isAvailable = bridge.isAvailable();

  // Start handler (US1 - T028)
  const handleStart = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const newSession = await bridge.start({
        name: 'Live Activity Demo',
        initialCounter: 0,
      });
      setSession(newSession);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        if (code === 'LIVE_ACTIVITY_AUTHORISATION') {
          setErrorMessage(
            'Live Activities are off for this app. Open iOS Settings → spot → Live Activities to enable them.',
          );
        } else if (code === 'LIVE_ACTIVITY_NOT_SUPPORTED') {
          setErrorMessage('Live Activities are not supported on this device.');
        } else if (code === 'LIVE_ACTIVITY_ALREADY_RUNNING') {
          setErrorMessage('A Live Activity is already running. End it first to start a new one.');
        } else {
          setErrorMessage('Unable to start the activity. Please try again.');
        }
      } else {
        setErrorMessage('Unable to start the activity. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update handler (US2 - T032)
  const handleUpdate = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const updatedSession = await bridge.update({
        counter: session.state.counter + 1,
      });
      setSession(updatedSession);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        if (code === 'LIVE_ACTIVITY_NO_SESSION') {
          setSession(null);
          setErrorMessage('There is nothing to update — the activity has ended.');
        } else if (code === 'LIVE_ACTIVITY_NOT_SUPPORTED') {
          setErrorMessage('Live Activities are not supported on this device.');
        } else {
          setErrorMessage('Unable to update the activity. Please try again.');
        }
      } else {
        setErrorMessage('Unable to update the activity. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // End handler (US3 - T036)
  const handleEnd = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await bridge.end();
      setSession(null);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        if (code === 'LIVE_ACTIVITY_NO_SESSION') {
          setSession(null);
          setErrorMessage('There is nothing to end — the activity has already ended.');
        } else if (code === 'LIVE_ACTIVITY_NOT_SUPPORTED') {
          setErrorMessage('Live Activities are not supported on this device.');
        } else {
          setErrorMessage('Unable to end the activity. Please try again.');
        }
      } else {
        setErrorMessage('Unable to end the activity. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // FR-008: Button enable/disable logic
  const canStart = !session && !isLoading;
  const canUpdate = !!session && !isLoading;
  const canEnd = !!session && !isLoading;

  // US4 (T038): Unavailable platform branch
  if (!isAvailable) {
    return (
      <ThemedView style={styles.root}>
        <ScrollView
          style={[styles.scroll, { backgroundColor: theme.background }]}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + Spacing.four,
              paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
            },
          ]}
        >
          <ThemedView style={styles.header}>
            <ThemedText type='subtitle'>Live Activity Demo</ThemedText>
            <ThemedText type='default' themeColor='textSecondary'>
              Live Activities are not available on this platform.
            </ThemedText>
          </ThemedView>

          <ThemedView type='backgroundElement' style={styles.noticeCard}>
            <ThemedText type='default'>
              This feature requires iOS 16.1 or later with Live Activities enabled.
            </ThemedText>
          </ThemedView>

          {/* Show disabled buttons for visual consistency */}
          <ThemedView style={styles.buttonGroup}>
            <Pressable
              style={[styles.button, styles.buttonDisabled]}
              disabled={true}
              accessibilityRole='button'
              accessibilityLabel='Start activity'
              accessibilityState={{ disabled: true }}
              testID='start-button'
            >
              <ThemedText type='default' themeColor='textSecondary'>
                Start
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonDisabled]}
              disabled={true}
              accessibilityRole='button'
              accessibilityLabel='Update activity'
              accessibilityState={{ disabled: true }}
              testID='update-button'
            >
              <ThemedText type='default' themeColor='textSecondary'>
                Update
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonDisabled]}
              disabled={true}
              accessibilityRole='button'
              accessibilityLabel='End activity'
              accessibilityState={{ disabled: true }}
              testID='end-button'
            >
              <ThemedText type='default' themeColor='textSecondary'>
                End
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          },
        ]}
      >
        <ThemedView style={styles.header}>
          <ThemedText type='subtitle'>Live Activity Demo</ThemedText>
          <ThemedText type='default' themeColor='textSecondary'>
            Control a counter displayed on your Lock Screen and Dynamic Island.
          </ThemedText>
        </ThemedView>

        {/* Status display */}
        <ThemedView type='backgroundElement' style={styles.statusCard}>
          <ThemedText type='smallBold'>Status</ThemedText>
          {session ? (
            <ThemedText type='default' testID='status-text'>
              Activity running — counter {session.state.counter}
            </ThemedText>
          ) : (
            <ThemedText type='default' themeColor='textSecondary' testID='status-text'>
              No activity running
            </ThemedText>
          )}
        </ThemedView>

        {/* Error message */}
        {errorMessage && (
          <ThemedView type='backgroundElement' style={styles.errorCard}>
            <ThemedText type='default' testID='error-text'>
              {errorMessage}
            </ThemedText>
          </ThemedView>
        )}

        {/* Control buttons */}
        <ThemedView style={styles.buttonGroup}>
          <Pressable
            style={[styles.button, !canStart && styles.buttonDisabled]}
            onPress={handleStart}
            disabled={!canStart}
            accessibilityRole='button'
            accessibilityLabel='Start activity'
            accessibilityState={{ disabled: !canStart }}
            testID='start-button'
          >
            <ThemedText type='default' themeColor={canStart ? 'text' : 'textSecondary'}>
              Start
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.button, !canUpdate && styles.buttonDisabled]}
            onPress={handleUpdate}
            disabled={!canUpdate}
            accessibilityRole='button'
            accessibilityLabel='Update activity'
            accessibilityState={{ disabled: !canUpdate }}
            testID='update-button'
          >
            <ThemedText type='default' themeColor={canUpdate ? 'text' : 'textSecondary'}>
              Update
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.button, !canEnd && styles.buttonDisabled]}
            onPress={handleEnd}
            disabled={!canEnd}
            accessibilityRole='button'
            accessibilityLabel='End activity'
            accessibilityState={{ disabled: !canEnd }}
            testID='end-button'
          >
            <ThemedText type='default' themeColor={canEnd ? 'text' : 'textSecondary'}>
              End
            </ThemedText>
          </Pressable>
        </ThemedView>

        {/* Instructions */}
        <ThemedView type='backgroundElement' style={styles.instructionsCard}>
          <ThemedText type='smallBold'>How it works</ThemedText>
          <ThemedText type='small' themeColor='textSecondary'>
            1. Tap Start to begin a Live Activity on your Lock Screen and Dynamic Island.
          </ThemedText>
          <ThemedText type='small' themeColor='textSecondary'>
            2. Tap Update to increment the counter — watch it update everywhere.
          </ThemedText>
          <ThemedText type='small' themeColor='textSecondary'>
            3. Tap End to dismiss the activity from all surfaces.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.two,
  },
  statusCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  errorCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
  noticeCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  instructionsCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
});
