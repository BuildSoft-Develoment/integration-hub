import { Injectable, signal } from '@angular/core';
import { ExecutionNavigationEntry, ProcessExecutionRecord } from '../models/execution.models';

@Injectable()
export class ExecutionNavigationService {
  private readonly stack = signal<ExecutionNavigationEntry[]>([]);

  readonly navigationStack = this.stack.asReadonly();

  reset(): void {
    this.stack.set([]);
  }

  trimTo(executionId: number): boolean {
    const existingIndex = this.stack().findIndex((entry) => entry.executionId === executionId);
    if (existingIndex < 0) {
      return false;
    }

    this.stack.set(this.stack().slice(0, existingIndex));
    return true;
  }

  pushCurrentExecution(current: ProcessExecutionRecord | null, nextExecutionId: number): void {
    if (!current || current.id === nextExecutionId) {
      return;
    }

    this.stack.update((stack) => [...stack, this.createNavigationEntry(current)]);
  }

  popPrevious(): ExecutionNavigationEntry | null {
    const stack = this.stack();
    const previous = stack[stack.length - 1] ?? null;
    if (!previous) {
      return null;
    }

    this.stack.set(stack.slice(0, -1));
    return previous;
  }

  private createNavigationEntry(execution: ProcessExecutionRecord): ExecutionNavigationEntry {
    return {
      executionId: execution.id,
      label: `Ejecucion ${execution.id}`,
    };
  }
}
