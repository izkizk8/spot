import type { ModuleManifest } from '../registry';
import Screen from './screen';

const manifest: ModuleManifest = {
  id: 'notifications-lab',
  label: 'Notifications Lab',
  icon: 'bell.badge.fill',
  platforms: ['ios', 'android', 'web'],
  minIOS: '10.0',
  screen: Screen,
};

export default manifest;
