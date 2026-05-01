/**
 * SwiftData Lab Module Manifest
 * Feature: 053-swiftdata
 *
 * iOS 17+ educational module wrapping SwiftData (`@Model`, `@Query`,
 * `ModelContext`, `FetchDescriptor`). Demonstrates schema info,
 * TaskItem CRUD, filter / sort, stats, and setup notes.
 *
 * The Screen import is deferred inside `render()` so simply importing
 * the registry does not transitively load the native bridge — the
 * module is unavailable in the jsdom Jest environment.
 */

import type { ModuleManifest } from '../types';

const swiftdataLab: ModuleManifest = {
  id: 'swiftdata-lab',
  title: 'SwiftData',
  description:
    'Educational lab for SwiftData (iOS 17+). Demonstrates the @Model macro, @Query, ModelContext, and FetchDescriptor on a TaskItem entity (title, completed, priority, dueDate). Includes filter (All / Active / Completed / Today), sort (Created / Priority / Due date), a stats card with priority counts and completion rate, and notes on the optional CloudKit-backed ModelContainer.',
  icon: {
    ios: 'tray.full',
    fallback: '🗂️',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '17.0',
  render: () => require('./screen').default,
};

export default swiftdataLab;
