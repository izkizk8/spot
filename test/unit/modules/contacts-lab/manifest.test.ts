/**
 * @jest-environment node
 */

import contactsLab from '@/modules/contacts-lab';

describe('Contacts Lab manifest', () => {
  it('has correct id', () => {
    expect(contactsLab.id).toBe('contacts-lab');
  });

  it('has title', () => {
    expect(contactsLab.title).toBe('Contacts Lab');
  });

  it('has description', () => {
    expect(contactsLab.description).toContain('Contacts');
  });

  it('has icon', () => {
    expect(contactsLab.icon).toEqual({
      ios: 'person.crop.circle',
      fallback: '👤',
    });
  });

  it('declares platforms', () => {
    expect(contactsLab.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('has minIOS', () => {
    expect(contactsLab.minIOS).toBe('9.0');
  });

  it('has render function', () => {
    expect(typeof contactsLab.render).toBe('function');
  });
});
