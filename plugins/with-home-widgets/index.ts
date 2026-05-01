/**
 * with-home-widgets — composed Expo config plugin.
 *
 * Order matters:
 *   1. add-app-group       — entitlements on main app + (when present) the widget ext.
 *   2. add-swift-sources   — adds the Swift source files to the existing 007 widget extension target.
 *   3. add-widget-bundle   — synthesises ios-widget/SpotWidgetBundle.swift and strips @main from the live-activity widget.
 *
 * All three sub-plugins are idempotent. Running `expo prebuild --clean`
 * twice produces byte-identical output.
 *
 * @see specs/014-home-widgets/tasks.md T020
 */

import { ConfigPlugin } from '@expo/config-plugins';

import { withHomeWidgetsAppGroup } from './add-app-group';
import { withHomeWidgetsSwiftSources } from './add-swift-sources';
import { withHomeWidgetsBundle } from './add-widget-bundle';

const withHomeWidgets: ConfigPlugin = (config) => {
  config = withHomeWidgetsAppGroup(config);
  config = withHomeWidgetsSwiftSources(config);
  config = withHomeWidgetsBundle(config);
  return config;
};

export default withHomeWidgets;
