import type { ModuleManifest } from '@/modules/types';
import Screen from './screen';

const manifest: ModuleManifest = {
  id: 'notifications-lab',
  title: 'Notifications Lab',
  description: 'Rich local notifications with actions, attachments, and triggers',
  icon: {
    ios: 'bell.badge.fill',
    fallback: '🔔',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '10.0',
  render: () => <Screen />,
};

export default manifest;
