/**
 * SharePlay Lab Module Manifest
 * Feature: 047-shareplay
 *
 * iOS 15+ educational module for Apple GroupActivities. Wraps a
 * custom thin Swift bridge (`SharePlayBridge.swift`) over a
 * `ShowcaseGroupActivity` plus `GroupSessionMessenger`.
 * Demonstrates capability detection, activity composition,
 * session lifecycle, participant tracking, and a live shared
 * Counter payload.
 *
 * The Screen import is deferred inside `render()` so simply
 * importing the registry does not transitively load the native
 * bridge — the module is unavailable in the jsdom Jest
 * environment.
 */

import type { ModuleManifest } from '../types';

const shareplayLab: ModuleManifest = {
  id: 'shareplay-lab',
  title: 'SharePlay Lab',
  description:
    'Educational lab for Apple GroupActivities (SharePlay, iOS 15+). Pick a demo activity (Counter / Drawing / Quiz), launch it from a FaceTime call, watch participants join, and broadcast a shared counter via GroupSessionMessenger. No entitlement or Info.plist key is required for the basic GroupActivity registration.',
  icon: {
    ios: 'shareplay',
    fallback: '🎬',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '15.0',
  render: () => require('./screen').default,
};

export default shareplayLab;
