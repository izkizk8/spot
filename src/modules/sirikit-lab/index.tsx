/**
 * SiriKit Lab Module Manifest
 * Feature: 071-sirikit
 *
 * iOS 10+ educational module demonstrating SiriKit Custom Intents
 * (INIntent / INExtension). Shows intent domains, the handling
 * lifecycle, vocabulary registration, and setup notes.
 *
 * The Screen import is deferred inside render() so simply importing
 * the registry does not transitively load the native bridge.
 */

import type { ModuleManifest } from '../types';

const siriKitLab: ModuleManifest = {
  id: 'sirikit-lab',
  title: 'SiriKit',
  description:
    'Educational lab for SiriKit Custom Intents (iOS 10+). Demonstrates INIntent subclasses, the INExtension handling lifecycle (pending → handling → response), vocabulary registration (user-specific and app-specific), and the NSSiriUsageDescription requirement. Includes simulated intents for messaging, note-taking, and reminder domains.',
  icon: {
    ios: 'mic.badge.plus',
    fallback: '🎙️',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '10.0',
  render: () => require('./screen').default,
};

export default siriKitLab;
