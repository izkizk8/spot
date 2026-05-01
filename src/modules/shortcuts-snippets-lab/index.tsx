/**
 * Shortcuts Snippets Lab Module Manifest
 * Feature: 072-shortcuts-snippets
 *
 * iOS 12+ educational module demonstrating Shortcuts app integration
 * via INUIAddVoiceShortcutViewController and custom Intent UI snippets
 * (confirmation + result snippet UIs).
 *
 * The Screen import is deferred inside render() so simply importing
 * the registry does not transitively load the native bridge.
 */

import type { ModuleManifest } from '../types';

const shortcutsSnippetsLab: ModuleManifest = {
  id: 'shortcuts-snippets-lab',
  title: 'Shortcuts Snippets',
  description:
    'Educational lab for Shortcuts app integration (iOS 12+). Demonstrates INUIAddVoiceShortcutViewController for adding voice phrases, custom Intent UI snippet UIs (confirmation and result), shortcut donation via INInteraction, and the snippet rendering lifecycle. Covers both confirmation snippets (shown before execution) and result snippets (shown after).',
  icon: {
    ios: 'scissors.badge.ellipsis',
    fallback: '✂️',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '12.0',
  render: () => require('./screen').default,
};

export default shortcutsSnippetsLab;
