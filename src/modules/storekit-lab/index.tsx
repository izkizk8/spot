/**
 * StoreKit 2 Lab Module Manifest
 * Feature: 050-storekit-2
 *
 * iOS 15+ educational module wrapping StoreKit 2
 * (`Product`, `Transaction`, `AppStore`) via a thin Swift bridge
 * (`StoreKitBridge.swift`). Demonstrates product loading,
 * purchase outcomes, current entitlements, transaction history,
 * subscription status, and the `AppStore.sync()` restore flow.
 *
 * The Screen import is deferred inside `render()` so simply
 * importing the registry does not transitively load the native
 * bridge — the module is unavailable in the jsdom Jest
 * environment.
 */

import type { ModuleManifest } from '../types';

const storekitLab: ModuleManifest = {
  id: 'storekit-lab',
  title: 'StoreKit 2',
  description:
    'Educational lab for StoreKit 2 (in-app purchases, iOS 15+). Demonstrates Product.products(ids), Product.purchase() outcomes (success / userCancelled / pending), Transaction.currentEntitlements, Transaction.all, subscription renewal status, and the AppStore.sync() restore flow. Real products require App Store Connect or a Configuration.storekit file in Xcode.',
  icon: {
    ios: 'cart',
    fallback: '🛒',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '15.0',
  render: () => require('./screen').default,
};

export default storekitLab;
