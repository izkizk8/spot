import { CATEGORIES, DEFAULT_CATEGORY_ID } from '@/modules/notifications-lab/categories';

describe('categories', () => {
  it('has exactly 3 entries with documented ids', () => {
    expect(CATEGORIES).toHaveLength(3);
    const ids = CATEGORIES.map((c) => c.identifier);
    expect(ids).toEqual(['yes-no', 'snooze-done', 'reply-text']);
  });

  it('yes-no actions are yes (foreground) and no (destructive)', () => {
    const yesNo = CATEGORIES.find((c) => c.identifier === 'yes-no');
    expect(yesNo).toBeDefined();
    expect(yesNo?.actions).toHaveLength(2);

    const yes = yesNo?.actions.find((a) => a.id === 'yes');
    expect(yes?.options?.foreground).toBe(true);

    const no = yesNo?.actions.find((a) => a.id === 'no');
    expect(no?.options?.destructive).toBe(true);
  });

  it('snooze-done actions are snooze (background) and done (foreground)', () => {
    const snoozeDone = CATEGORIES.find((c) => c.identifier === 'snooze-done');
    expect(snoozeDone).toBeDefined();
    expect(snoozeDone?.actions).toHaveLength(2);

    const snooze = snoozeDone?.actions.find((a) => a.id === 'snooze');
    expect(snooze?.options?.foreground).toBe(false);

    const done = snoozeDone?.actions.find((a) => a.id === 'done');
    expect(done?.options?.foreground).toBe(true);
  });

  it('reply-text has reply with text input and dismiss (destructive)', () => {
    const replyText = CATEGORIES.find((c) => c.identifier === 'reply-text');
    expect(replyText).toBeDefined();
    expect(replyText?.actions).toHaveLength(2);

    const reply = replyText?.actions.find((a) => a.id === 'reply');
    expect(reply?.textInput?.placeholder).toBe('Reply…');
    expect(reply?.textInput?.buttonTitle).toBe('Send');

    const dismiss = replyText?.actions.find((a) => a.id === 'dismiss');
    expect(dismiss?.options?.destructive).toBe(true);
  });

  it('all action ids within a category are unique', () => {
    CATEGORIES.forEach((cat) => {
      const ids = cat.actions.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  it('DEFAULT_CATEGORY_ID is null', () => {
    expect(DEFAULT_CATEGORY_ID).toBeNull();
  });
});
