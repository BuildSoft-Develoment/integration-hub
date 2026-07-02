import { Injectable, signal } from '@angular/core';

export interface CriticalAction {
  id: string;
  label?: string;
  severity?: 'danger' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ActionDispatcherService {
  readonly armed = signal<string | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  dispatch(action: CriticalAction): boolean {
    if (this.armed() === action.id) {
      this.disarm();
      return true;
    }
    this.armed.set(action.id);
    this.clearTimer();
    this.timer = setTimeout(() => this.armed.set(null), 5000);
    return false;
  }

  disarm(): void {
    this.armed.set(null);
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
