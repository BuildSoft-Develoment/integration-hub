import { Injectable, computed, inject, signal } from '@angular/core';
import { ReaderRef } from '../models/process.models';
import { ProcessTaskFormModel } from '../models/process.models';
import { ProcessTaskBindingContextService } from './process-task-binding-context.service';

/**
 * Contexto de binding que el host de task-forms publica para los renderers de campo custom del
 * schema-form (p.ej. `token-text`): la tarea actual, las demás tareas y los readers, para que el
 * renderer pueda ofrecer el autocompletado de tokens `{fuente.output.campo}` sin acoplarse al host.
 *
 * Estado por signals: el host lo actualiza y los renderers lo leen. ADR-021: se provee UNA vez en
 * la pagina del catalogo de procesos (junto a `ProcessTaskManagerService`), no en root — asi puede
 * consultar los descriptores de los providers, que viven en ese mismo injector. Todos los
 * consumidores cuelgan de esa pagina, de modo que siguen compartiendo la misma instancia; y el
 * estado se descarta al salir de la pantalla en vez de vivir para siempre.
 */
@Injectable()
export class ProcessSchemaFieldContextService {
  private readonly bindingContext = inject(ProcessTaskBindingContextService);

  readonly task = signal<ProcessTaskFormModel | null>(null);
  readonly tasks = signal<readonly ProcessTaskFormModel[]>([]);
  readonly readers = signal<readonly ReaderRef[]>([]);

  set(
    task: ProcessTaskFormModel,
    tasks: readonly ProcessTaskFormModel[],
    readers: readonly ReaderRef[]
  ): void {
    this.task.set(task);
    this.tasks.set(tasks);
    this.readers.set(readers);
  }

  /** Opciones de token agrupadas para el contexto actual (vacío si no hay tarea). */
  readonly groupedOptions = computed(() => {
    const task = this.task();
    if (!task) {
      return [];
    }
    return this.bindingContext.groupOptions(
      this.bindingContext.buildOptions(task, this.tasks(), this.readers(), undefined)
    );
  });

  /** Token calificado a insertar para una opción. */
  tokenFor(optionKey: string): string {
    const task = this.task();
    if (!task) {
      return `{${optionKey}}`;
    }
    const option = this.bindingContext
      .buildOptions(task, this.tasks(), this.readers(), undefined)
      .find((o) => o.key === optionKey);
    return option ? `{${this.bindingContext.tokenForOption(option, '')}}` : `{${optionKey}}`;
  }
}
