/**
 * Documents Lab — module manifest.
 * feature 032 / T043.
 *
 * @see specs/032-document-picker-quicklook/contracts/manifest.contract.ts
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import DocumentsLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'documents-lab',
  title: 'Documents Lab',
  description:
    'iOS 11+ Document Picker + Quick Look showcase: pick files from the system Files app, preview via Quick Look, share, and filter by type.',
  icon: { ios: 'doc.on.doc', fallback: '📄' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '11.0',
  render: () => <DocumentsLabScreen />,
};

export default manifest;
