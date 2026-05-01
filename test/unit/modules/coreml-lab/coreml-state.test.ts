/**
 * Reducer tests for CoreML Lab (feature 016).
 *
 * Covers every transition in the state machine from data-model.md.
 */

import {
  coreMLReducer,
  initialCoreMLState,
  type CoreMLAction,
} from '@/modules/coreml-lab/coreml-state';

describe('coreMLReducer', () => {
  it('returns initial state for unknown action', () => {
    const state = coreMLReducer(initialCoreMLState, { type: 'unknown' } as any);
    expect(state).toBe(initialCoreMLState);
  });

  it('handles pickImage action', () => {
    const action: CoreMLAction = {
      type: 'pickImage',
      payload: { source: 'sample', data: 'test-uri' },
    };
    const state = coreMLReducer(initialCoreMLState, action);
    expect(state.imageSource).toBe('sample');
    expect(state.imageData).toBe('test-uri');
    expect(state.error).toBeNull();
  });

  it('handles modelLoadStart action', () => {
    const action: CoreMLAction = {
      type: 'modelLoadStart',
      payload: { name: 'MobileNetV2' },
    };
    const state = coreMLReducer(initialCoreMLState, action);
    expect(state.status).toBe('loading-model');
    expect(state.error).toBeNull();
  });

  it('handles modelLoadSuccess action', () => {
    const action: CoreMLAction = {
      type: 'modelLoadSuccess',
      payload: { name: 'MobileNetV2', computeUnits: ['cpu', 'gpu'] },
    };
    const state = coreMLReducer(initialCoreMLState, action);
    expect(state.modelLoaded).toBe(true);
    expect(state.modelName).toBe('MobileNetV2');
    expect(state.computeUnits).toEqual(['cpu', 'gpu']);
    expect(state.status).toBe('ready');
    expect(state.error).toBeNull();
  });

  it('handles modelLoadFailure action', () => {
    const action: CoreMLAction = {
      type: 'modelLoadFailure',
      payload: { error: 'Model not found' },
    };
    const state = coreMLReducer(initialCoreMLState, action);
    expect(state.modelLoaded).toBe(false);
    expect(state.status).toBe('error');
    expect(state.error).toBe('Model not found');
  });

  it('handles classifyStart action', () => {
    const prevState = { ...initialCoreMLState, status: 'ready' as const };
    const action: CoreMLAction = { type: 'classifyStart' };
    const state = coreMLReducer(prevState, action);
    expect(state.status).toBe('classifying');
    expect(state.predictions).toEqual([]);
    expect(state.lastInferenceMs).toBeNull();
    expect(state.error).toBeNull();
  });

  it('prevents re-entry when classifyStart is dispatched during classifying', () => {
    const prevState = { ...initialCoreMLState, status: 'classifying' as const };
    const action: CoreMLAction = { type: 'classifyStart' };
    const state = coreMLReducer(prevState, action);
    expect(state).toBe(prevState);
  });

  it('handles classifySuccess action', () => {
    const prevState = { ...initialCoreMLState, status: 'classifying' as const };
    const action: CoreMLAction = {
      type: 'classifySuccess',
      payload: {
        predictions: [{ label: 'dog', confidence: 0.95 }],
        inferenceMs: 50,
      },
    };
    const state = coreMLReducer(prevState, action);
    expect(state.predictions).toEqual([{ label: 'dog', confidence: 0.95 }]);
    expect(state.lastInferenceMs).toBe(50);
    expect(state.status).toBe('ready');
    expect(state.error).toBeNull();
  });

  it('handles classifyFailure action', () => {
    const prevState = { ...initialCoreMLState, status: 'classifying' as const };
    const action: CoreMLAction = {
      type: 'classifyFailure',
      payload: { error: 'Inference failed' },
    };
    const state = coreMLReducer(prevState, action);
    expect(state.status).toBe('error');
    expect(state.error).toBe('Inference failed');
  });

  it('handles switchModel action', () => {
    const prevState = {
      ...initialCoreMLState,
      modelLoaded: true,
      predictions: [{ label: 'cat', confidence: 0.9 }],
      lastInferenceMs: 100,
    };
    const action: CoreMLAction = {
      type: 'switchModel',
      payload: { name: 'ResNet50' },
    };
    const state = coreMLReducer(prevState, action);
    expect(state.modelName).toBe('ResNet50');
    expect(state.modelLoaded).toBe(false);
    expect(state.predictions).toEqual([]);
    expect(state.lastInferenceMs).toBeNull();
    expect(state.status).toBe('loading-model');
  });

  it('handles reset action', () => {
    const prevState = {
      ...initialCoreMLState,
      imageData: 'test-uri',
      predictions: [{ label: 'bird', confidence: 0.8 }],
    };
    const action: CoreMLAction = { type: 'reset' };
    const state = coreMLReducer(prevState, action);
    expect(state).toEqual(initialCoreMLState);
  });
});
