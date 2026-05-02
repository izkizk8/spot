/**
 * StartupErrorOverlay
 *
 * Renders any React render-time error (caught by getDerivedStateFromError /
 * componentDidCatch) AND any uncaught JS error reported through React Native's
 * `ErrorUtils.setGlobalHandler` as a full-screen, selectable diagnostic view.
 *
 * Why this exists: sideloaded Release builds have no Metro/RedBox, so a top-level
 * JS throw produces a silent black screen. This overlay surfaces the actual
 * message + stack on-device so the failure can be diagnosed without Mac/Xcode.
 *
 * Self-contained on purpose: uses only react-native primitives (no theme hooks,
 * no Reanimated, no expo-image) so the overlay itself cannot be the thing that
 * fails to render.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface ErrorState {
  error: Error | null;
  componentStack: string | null;
  isFatal: boolean | null;
}

type GlobalErrorHandler = (error: Error, isFatal?: boolean) => void;

interface ErrorUtilsLike {
  getGlobalHandler?: () => GlobalErrorHandler | undefined;
  setGlobalHandler?: (handler: GlobalErrorHandler) => void;
}

function getErrorUtils(): ErrorUtilsLike | undefined {
  return (globalThis as unknown as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
}

export class StartupErrorOverlay extends React.Component<React.PropsWithChildren, ErrorState> {
  state: ErrorState = { error: null, componentStack: null, isFatal: null };

  static getDerivedStateFromError(error: unknown): Partial<ErrorState> {
    const err = error instanceof Error ? error : new Error(String(error));
    return { error: err, isFatal: true };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    const err = error instanceof Error ? error : new Error(String(error));
    this.setState({ error: err, componentStack: info.componentStack ?? null });
  }

  componentDidMount() {
    const eu = getErrorUtils();
    if (!eu?.setGlobalHandler) return;

    const previous = eu.getGlobalHandler?.();
    eu.setGlobalHandler((error, isFatal) => {
      const err = error instanceof Error ? error : new Error(String(error));
      this.setState((prev) => ({
        error: prev.error ?? err,
        componentStack: prev.componentStack,
        isFatal: isFatal ?? prev.isFatal,
      }));
      previous?.(error, isFatal);
    });
  }

  render() {
    const { error, componentStack, isFatal } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title} selectable>
            Startup error{isFatal ? ' (fatal)' : ''}
          </Text>

          <Text style={styles.label}>Message</Text>
          <Text style={styles.body} selectable>
            {error.message || '(no message)'}
          </Text>

          <Text style={styles.label}>Stack</Text>
          <Text style={styles.body} selectable>
            {error.stack ?? '(no stack)'}
          </Text>

          {componentStack ? (
            <>
              <Text style={styles.label}>Component stack</Text>
              <Text style={styles.body} selectable>
                {componentStack}
              </Text>
            </>
          ) : null}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 60,
  },
  title: {
    color: '#ff6b6b',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    color: '#9aa0a6',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  body: {
    color: '#f5f5f5',
    fontFamily: 'Courier New',
    fontSize: 12,
    lineHeight: 16,
  },
});
