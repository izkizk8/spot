/**
 * @jest-environment node
 *
 * PencilKit Bridge Test
 * Feature: 082-pencilkit
 *
 * Verifies the web/android stubs reject every method with
 * `PencilKitNotSupported`.
 */

import { describe, expect, it } from '@jest/globals';

import * as androidBridge from '@/native/pencilkit.android';
import * as webBridge from '@/native/pencilkit.web';
import { PencilKitNotSupported } from '@/native/pencilkit.types';

describe('pencilkit web stub', () => {
  it('getCanvasInfo rejects with PencilKitNotSupported', async () => {
    await expect(webBridge.getCanvasInfo()).rejects.toThrow(PencilKitNotSupported);
  });

  it('newDrawing / clearDrawing reject', async () => {
    await expect(webBridge.newDrawing()).rejects.toThrow(PencilKitNotSupported);
    await expect(webBridge.clearDrawing()).rejects.toThrow(PencilKitNotSupported);
  });

  it('getDrawingStats rejects', async () => {
    await expect(webBridge.getDrawingStats()).rejects.toThrow(PencilKitNotSupported);
  });

  it('setTool rejects', async () => {
    await expect(webBridge.setTool('pen', 4, '#000')).rejects.toThrow(PencilKitNotSupported);
  });

  it('setDrawingPolicy rejects', async () => {
    await expect(webBridge.setDrawingPolicy('default')).rejects.toThrow(PencilKitNotSupported);
  });

  it('export / import data reject', async () => {
    await expect(webBridge.exportDrawingData()).rejects.toThrow(PencilKitNotSupported);
    await expect(webBridge.importDrawingData('data')).rejects.toThrow(PencilKitNotSupported);
  });

  it('default export is the bridge object', () => {
    expect(webBridge.default).toBeDefined();
    expect(typeof webBridge.default.getCanvasInfo).toBe('function');
    expect(typeof webBridge.default.newDrawing).toBe('function');
    expect(typeof webBridge.default.clearDrawing).toBe('function');
    expect(typeof webBridge.default.getDrawingStats).toBe('function');
    expect(typeof webBridge.default.setTool).toBe('function');
    expect(typeof webBridge.default.setDrawingPolicy).toBe('function');
    expect(typeof webBridge.default.exportDrawingData).toBe('function');
    expect(typeof webBridge.default.importDrawingData).toBe('function');
  });

  it('rejection messages mention web', async () => {
    await expect(webBridge.getCanvasInfo()).rejects.toThrow(/web/);
  });
});

describe('pencilkit android stub', () => {
  it('every method rejects with PencilKitNotSupported', async () => {
    await expect(androidBridge.getCanvasInfo()).rejects.toThrow(PencilKitNotSupported);
    await expect(androidBridge.newDrawing()).rejects.toThrow(PencilKitNotSupported);
    await expect(androidBridge.clearDrawing()).rejects.toThrow(PencilKitNotSupported);
    await expect(androidBridge.getDrawingStats()).rejects.toThrow(PencilKitNotSupported);
    await expect(androidBridge.setTool('pen', 4, '#000')).rejects.toThrow(PencilKitNotSupported);
    await expect(androidBridge.setDrawingPolicy('default')).rejects.toThrow(PencilKitNotSupported);
    await expect(androidBridge.exportDrawingData()).rejects.toThrow(PencilKitNotSupported);
    await expect(androidBridge.importDrawingData('x')).rejects.toThrow(PencilKitNotSupported);
  });

  it('rejection messages mention Android', async () => {
    await expect(androidBridge.getCanvasInfo()).rejects.toThrow(/Android/);
  });

  it('default export is the bridge object', () => {
    expect(androidBridge.default).toBeDefined();
    expect(typeof androidBridge.default.getCanvasInfo).toBe('function');
  });
});

describe('PencilKitNotSupported', () => {
  it('carries the canonical name', () => {
    const err = new PencilKitNotSupported('boom');
    expect(err.name).toBe('PencilKitNotSupported');
    expect(err.message).toBe('boom');
  });

  it('is an Error subclass', () => {
    expect(new PencilKitNotSupported('x')).toBeInstanceOf(Error);
  });
});
