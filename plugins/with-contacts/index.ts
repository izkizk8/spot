/**
 * Config plugin: with-contacts
 * Adds NSContactsUsageDescription to Info.plist
 */

import { ConfigPlugin, withInfoPlist } from '@expo/config-plugins';

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
