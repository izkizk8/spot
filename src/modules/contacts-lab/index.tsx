/**
 * Contacts Lab Module Manifest
 * Feature: 038-contacts
 */

import type { ModuleManifest } from '../types';
import Screen from './screen';

const contactsLab: ModuleManifest = {
  id: 'contacts-lab',
  title: 'Contacts Lab',
  description:
    'iOS Contacts framework (CNContactStore) showcase: query, pick, create, update, and delete contacts via expo-contacts.',
  icon: {
    ios: 'person.crop.circle',
    fallback: '👤',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '9.0',
  render: () => <Screen />,
};

export default contactsLab;
