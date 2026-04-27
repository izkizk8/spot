/**
 * Screen Time Lab — iOS variant.
 *
 * Mounts the reducer, runs the hydration sequence from
 * `data-model.md` §4 (probe → auth → selection), then renders the
 * `EntitlementBanner` (FR-009) followed by the four cards in the
 * FR-004 order: Authorization, Activity Selection, Shielding, Monitoring.
 *
 * Card-level rejections are caught inside each card and surfaced as
 * status text; this screen catches the residual `BRIDGE_ERROR` flow so
 * promise rejections never escape to the JS console (FR-023).
 *
 * @see specs/015-screentime-api/tasks.md T037
 */

import React, { useEffect, useReducer } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import bridge from '@/native/screentime';
import { ActivityPickerCard } from '@/modules/screentime-lab/components/ActivityPickerCard';
import { AuthorizationCard } from '@/modules/screentime-lab/components/AuthorizationCard';
import { EntitlementBanner } from '@/modules/screentime-lab/components/EntitlementBanner';
import { MonitoringCard } from '@/modules/screentime-lab/components/MonitoringCard';
import { ShieldingCard } from '@/modules/screentime-lab/components/ShieldingCard';
import { initialState, reducer } from '@/modules/screentime-lab/screentime-state';

export default function ScreenTimeLabScreen() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const available = await bridge.entitlementsAvailable();
        if (!mounted) return;
        dispatch({ type: 'ENTITLEMENT_PROBED', payload: { available } });
        if (!available) {
          // Hydration ends here on unentitled builds — every async bridge
          // call would reject with EntitlementMissingError.
          return;
        }
        try {
          const status = await bridge.getAuthorizationStatus();
          if (mounted) dispatch({ type: 'AUTH_STATUS_CHANGED', payload: { status } });
        } catch {
          // swallow — status stays at initial 'notDetermined'
        }
        // SELECTION_HYDRATED is reserved for App-Group-backed hydration
        // performed by the Swift layer; on JS-only builds we leave the
        // selection at null and let the user re-pick.
        if (mounted) dispatch({ type: 'SELECTION_HYDRATED', payload: { summary: null } });
      } catch {
        // entitlementsAvailable never throws; this is defensive.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // While the probe is in flight we conservatively show the banner (it
  // renders nothing once `entitlementsAvailable === true`).
  const showBanner = state.entitlementsAvailable === false;

  const onError = (message: string) => dispatch({ type: 'BRIDGE_ERROR', payload: { message } });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <EntitlementBanner visible={showBanner} />
      <AuthorizationCard
        authStatus={state.authStatus}
        onAuthorized={(status) => dispatch({ type: 'AUTH_STATUS_CHANGED', payload: { status } })}
        onError={onError}
      />
      <ActivityPickerCard
        selectionSummary={state.selectionSummary}
        onPicked={(summary) => dispatch({ type: 'SELECTION_PICKED', payload: { summary } })}
        onCleared={() => dispatch({ type: 'SELECTION_CLEARED' })}
        onError={onError}
      />
      <ShieldingCard
        selectionSummary={state.selectionSummary}
        shieldingActive={state.shieldingActive}
        onApplied={() => dispatch({ type: 'SHIELDING_APPLIED' })}
        onCleared={() => dispatch({ type: 'SHIELDING_CLEARED' })}
        onError={onError}
      />
      <MonitoringCard
        monitoringActive={state.monitoringActive}
        selectionSummary={state.selectionSummary}
        onStarted={(schedule) => dispatch({ type: 'MONITORING_STARTED', payload: { schedule } })}
        onStopped={() => dispatch({ type: 'MONITORING_STOPPED' })}
        onError={onError}
      />
    </ScrollView>
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
});
