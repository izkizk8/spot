/**
 * T030: index.tsx — Module manifest
 *
 * Default-exports the ModuleManifest for Swift Charts Lab.
 */

import type { ModuleManifest } from '../types';
import SwiftChartsLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'swift-charts-lab',
  title: 'Swift Charts Lab',
  description: 'Real Apple Charts on iOS 16+ with a React Native fallback',
  icon: {
    ios: 'chart.xyaxis.line',
    fallback: '📊',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0',
  render: () => <SwiftChartsLabScreen />,
};

export default manifest;
