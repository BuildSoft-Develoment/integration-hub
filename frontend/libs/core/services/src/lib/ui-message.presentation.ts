import { UiMessageKind } from './ui-message.service';

export interface UiMessagePresentation {
  iconPaths: readonly string[];
  iconViewBox?: string;
}

const PRESENTATIONS: Record<UiMessageKind, UiMessagePresentation> = {
  success: {
    iconPaths: ['M6 12.5 10 16.5 18 8.5'],
  },
  error: {
    iconPaths: ['M12 7.5v5.5', 'M12 16.5h.01'],
  },
  warning: {
    iconPaths: [
      'M12 8v5',
      'M12 16.25h.01',
      'M10.29 3.86 2.82 17a2 2 0 0 0 1.74 3h14.88a2 2 0 0 0 1.74-3L13.71 3.86a2 2 0 0 0-3.42 0Z',
    ],
  },
  info: {
    iconPaths: [
      'M12 10.25V16',
      'M12 7.75h.01',
      'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z',
    ],
  },
};

export function resolveUiMessagePresentation(kind: UiMessageKind): UiMessagePresentation {
  return PRESENTATIONS[kind];
}
