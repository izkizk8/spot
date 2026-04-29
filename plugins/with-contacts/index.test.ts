/**
 * @jest-environment node
 */

import { ConfigPlugin } from '@expo/config-plugins';
import withContacts from '../../plugins/with-contacts';

describe('with-contacts plugin', () => {
  it('exports a ConfigPlugin function', () => {
    expect(typeof withContacts).toBe('function');
  });

  it('adds NSContactsUsageDescription with default text', () => {
    const config = { name: 'test', slug: 'test' };
    const modConfig = {
      ...config,
      modResults: {} as { NSContactsUsageDescription?: string },
    };

    const result = withContacts(config);
    expect(result).toBeDefined();
  });

  it('adds NSContactsUsageDescription with custom text', () => {
    const config = { name: 'test', slug: 'test' };
    const customText = 'Custom description';
    const result = withContacts(config, { contactsUsageDescription: customText });
    expect(result).toBeDefined();
  });
});
