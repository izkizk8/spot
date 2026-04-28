/**
 * Test suite for SecureNoteCard component.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SecureNoteCard from '@/modules/local-auth-lab/components/SecureNoteCard';

const noop = () => {};

describe('SecureNoteCard', () => {
  it('renders the empty state when no note is stored', () => {
    const { getByTestId } = render(
      <SecureNoteCard
        draft=""
        onDraftChange={noop}
        storedNote={null}
        revealed={false}
        onSave={noop}
        onView={noop}
        onClear={noop}
      />,
    );
    expect(getByTestId('localauth-securenote-empty')).toBeTruthy();
  });

  it('renders the hidden hint when a note is stored but not revealed', () => {
    const { getByTestId } = render(
      <SecureNoteCard
        draft=""
        onDraftChange={noop}
        storedNote="secret"
        revealed={false}
        onSave={noop}
        onView={noop}
        onClear={noop}
      />,
    );
    expect(getByTestId('localauth-securenote-hidden')).toBeTruthy();
  });

  it('reveals the note when revealed=true', () => {
    const { getByTestId } = render(
      <SecureNoteCard
        draft=""
        onDraftChange={noop}
        storedNote="my secret"
        revealed
        onSave={noop}
        onView={noop}
        onClear={noop}
      />,
    );
    expect(getByTestId('localauth-securenote-revealed')).toHaveTextContent('my secret');
  });

  it('disables Save when draft is empty', () => {
    const onSave = jest.fn();
    const { getByTestId } = render(
      <SecureNoteCard
        draft=""
        onDraftChange={noop}
        storedNote={null}
        revealed={false}
        onSave={onSave}
        onView={noop}
        onClear={noop}
      />,
    );
    fireEvent.press(getByTestId('localauth-securenote-save'));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('invokes Save when draft is non-empty', () => {
    const onSave = jest.fn();
    const { getByTestId } = render(
      <SecureNoteCard
        draft="x"
        onDraftChange={noop}
        storedNote={null}
        revealed={false}
        onSave={onSave}
        onView={noop}
        onClear={noop}
      />,
    );
    fireEvent.press(getByTestId('localauth-securenote-save'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('invokes View only when a note is stored', () => {
    const onView = jest.fn();
    const { getByTestId, rerender } = render(
      <SecureNoteCard
        draft=""
        onDraftChange={noop}
        storedNote={null}
        revealed={false}
        onSave={noop}
        onView={onView}
        onClear={noop}
      />,
    );
    fireEvent.press(getByTestId('localauth-securenote-view'));
    expect(onView).not.toHaveBeenCalled();

    rerender(
      <SecureNoteCard
        draft=""
        onDraftChange={noop}
        storedNote="x"
        revealed={false}
        onSave={noop}
        onView={onView}
        onClear={noop}
      />,
    );
    fireEvent.press(getByTestId('localauth-securenote-view'));
    expect(onView).toHaveBeenCalledTimes(1);
  });

  it('forwards draft text changes', () => {
    const onDraftChange = jest.fn();
    const { getByTestId } = render(
      <SecureNoteCard
        draft=""
        onDraftChange={onDraftChange}
        storedNote={null}
        revealed={false}
        onSave={noop}
        onView={noop}
        onClear={noop}
      />,
    );
    fireEvent.changeText(getByTestId('localauth-securenote-input'), 'hi');
    expect(onDraftChange).toHaveBeenCalledWith('hi');
  });
});
