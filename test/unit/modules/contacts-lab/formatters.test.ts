/**
 * @jest-environment node
 */

import {
  formatPhoneNumber,
  formatEmail,
  formatContactName,
} from '../../../src/modules/contacts-lab/formatters';

describe('formatPhoneNumber', () => {
  it('formats 10-digit US phone numbers', () => {
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
  });

  it('formats 11-digit US phone numbers with country code', () => {
    expect(formatPhoneNumber('15551234567')).toBe('+1 (555) 123-4567');
  });

  it('returns original string for non-standard formats', () => {
    expect(formatPhoneNumber('555-123-4567')).toBe('555-123-4567');
  });

  it('returns N/A for undefined', () => {
    expect(formatPhoneNumber(undefined)).toBe('N/A');
  });
});

describe('formatEmail', () => {
  it('lowercases and trims email addresses', () => {
    expect(formatEmail('  John@EXAMPLE.COM  ')).toBe('john@example.com');
  });

  it('returns N/A for undefined', () => {
    expect(formatEmail(undefined)).toBe('N/A');
  });
});

describe('formatContactName', () => {
  it('uses name field if present', () => {
    expect(formatContactName({ name: 'John Doe' })).toBe('John Doe');
  });

  it('combines givenName and familyName', () => {
    expect(formatContactName({ givenName: 'John', familyName: 'Doe' })).toBe('John Doe');
  });

  it('returns Unnamed Contact if no name fields', () => {
    expect(formatContactName({})).toBe('Unnamed Contact');
  });
});
