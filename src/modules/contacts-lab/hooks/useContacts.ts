/**
 * useContacts hook — Contacts module state machine.
 * Feature: 038-contacts
 *
 * @see specs/038-contacts/contracts/hooks.md
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { Platform } from 'react-native';
import * as Contacts from 'expo-contacts';

import type { AuthorizationStatus, Contact, ContactInput, ContactsState } from '../types';

const PAGE_SIZE = 20;

interface State {
  status: AuthorizationStatus;
  canAskAgain: boolean;
  accessPrivileges?: 'all' | 'limited' | 'none';
  contacts: Contact[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageOffset: number;
  inFlight: boolean;
  lastError: string | null;
}

type Action =
  | {
      type: 'SET_STATUS';
      status: AuthorizationStatus;
      canAskAgain: boolean;
      accessPrivileges?: 'all' | 'limited' | 'none';
    }
  | { type: 'SET_CONTACTS'; contacts: Contact[]; hasNextPage: boolean; hasPreviousPage: boolean }
  | { type: 'APPEND_CONTACTS'; contacts: Contact[]; hasNextPage: boolean; hasPreviousPage: boolean }
  | { type: 'INCREMENT_PAGE_OFFSET' }
  | { type: 'RESET_PAGE_OFFSET' }
  | { type: 'SET_IN_FLIGHT'; inFlight: boolean }
  | { type: 'SET_ERROR'; error: string | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_STATUS':
      return {
        ...state,
        status: action.status,
        canAskAgain: action.canAskAgain,
        accessPrivileges: action.accessPrivileges,
      };
    case 'SET_CONTACTS':
      return {
        ...state,
        contacts: action.contacts,
        hasNextPage: action.hasNextPage,
        hasPreviousPage: action.hasPreviousPage,
      };
    case 'APPEND_CONTACTS':
      return {
        ...state,
        contacts: [...state.contacts, ...action.contacts],
        hasNextPage: action.hasNextPage,
        hasPreviousPage: action.hasPreviousPage,
      };
    case 'INCREMENT_PAGE_OFFSET':
      return { ...state, pageOffset: state.pageOffset + PAGE_SIZE };
    case 'RESET_PAGE_OFFSET':
      return { ...state, pageOffset: 0 };
    case 'SET_IN_FLIGHT':
      return { ...state, inFlight: action.inFlight };
    case 'SET_ERROR':
      return { ...state, lastError: action.error };
    default:
      return state;
  }
}

const INITIAL_STATE: State = {
  status: 'notDetermined',
  canAskAgain: true,
  accessPrivileges: undefined,
  contacts: [],
  hasNextPage: false,
  hasPreviousPage: false,
  pageOffset: 0,
  inFlight: false,
  lastError: null,
};

const WEB_ERROR = 'Web platform does not support Contacts.';

function mapPermissionStatus(
  response: Contacts.PermissionResponse,
  accessPrivileges?: 'all' | 'limited' | 'none',
): AuthorizationStatus {
  if (response.status === 'granted') {
    if (accessPrivileges === 'limited') {
      return 'limited';
    }
    return 'authorized';
  }
  if (response.status === 'denied') return 'denied';
  return 'notDetermined';
}

function mapContact(c: Contacts.Contact): Contact {
  return {
    id: c.id || '',
    name: c.name || 'Unnamed Contact',
    givenName: c.firstName,
    familyName: c.lastName,
    phoneNumbers: c.phoneNumbers?.map((p) => ({ number: p.number || '', label: p.label })),
    emails: c.emails?.map((e) => ({ email: e.email || '', label: e.label })),
    company: c.company,
  };
}

export function useContacts(): ContactsState {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const mounted = useRef(true);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  const safeDispatch = useCallback((action: Action) => {
    if (mounted.current) dispatch(action);
  }, []);

  const enqueue = useCallback(<T>(work: () => Promise<T>): Promise<T> => {
    const next = queueRef.current.then(work, work);
    queueRef.current = next.catch(() => undefined);
    return next;
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      safeDispatch({ type: 'SET_ERROR', error: WEB_ERROR });
      return;
    }
    (async () => {
      try {
        const response = await Contacts.getPermissionsAsync();
        const accessPrivileges = (response as { accessPrivileges?: 'all' | 'limited' | 'none' })
          .accessPrivileges;
        const status = mapPermissionStatus(response, accessPrivileges);
        safeDispatch({
          type: 'SET_STATUS',
          status,
          canAskAgain: response.canAskAgain ?? true,
          accessPrivileges,
        });
      } catch (e) {
        safeDispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
      }
    })();
  }, [safeDispatch]);

  const requestPermissions = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'web') {
      throw new Error(WEB_ERROR);
    }
    return enqueue(async () => {
      try {
        safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: true });
        safeDispatch({ type: 'SET_ERROR', error: null });
        const response = await Contacts.requestPermissionsAsync();
        const accessPrivileges = (response as { accessPrivileges?: 'all' | 'limited' | 'none' })
          .accessPrivileges;
        const status = mapPermissionStatus(response, accessPrivileges);
        safeDispatch({
          type: 'SET_STATUS',
          status,
          canAskAgain: response.canAskAgain ?? true,
          accessPrivileges,
        });
      } catch (e) {
        safeDispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
      } finally {
        safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: false });
      }
    });
  }, [enqueue, safeDispatch]);

  const refresh = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: true });
      safeDispatch({ type: 'SET_ERROR', error: null });
      safeDispatch({ type: 'RESET_PAGE_OFFSET' });
      const result = await Contacts.getContactsAsync({
        pageSize: PAGE_SIZE,
        pageOffset: 0,
        fields: [
          Contacts.Fields.ID,
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Company,
        ],
      });
      const contacts = result.data.map(mapContact);
      safeDispatch({
        type: 'SET_CONTACTS',
        contacts,
        hasNextPage: result.hasNextPage ?? false,
        hasPreviousPage: result.hasPreviousPage ?? false,
      });
    } catch (e) {
      safeDispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
    } finally {
      safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: false });
    }
  }, [safeDispatch]);

  const loadMore = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'web' || !state.hasNextPage) return;
    try {
      safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: true });
      safeDispatch({ type: 'SET_ERROR', error: null });
      const nextOffset = state.pageOffset + PAGE_SIZE;
      const result = await Contacts.getContactsAsync({
        pageSize: PAGE_SIZE,
        pageOffset: nextOffset,
        fields: [
          Contacts.Fields.ID,
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Company,
        ],
      });
      const contacts = result.data.map(mapContact);
      safeDispatch({
        type: 'APPEND_CONTACTS',
        contacts,
        hasNextPage: result.hasNextPage ?? false,
        hasPreviousPage: result.hasPreviousPage ?? false,
      });
      safeDispatch({ type: 'INCREMENT_PAGE_OFFSET' });
    } catch (e) {
      safeDispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
    } finally {
      safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: false });
    }
  }, [state.hasNextPage, state.pageOffset, safeDispatch]);

  const search = useCallback(
    async (name: string): Promise<void> => {
      if (Platform.OS === 'web') return;
      if (!name.trim()) {
        safeDispatch({ type: 'SET_ERROR', error: 'Search query cannot be empty' });
        return;
      }
      try {
        safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: true });
        safeDispatch({ type: 'SET_ERROR', error: null });
        safeDispatch({ type: 'RESET_PAGE_OFFSET' });
        const result = await Contacts.getContactsAsync({
          pageSize: PAGE_SIZE,
          pageOffset: 0,
          name,
          fields: [
            Contacts.Fields.ID,
            Contacts.Fields.Name,
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Emails,
            Contacts.Fields.Company,
          ],
        });
        const contacts = result.data.map(mapContact);
        safeDispatch({
          type: 'SET_CONTACTS',
          contacts,
          hasNextPage: result.hasNextPage ?? false,
          hasPreviousPage: result.hasPreviousPage ?? false,
        });
      } catch (e) {
        safeDispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
      } finally {
        safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: false });
      }
    },
    [safeDispatch],
  );

  const addContact = useCallback(
    async (input: ContactInput): Promise<string> => {
      if (Platform.OS === 'web') {
        throw new Error(WEB_ERROR);
      }
      return enqueue(async () => {
        try {
          safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: true });
          safeDispatch({ type: 'SET_ERROR', error: null });
          const contactInput: Contacts.Contact = {
            contactType: Contacts.ContactTypes.Person,
            name: [input.givenName, input.familyName].filter(Boolean).join(' ') || 'Unnamed',
            firstName: input.givenName,
            lastName: input.familyName,
            phoneNumbers: input.phoneNumbers?.map((p) => ({
              number: p.number,
              label: p.label || 'mobile',
            })),
            emails: input.emails?.map((e) => ({ email: e.email, label: e.label || 'home' })),
            company: input.company,
          };
          const id = await Contacts.addContactAsync(contactInput);
          return id;
        } catch (e) {
          const error = e instanceof Error ? e.message : String(e);
          safeDispatch({ type: 'SET_ERROR', error });
          throw new Error(error);
        } finally {
          safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: false });
        }
      });
    },
    [enqueue, safeDispatch],
  );

  const updateContact = useCallback(
    async (input: ContactInput): Promise<void> => {
      if (Platform.OS === 'web') {
        throw new Error(WEB_ERROR);
      }
      if (!input.id) {
        throw new Error('Contact ID is required for update');
      }
      return enqueue(async () => {
        try {
          safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: true });
          safeDispatch({ type: 'SET_ERROR', error: null });
          const contactInput: Contacts.Contact = {
            id: input.id,
            contactType: Contacts.ContactTypes.Person,
            name: [input.givenName, input.familyName].filter(Boolean).join(' ') || 'Unnamed',
            firstName: input.givenName,
            lastName: input.familyName,
            phoneNumbers: input.phoneNumbers?.map((p) => ({
              number: p.number,
              label: p.label || 'mobile',
            })),
            emails: input.emails?.map((e) => ({ email: e.email, label: e.label || 'home' })),
            company: input.company,
          };
          await Contacts.updateContactAsync(contactInput);
        } catch (e) {
          const error = e instanceof Error ? e.message : String(e);
          safeDispatch({ type: 'SET_ERROR', error });
          throw new Error(error);
        } finally {
          safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: false });
        }
      });
    },
    [enqueue, safeDispatch],
  );

  const removeContact = useCallback(
    async (id: string): Promise<void> => {
      if (Platform.OS === 'web') {
        throw new Error(WEB_ERROR);
      }
      return enqueue(async () => {
        try {
          safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: true });
          safeDispatch({ type: 'SET_ERROR', error: null });
          await Contacts.removeContactAsync(id);
        } catch (e) {
          const error = e instanceof Error ? e.message : String(e);
          safeDispatch({ type: 'SET_ERROR', error });
          throw new Error(error);
        } finally {
          safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: false });
        }
      });
    },
    [enqueue, safeDispatch],
  );

  const getContactById = useCallback(
    async (id: string): Promise<Contact | null> => {
      if (Platform.OS === 'web') return null;
      try {
        const contact = await Contacts.getContactByIdAsync(id);
        if (!contact) return null;
        return mapContact(contact);
      } catch (e) {
        safeDispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
        return null;
      }
    },
    [safeDispatch],
  );

  const presentContactPicker = useCallback(async (): Promise<Contact | null> => {
    if (Platform.OS === 'web') return null;
    try {
      const contact = await Contacts.presentContactPickerAsync();
      if (!contact) return null;
      return mapContact(contact);
    } catch (e) {
      safeDispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
      return null;
    }
  }, [safeDispatch]);

  const presentLimitedContactsPicker = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      if (
        typeof (Contacts as { presentLimitedContactsPickerAsync?: unknown })
          .presentLimitedContactsPickerAsync === 'function'
      ) {
        await (
          Contacts as { presentLimitedContactsPickerAsync: () => Promise<void> }
        ).presentLimitedContactsPickerAsync();
      } else {
        await Contacts.presentContactPickerAsync();
      }
    } catch (e) {
      safeDispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
    }
  }, [safeDispatch]);

  return {
    status: state.status,
    canAskAgain: state.canAskAgain,
    accessPrivileges: state.accessPrivileges,
    contacts: state.contacts,
    hasNextPage: state.hasNextPage,
    hasPreviousPage: state.hasPreviousPage,
    pageOffset: state.pageOffset,
    inFlight: state.inFlight,
    lastError: state.lastError,
    requestPermissions,
    refresh,
    loadMore,
    search,
    addContact,
    updateContact,
    removeContact,
    getContactById,
    presentContactPicker,
    presentLimitedContactsPicker,
  };
}
