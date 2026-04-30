/**
 * LiDAR / RoomPlan Lab Module Manifest
 * Feature: 048-lidar-roomplan
 *
 * iOS 16+ educational module wrapping Apple's RoomPlan
 * framework via a thin Swift bridge (`RoomCaptureBridge.swift`).
 * Demonstrates LiDAR support detection, the RoomCaptureView
 * scan flow, captured-room storage, and USDZ export through
 * the existing share-sheet bridge (feature 033).
 *
 * The Screen import is deferred inside `render()` so simply
 * importing the registry does not transitively load the native
 * bridge — the module is unavailable in the jsdom Jest
 * environment.
 */

import type { ModuleManifest } from '../types';

const lidarRoomplanLab: ModuleManifest = {
  id: 'lidar-roomplan-lab',
  title: 'LiDAR / RoomPlan',
  description:
    'Educational lab for Apple RoomPlan (LiDAR, iOS 16+). Detect LiDAR support, launch a RoomCaptureView session, save the resulting parametric room (walls, windows, doors, openings, objects), and export a USDZ asset that ships through the iOS share sheet.',
  icon: {
    ios: 'cube.transparent',
    fallback: '🧱',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0',
  render: () => require('./screen').default,
};

export default lidarRoomplanLab;
