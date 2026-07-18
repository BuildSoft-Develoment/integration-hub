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

    // 012: ignorar los atajos globales (c/r/...) cuando hay un editor o dialog abierto. El foco puede no
    // estar en un input (p.ej. un boton dentro del editor) y la 'c' clickearia el "Nuevo" del fondo,
    // llevando a "Nuevo Proceso" mientras se edita una tarea.
    if (
      document.querySelector(
        'ih-managed-editor-shell, ih-process-task-modal, [role="dialog"], .mat-mdc-dialog-container, .cdk-dialog-container',
      )
    ) {
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
