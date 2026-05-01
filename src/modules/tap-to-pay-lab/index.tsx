/**
 * Tap to Pay Lab Module Manifest
 * Feature: 051-tap-to-pay
 *
 * iOS 16+ educational module wrapping ProximityReader /
 * `PaymentCardReaderSession`. Demonstrates capability detection,
 * reader discovery, payment composer, accept payment flow,
 * result handling, and setup instructions.
 *
 * The Screen import is deferred inside `render()` so simply
 * importing the registry does not transitively load the native
 * bridge — the module is unavailable in the jsdom Jest
 * environment.
 */

import type { ModuleManifest } from '../types';

const tapToPayLab: ModuleManifest = {
  id: 'tap-to-pay-lab',
  title: 'Tap to Pay',
  description:
    'Educational lab for Tap to Pay on iPhone (iOS 16+). Demonstrates ProximityReader / PaymentCardReaderSession API: capability detection, reader discovery, payment composer (amount, currency, line items), accept payment flow, result handling (success / declined / error), and setup instructions. Requires Apple entitlement and PSP integration for real payments.',
  icon: {
    ios: 'creditcard.fill',
    fallback: '💳',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0',
  render: () => require('./screen').default,
};

export default tapToPayLab;
