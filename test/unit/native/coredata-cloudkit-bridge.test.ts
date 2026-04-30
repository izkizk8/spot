/**
 * Core Data + CloudKit Bridge Test
 * Feature: 052-core-data-cloudkit
 *
 * Verifies the web/android stubs reject every method with
 * `CoreDataCloudKitNotSupported` and that `subscribe` returns a
 * no-op unsubscribe.
 */

import { describe, expect, it } from '@jest/globals';

import * as androidBridge from '@/native/coredata-cloudkit.android';
import * as webBridge from '@/native/coredata-cloudkit.web';
import { CoreDataCloudKitNotSupported } from '@/native/coredata-cloudkit.types';

describe('coredata-cloudkit web stub', () => {
  it('getAccountStatus rejects with CoreDataCloudKitNotSupported', async () => {
    await expect(webBridge.getAccountStatus()).rejects.toThrow(CoreDataCloudKitNotSupported);
  });

  it('fetchNotes rejects with CoreDataCloudKitNotSupported', async () => {
    await expect(webBridge.fetchNotes()).rejects.toThrow(CoreDataCloudKitNotSupported);
  });

  it('createNote rejects with CoreDataCloudKitNotSupported', async () => {
    await expect(webBridge.createNote({ title: 't', body: 'b' })).rejects.toThrow(
      CoreDataCloudKitNotSupported,
    );
  });

  it('updateNote rejects with CoreDataCloudKitNotSupported', async () => {
    await expect(webBridge.updateNote('id', { title: 't' })).rejects.toThrow(
      CoreDataCloudKitNotSupported,
    );
  });

  it('deleteNote rejects with CoreDataCloudKitNotSupported', async () => {
    await expect(webBridge.deleteNote('id')).rejects.toThrow(CoreDataCloudKitNotSupported);
  });

  it('simulateConflict rejects with CoreDataCloudKitNotSupported', async () => {
    await expect(webBridge.simulateConflict('id')).rejects.toThrow(CoreDataCloudKitNotSupported);
  });

  it('subscribe returns a no-op unsubscribe', () => {
    const unsubscribe = webBridge.subscribe(() => {});
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });

  it('default export is the bridge object', () => {
    expect(webBridge.default).toBeDefined();
    expect(typeof webBridge.default.getAccountStatus).toBe('function');
  });
});

describe('coredata-cloudkit android stub', () => {
  it('getAccountStatus rejects with CoreDataCloudKitNotSupported', async () => {
    await expect(androidBridge.getAccountStatus()).rejects.toThrow(CoreDataCloudKitNotSupported);
  });

  it('fetchNotes rejects with CoreDataCloudKitNotSupported', async () => {
    await expect(androidBridge.fetchNotes()).rejects.toThrow(CoreDataCloudKitNotSupported);
  });

  it('every other CRUD method rejects', async () => {
    await expect(androidBridge.createNote({ title: 't', body: 'b' })).rejects.toThrow(
      CoreDataCloudKitNotSupported,
    );
    await expect(androidBridge.updateNote('id', {})).rejects.toThrow(CoreDataCloudKitNotSupported);
    await expect(androidBridge.deleteNote('id')).rejects.toThrow(CoreDataCloudKitNotSupported);
    await expect(androidBridge.simulateConflict('id')).rejects.toThrow(
      CoreDataCloudKitNotSupported,
    );
  });

  it('subscribe returns a no-op unsubscribe', () => {
    const unsubscribe = androidBridge.subscribe(() => {});
    expect(typeof unsubscribe).toBe('function');
  });
});

describe('CoreDataCloudKitNotSupported', () => {
  it('carries the canonical name', () => {
    const err = new CoreDataCloudKitNotSupported('boom');
    expect(err.name).toBe('CoreDataCloudKitNotSupported');
    expect(err.message).toBe('boom');
  });
});
