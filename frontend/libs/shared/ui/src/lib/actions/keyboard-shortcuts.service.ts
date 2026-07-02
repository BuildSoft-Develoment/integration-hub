import { Injectable } from '@angular/core';

export interface KeyboardShortcut {
  key: string;
  description: string;
  handler: () => void;
  preventDefault?: boolean;
}

export type KeyboardShortcutRegistration = () => void;

@Injectable({ providedIn: 'root' })
export class KeyboardShortcutsService {
  private shortcuts: KeyboardShortcut[] = [];
  private listener?: (event: KeyboardEvent) => void;

  register(shortcuts: readonly KeyboardShortcut[]): KeyboardShortcutRegistration {
    const entries = [...shortcuts];
    this.shortcuts.push(...entries);
    if (this.listener) {
      return () => this.unregister(entries);
    }
    this.listener = (event: KeyboardEvent) => this.onKeyDown(event);
    document.addEventListener('keydown', this.listener);

    return () => this.unregister(entries);
  }

  clear(): void {
    this.shortcuts = [];
    this.detachListener();
  }

  private unregister(entries: readonly KeyboardShortcut[]): void {
    this.shortcuts = this.shortcuts.filter((shortcut) => !entries.includes(shortcut));
    if (this.shortcuts.length === 0) {
      this.detachListener();
    }
  }

  private detachListener(): void {
    if (this.listener) {
      document.removeEventListener('keydown', this.listener);
      this.listener = undefined;
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (this.shouldIgnoreEvent(event)) {
      return;
    }

    const shortcut = this.shortcuts.find((s) => s.key === event.key);
    if (!shortcut) {
      return;
    }
    if (shortcut.preventDefault !== false) {
      event.preventDefault();
    }
    shortcut.handler();
  }

  private shouldIgnoreEvent(event: KeyboardEvent): boolean {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return true;
    }

    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return Boolean(
      target.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"], [role="combobox"], [role="searchbox"], [role="spinbutton"]',
      ),
    );
  }
}
