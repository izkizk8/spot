/**
 * useContacts hook tests.
 * Feature: 038-contacts
 *
 * Tests hook state machine for Contacts module: authorization flow,
 * pagination, search, CRUD operations, picker, and error handling.
 * `expo-contacts` is mocked at the import boundary.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

const mockContacts: {
  getPermissionsAsync: jest.Mock;
  requestPermissionsAsync: jest.Mock;
  getContactsAsync: jest.Mock;
  addContactAsync: jest.Mock;
  updateContactAsync: jest.Mock;
  removeContactAsync: jest.Mock;
  getContactByIdAsync: jest.Mock;
  presentContactPickerAsync: jest.Mock;
  ContactTypes: { Person: string };
  Fields: {
    ID: string;
    Name: string;
    PhoneNumbers: string;
    Emails: string;
    Company: string;
  };
} = {
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
  addContactAsync: jest.fn(),
  updateContactAsync: jest.fn(),
  removeContactAsync: jest.fn(),
  getContactByIdAsync: jest.fn(),
  presentContactPickerAsync: jest.fn(),
  ContactTypes: { Person: 'person' },
  Fields: {
    ID: 'id',
    Name: 'name',
    PhoneNumbers: 'phoneNumbers',
    Emails: 'emails',
    Company: 'company',
  },
};

jest.mock('expo-contacts', () => ({
  __esModule: true,
  get getPermissionsAsync() {
    return mockContacts.getPermissionsAsync;
  },
  get requestPermissionsAsync() {
    return mockContacts.requestPermissionsAsync;
  },
  get getContactsAsync() {
    return mockContacts.getContactsAsync;
  },
  get addContactAsync() {
    return mockContacts.addContactAsync;
  },
  get updateContactAsync() {
    return mockContacts.updateContactAsync;
  },
  get removeContactAsync() {
    return mockContacts.removeContactAsync;
  },
  get getContactByIdAsync() {
    return mockContacts.getContactByIdAsync;
  },
  get presentContactPickerAsync() {
    return mockContacts.presentContactPickerAsync;
  },
  ContactTypes: { Person: 'person' },
  Fields: {
    ID: 'id',
    Name: 'name',
    PhoneNumbers: 'phoneNumbers',
    Emails: 'emails',
    Company: 'company',
  },
}));

import { useContacts } from '@/modules/contacts-lab/hooks/useContacts';

function resetMocks(): void {
  mockContacts.getPermissionsAsync
    .mockReset()
    .mockResolvedValue({ status: 'undetermined', granted: false, canAskAgain: true });
  mockContacts.requestPermissionsAsync
    .mockReset()
    .mockResolvedValue({ status: 'undetermined', granted: false, canAskAgain: true });
  mockContacts.getContactsAsync.mockReset().mockResolvedValue({ data: [], hasNextPage: false });
  mockContacts.addContactAsync.mockReset().mockResolvedValue('contact-1');
  mockContacts.updateContactAsync.mockReset().mockResolvedValue(undefined);
  mockContacts.removeContactAsync.mockReset().mockResolvedValue(undefined);
  mockContacts.getContactByIdAsync.mockReset().mockResolvedValue(null);
  mockContacts.presentContactPickerAsync.mockReset().mockResolvedValue(null);
}

const PlatformMutable = Platform as unknown as { OS: string };
const ORIGINAL_OS = PlatformMutable.OS;

describe('useContacts hook', () => {
  beforeEach(() => {
    resetMocks();
    PlatformMutable.OS = 'ios';
  });

  afterEach(() => {
    PlatformMutable.OS = ORIGINAL_OS;
  });

  // ─── Default state ────────────────────────────────────────────
  it('default state on mount', () => {
    const { result } = renderHook(() => useContacts());
    expect(result.current.status).toBe('notDetermined');
    expect(result.current.contacts).toEqual([]);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.inFlight).toBe(false);
    expect(result.current.lastError).toBe(null);
  });

  it('initializes status from getPermissionsAsync', async () => {
    mockContacts.getPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });

    const { result } = renderHook(() => useContacts());

    await waitFor(() => {
      expect(result.current.status).toBe('authorized');
    });
  });

  // ─── Web stub ─────────────────────────────────────────────────
  it('sets error on web platform', async () => {
    PlatformMutable.OS = 'web';
    const { result } = renderHook(() => useContacts());

    await waitFor(() => {
      expect(result.current.lastError).toBe('Web platform does not support Contacts.');
    });
  });

  // ─── Authorization flow ──────────────────────────────────────
  it('requestPermissions: notDetermined → request → authorized', async () => {
    mockContacts.requestPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: false,
    });

    const { result } = renderHook(() => useContacts());

    await act(async () => {
      await result.current.requestPermissions();
    });

    expect(result.current.status).toBe('authorized');
    expect(result.current.canAskAgain).toBe(false);
  });

  it('requestPermissions: denied status', async () => {
    mockContacts.requestPermissionsAsync.mockResolvedValue({
      status: 'denied',
      granted: false,
      canAskAgain: false,
    });

    const { result } = renderHook(() => useContacts());

    await act(async () => {
      await result.current.requestPermissions();
    });

    expect(result.current.status).toBe('denied');
    expect(result.current.canAskAgain).toBe(false);
  });

  it('requestPermissions: limited status (iOS 18+)', async () => {
    mockContacts.requestPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      accessPrivileges: 'limited',
    });

    const { result } = renderHook(() => useContacts());

    await act(async () => {
      await result.current.requestPermissions();
    });

    expect(result.current.status).toBe('limited');
    expect(result.current.accessPrivileges).toBe('limited');
  });

  it('requestPermissions: throws on web', async () => {
    PlatformMutable.OS = 'web';
    const { result } = renderHook(() => useContacts());

    await expect(result.current.requestPermissions()).rejects.toThrow(
      'Web platform does not support Contacts.',
    );
  });

  it('requestPermissions: handles errors', async () => {
    mockContacts.requestPermissionsAsync.mockRejectedValue(new Error('Permission error'));

    const { result } = renderHook(() => useContacts());

    await act(async () => {
      await result.current.requestPermissions();
    });

    expect(result.current.lastError).toBe('Permission error');
  });

  // ─── List pagination ─────────────────────────────────────────
  it('refresh loads first page of contacts', async () => {
    mockContacts.getContactsAsync.mockResolvedValue({
      data: [
        {
          id: 'c1',
          name: 'Alice Smith',
          firstName: 'Alice',
          lastName: 'Smith',
          phoneNumbers: [{ number: '1234567890', label: 'mobile' }],
        },
        {
          id: 'c2',
          name: 'Bob Jones',
          firstName: 'Bob',
          lastName: 'Jones',
          emails: [{ email: 'bob@example.com', label: 'work' }],
        },
      ],
      hasNextPage: true,
    });

    const { result } = renderHook(() => useContacts());

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.contacts).toHaveLength(2);
    expect(result.current.contacts[0]).toMatchObject({
      id: 'c1',
      name: 'Alice Smith',
      givenName: 'Alice',
      familyName: 'Smith',
    });
    expect(result.current.hasNextPage).toBe(true);
  });

  it('loadMore appends next page of contacts', async () => {
    mockContacts.getContactsAsync
      .mockResolvedValueOnce({
        data: [{ id: 'c1', name: 'Alice', firstName: 'Alice' }],
        hasNextPage: true,
      })
      .mockResolvedValueOnce({
        data: [{ id: 'c2', name: 'Bob', firstName: 'Bob' }],
        hasNextPage: false,
      });

    const { result } = renderHook(() => useContacts());

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.contacts).toHaveLength(1);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.contacts).toHaveLength(2);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('loadMore does nothing on web', async () => {
    PlatformMutable.OS = 'web';
    const { result } = renderHook(() => useContacts());

    await act(async () => {
      await result.current.loadMore();
    });

    expect(mockContacts.getContactsAsync).not.toHaveBeenCalled();
  });

  // ─── Search ──────────────────────────────────────────────────
  it('search queries contacts by name', async () => {
    mockContacts.getContactsAsync.mockResolvedValue({
      data: [{ id: 'c1', name: 'Alice Smith', firstName: 'Alice' }],
      hasNextPage: false,
    });

    const { result } = renderHook(() => useContacts());

    await act(async () => {
      await result.current.search('Alice');
    });

    expect(mockContacts.getContactsAsync).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Alice' }),
    );
    expect(result.current.contacts).toHaveLength(1);
  });

  it('search rejects empty query', async () => {
    const { result } = renderHook(() => useContacts());

    await act(async () => {
      await result.current.search('  ');
    });

    expect(result.current.lastError).toBe('Search query cannot be empty');
    expect(mockContacts.getContactsAsync).not.toHaveBeenCalled();
  });

  // ─── Create / Update / Delete ────────────────────────────────
  it('addContact creates a new contact', async () => {
    mockContacts.addContactAsync.mockResolvedValue('new-id');

    const { result } = renderHook(() => useContacts());

    let contactId: string | undefined;
    await act(async () => {
      contactId = await result.current.addContact({
        givenName: 'Charlie',
        familyName: 'Brown',
        phoneNumbers: [{ number: '5551234567', label: 'mobile' }],
      });
    });

    expect(contactId).toBe('new-id');
    expect(mockContacts.addContactAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Charlie',
        lastName: 'Brown',
        name: 'Charlie Brown',
      }),
    );
  });

  it('addContact throws on web', async () => {
    PlatformMutable.OS = 'web';
    const { result } = renderHook(() => useContacts());

    await expect(result.current.addContact({ givenName: 'Test' })).rejects.toThrow(
      'Web platform does not support Contacts.',
    );
  });

  it('updateContact updates existing contact', async () => {
    mockContacts.updateContactAsync.mockResolvedValue(undefined);

    const { result } = renderHook(() => useContacts());

    await act(async () => {
      await result.current.updateContact({
        id: 'c1',
        givenName: 'Alice',
        familyName: 'Updated',
      });
    });

    expect(mockContacts.updateContactAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c1',
        firstName: 'Alice',
        lastName: 'Updated',
        name: 'Alice Updated',
      }),
    );
  });

  it('updateContact requires id', async () => {
    const { result } = renderHook(() => useContacts());

    await expect(result.current.updateContact({ givenName: 'Test' })).rejects.toThrow(
      'Contact ID is required for update',
    );
  });

  it('removeContact deletes contact by id', async () => {
    mockContacts.removeContactAsync.mockResolvedValue(undefined);

    const { result } = renderHook(() => useContacts());

    await act(async () => {
      await result.current.removeContact('c1');
    });

    expect(mockContacts.removeContactAsync).toHaveBeenCalledWith('c1');
  });

  it('removeContact throws on web', async () => {
    PlatformMutable.OS = 'web';
    const { result } = renderHook(() => useContacts());

    await expect(result.current.removeContact('c1')).rejects.toThrow(
      'Web platform does not support Contacts.',
    );
  });

  // ─── Get by ID ───────────────────────────────────────────────
  it('getContactById retrieves single contact', async () => {
    mockContacts.getContactByIdAsync.mockResolvedValue({
      id: 'c1',
      name: 'Alice Smith',
      firstName: 'Alice',
    });

    const { result } = renderHook(() => useContacts());

    let contact;
    await act(async () => {
      contact = await result.current.getContactById('c1');
    });

    expect(contact).toMatchObject({ id: 'c1', name: 'Alice Smith' });
  });

  it('getContactById returns null when not found', async () => {
    mockContacts.getContactByIdAsync.mockResolvedValue(null);

    const { result } = renderHook(() => useContacts());

    let contact;
    await act(async () => {
      contact = await result.current.getContactById('missing');
    });

    expect(contact).toBeNull();
  });

  it('getContactById returns null on web', async () => {
    PlatformMutable.OS = 'web';
    const { result } = renderHook(() => useContacts());

    let contact;
    await act(async () => {
      contact = await result.current.getContactById('c1');
    });

    expect(contact).toBeNull();
  });

  // ─── Picker ──────────────────────────────────────────────────
  it('presentContactPicker returns selected contact', async () => {
    mockContacts.presentContactPickerAsync.mockResolvedValue({
      id: 'picked',
      name: 'Picked Contact',
      firstName: 'Picked',
    });

    const { result } = renderHook(() => useContacts());

    let contact;
    await act(async () => {
      contact = await result.current.presentContactPicker();
    });

    expect(contact).toMatchObject({ id: 'picked', name: 'Picked Contact' });
  });

  it('presentContactPicker returns null when cancelled', async () => {
    mockContacts.presentContactPickerAsync.mockResolvedValue(null);

    const { result } = renderHook(() => useContacts());

    let contact;
    await act(async () => {
      contact = await result.current.presentContactPicker();
    });

    expect(contact).toBeNull();
  });

  it('presentContactPicker returns null on web', async () => {
    PlatformMutable.OS = 'web';
    const { result } = renderHook(() => useContacts());

    let contact;
    await act(async () => {
      contact = await result.current.presentContactPicker();
    });

    expect(contact).toBeNull();
  });

  it('presentLimitedContactsPicker handles gracefully on web', async () => {
    PlatformMutable.OS = 'web';
    const { result } = renderHook(() => useContacts());

    // Web sets lastError on mount
    await waitFor(() => {
      expect(result.current.lastError).toBe('Web platform does not support Contacts.');
    });

    // Calling presentLimitedContactsPicker should not throw or change error
    await act(async () => {
      await result.current.presentLimitedContactsPicker();
    });

    // Error should remain the web error
    expect(result.current.lastError).toBe('Web platform does not support Contacts.');
  });

  // ─── Error handling ──────────────────────────────────────────
  it('handles getContactsAsync error', async () => {
    mockContacts.getContactsAsync.mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useContacts());

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.lastError).toBe('Fetch failed');
  });

  it('handles addContact error', async () => {
    mockContacts.addContactAsync.mockRejectedValue(new Error('Create failed'));

    const { result } = renderHook(() => useContacts());

    await expect(result.current.addContact({ givenName: 'Test' })).rejects.toThrow('Create failed');

    await waitFor(() => {
      expect(result.current.lastError).toBe('Create failed');
    });
  });

  // ─── inFlight tracking ───────────────────────────────────────
  it('sets inFlight during async operations', async () => {
    let resolveGetContacts: () => void;
    const promise = new Promise<{ data: []; hasNextPage: false }>((resolve) => {
      resolveGetContacts = () => resolve({ data: [], hasNextPage: false });
    });
    mockContacts.getContactsAsync.mockReturnValue(promise);

    const { result } = renderHook(() => useContacts());

    act(() => {
      void result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.inFlight).toBe(true);
    });

    await act(async () => {
      resolveGetContacts!();
      await promise;
    });

    await waitFor(() => {
      expect(result.current.inFlight).toBe(false);
    });
  });
});
