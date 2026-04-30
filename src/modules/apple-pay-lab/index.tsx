/**
 * Apple Pay Lab Module Manifest
 * Feature: 049-apple-pay
 *
 * iOS 8+ educational module wrapping Apple Pay
 * (`PKPaymentAuthorizationController`) via a thin Swift bridge
 * (`ApplePayBridge.swift`). Demonstrates capability detection,
 * payment-request composition, summary items, contact-field
 * requirements, and the sandbox authorization flow that returns
 * an opaque payment token.
 *
 * The Screen import is deferred inside `render()` so simply
 * importing the registry does not transitively load the native
 * bridge — the module is unavailable in the jsdom Jest
 * environment.
 */

import type { ModuleManifest } from '../types';

const applePayLab: ModuleManifest = {
  id: 'apple-pay-lab',
  title: 'Apple Pay',
  description:
    'Educational lab for Apple Pay (PKPaymentAuthorizationController, iOS 8+). Detect support per network, compose a payment request with summary items and contact-field requirements, present the sandbox sheet, and inspect the resulting (mock) payment token. Real charges require a Merchant ID and a payment processor.',
  icon: {
    ios: 'applelogo',
    fallback: '💳',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '8.0',
  render: () => require('./screen').default,
};

export default applePayLab;
