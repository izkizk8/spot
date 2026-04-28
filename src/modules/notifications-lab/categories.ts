// Category action definitions for notifications
export type CategoryId = 'yes-no' | 'snooze-done' | 'reply-text';

export interface CategoryAction {
  id: string;
  title: string;
  options?: {
    foreground?: boolean;
    destructive?: boolean;
  };
  textInput?: {
    placeholder: string;
    buttonTitle: string;
  };
}

export interface CategoryDefinition {
  identifier: CategoryId;
  actions: CategoryAction[];
}

export const CATEGORIES: readonly CategoryDefinition[] = [
  {
    identifier: 'yes-no',
    actions: [
      { id: 'yes', title: 'Yes', options: { foreground: true } },
      { id: 'no', title: 'No', options: { destructive: true } },
    ],
  },
  {
    identifier: 'snooze-done',
    actions: [
      { id: 'snooze', title: 'Snooze', options: { foreground: false } },
      { id: 'done', title: 'Done', options: { foreground: true } },
    ],
  },
  {
    identifier: 'reply-text',
    actions: [
      {
        id: 'reply',
        title: 'Reply',
        textInput: { placeholder: 'Reply…', buttonTitle: 'Send' },
      },
      { id: 'dismiss', title: 'Dismiss', options: { destructive: true } },
    ],
  },
] as const;

export const DEFAULT_CATEGORY_ID: CategoryId | null = null;
