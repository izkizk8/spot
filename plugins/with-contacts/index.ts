/**
 * Config plugin: with-contacts
 * Adds NSContactsUsageDescription to Info.plist
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withInfoPlist } = configPlugins;
interface ContactsPluginProps {
  contactsUsageDescription?: string;
}

const withContacts: ConfigPlugin<ContactsPluginProps | void> = (config, props) => {
  const contactsUsageDescription =
    props?.contactsUsageDescription ||
    'This module demonstrates Contacts access for educational purposes.';

  return withInfoPlist(config, (plistConfig) => {
    plistConfig.modResults.NSContactsUsageDescription = contactsUsageDescription;
    return plistConfig;
  });
};

export default withContacts;
