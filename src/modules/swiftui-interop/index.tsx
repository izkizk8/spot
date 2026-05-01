/**
 * @file index.tsx
 * @description SwiftUI Interop module manifest (T005)
 * Demonstrates embedding real SwiftUI views in React Native via @expo/ui/swift-ui.
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import SwiftUIInteropScreen from './screen';

const manifest: ModuleManifest = {
  id: 'swiftui-interop',
  title: 'SwiftUI Interop',
  description: 'Embed real SwiftUI controls inline with React Native',
  icon: { ios: 'swift', fallback: '🟦' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0',
  render: () => <SwiftUIInteropScreen />,
};

export default manifest;
