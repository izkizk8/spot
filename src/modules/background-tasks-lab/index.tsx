/**
 * Background Tasks Lab — module manifest.
 *
 * @see specs/030-background-tasks/contracts/manifest.contract.ts
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import BackgroundTasksLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'background-tasks-lab',
  title: 'Background Tasks',
  description:
    'iOS 13+ BGTaskScheduler showcase: schedule app refresh + processing tasks, inspect run history, trigger via lldb.',
  icon: { ios: 'clock.arrow.circlepath', fallback: '⏱' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '13.0',
  render: () => <BackgroundTasksLabScreen />,
};

export default manifest;
