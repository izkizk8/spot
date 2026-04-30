/**
 * SwiftData Bridge Test
 * Feature: 053-swiftdata
 *
 * Verifies the web/android stubs reject every method with
 * `SwiftDataNotSupported`.
 */

import { describe, expect, it } from '@jest/globals';

import * as androidBridge from '@/native/swiftdata.android';
import * as webBridge from '@/native/swiftdata.web';
import { SwiftDataNotSupported } from '@/native/swiftdata.types';

describe('swiftdata web stub', () => {
  it('getSchemaInfo rejects with SwiftDataNotSupported', async () => {
    await expect(webBridge.getSchemaInfo()).rejects.toThrow(SwiftDataNotSupported);
  });

  it('fetchTasks rejects with SwiftDataNotSupported (with and without query)', async () => {
    await expect(webBridge.fetchTasks()).rejects.toThrow(SwiftDataNotSupported);
    await expect(webBridge.fetchTasks({ filter: 'all', sort: 'created' })).rejects.toThrow(
      SwiftDataNotSupported,
    );
  });

  it('createTask rejects with SwiftDataNotSupported', async () => {
    await expect(webBridge.createTask({ title: 't' })).rejects.toThrow(SwiftDataNotSupported);
  });

  it('updateTask rejects with SwiftDataNotSupported', async () => {
    await expect(webBridge.updateTask('id', { title: 't' })).rejects.toThrow(SwiftDataNotSupported);
  });

  it('deleteTask rejects with SwiftDataNotSupported', async () => {
    await expect(webBridge.deleteTask('id')).rejects.toThrow(SwiftDataNotSupported);
  });

  it('default export is the bridge object', () => {
    expect(webBridge.default).toBeDefined();
    expect(typeof webBridge.default.getSchemaInfo).toBe('function');
    expect(typeof webBridge.default.fetchTasks).toBe('function');
    expect(typeof webBridge.default.createTask).toBe('function');
    expect(typeof webBridge.default.updateTask).toBe('function');
    expect(typeof webBridge.default.deleteTask).toBe('function');
  });

  it('rejection messages mention the platform', async () => {
    await expect(webBridge.getSchemaInfo()).rejects.toThrow(/web/);
  });
});

describe('swiftdata android stub', () => {
  it('every method rejects with SwiftDataNotSupported', async () => {
    await expect(androidBridge.getSchemaInfo()).rejects.toThrow(SwiftDataNotSupported);
    await expect(androidBridge.fetchTasks()).rejects.toThrow(SwiftDataNotSupported);
    await expect(androidBridge.createTask({ title: 't' })).rejects.toThrow(SwiftDataNotSupported);
    await expect(androidBridge.updateTask('id', {})).rejects.toThrow(SwiftDataNotSupported);
    await expect(androidBridge.deleteTask('id')).rejects.toThrow(SwiftDataNotSupported);
  });

  it('rejection messages mention Android', async () => {
    await expect(androidBridge.getSchemaInfo()).rejects.toThrow(/Android/);
  });

  it('default export is the bridge object', () => {
    expect(androidBridge.default).toBeDefined();
    expect(typeof androidBridge.default.fetchTasks).toBe('function');
  });
});

describe('SwiftDataNotSupported', () => {
  it('carries the canonical name', () => {
    const err = new SwiftDataNotSupported('boom');
    expect(err.name).toBe('SwiftDataNotSupported');
    expect(err.message).toBe('boom');
  });

  it('is an Error subclass', () => {
    expect(new SwiftDataNotSupported('x')).toBeInstanceOf(Error);
  });
});
