export type AuthorizationStatus = 'notDetermined' | 'denied' | 'authorized' | 'limited';

export interface Contact {
  id: string;
  name: string;
  givenName?: string;
  familyName?: string;
  phoneNumbers?: Array<{ number: string; label?: string }>;
  emails?: Array<{ email: string; label?: string }>;
  company?: string;
}

export interface ContactInput {
  id?: string;
  givenName?: string;
  familyName?: string;
  phoneNumbers?: Array<{ number: string; label?: string }>;
  emails?: Array<{ email: string; label?: string }>;
  company?: string;
}

export interface ContactsState {
  status: AuthorizationStatus;
  canAskAgain: boolean;
  accessPrivileges?: 'all' | 'limited' | 'none';
  contacts: Contact[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageOffset: number;
  inFlight: boolean;
  lastError: string | null;
  requestPermissions: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  search: (name: string) => Promise<void>;
  addContact: (input: ContactInput) => Promise<string>;
  updateContact: (input: ContactInput) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  getContactById: (id: string) => Promise<Contact | null>;
  presentContactPicker: () => Promise<Contact | null>;
  presentLimitedContactsPicker: () => Promise<void>;
}
