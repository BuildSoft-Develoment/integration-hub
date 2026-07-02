import {
  InjectionToken,
  Injectable,
  Provider,
  Type,
  inject,
} from '@angular/core';
import { FormControl } from '@angular/forms';

import { SchemaFieldDescriptor } from './schema-form.models';

/**
 * Extensión del schema-form: un consumidor (feature o plugin) registra un **renderer de campo
 * custom** para un `type` que no es built-in (p.ej. `token-text` con autocompletado de fuentes).
 * Así se enriquece la config dirigida por schema sin que `shared/ui` dependa de internals de un
 * feature — el mismo patrón DI que `slots`/`actions`.
 *
 * El componente registrado debe exponer estos inputs (signals):
 *  - `field: SchemaFieldDescriptor`
 *  - `control: FormControl`  (el control ya creado en el FormGroup del schema-form)
 *  - `readonly: boolean`
 * y bindear `[formControl]="control()"` para participar en el formulario reactivo.
 */
export interface SchemaFieldRendererInputs {
  readonly field: SchemaFieldDescriptor;
  readonly control: FormControl;
  readonly readonly: boolean;
}

export interface SchemaFieldRendererRegistration {
  readonly type: string;
  readonly component: Type<unknown>;
}

export const SCHEMA_FIELD_RENDERERS = new InjectionToken<
  readonly SchemaFieldRendererRegistration[]
>('SCHEMA_FIELD_RENDERERS');

/** Registra uno o más renderers de campo custom (multi-provider). */
export function provideSchemaFieldRenderers(
  registrations: SchemaFieldRendererRegistration[]
): Provider[] {
  return registrations.map((registration) => ({
    provide: SCHEMA_FIELD_RENDERERS,
    useValue: registration,
    multi: true,
  }));
}

@Injectable({ providedIn: 'root' })
export class SchemaFieldRendererRegistry {
  private readonly byType = new Map<string, Type<unknown>>(
    (inject(SCHEMA_FIELD_RENDERERS, { optional: true }) ?? []).map(
      (registration) => [registration.type, registration.component]
    )
  );

  /** Componente custom para un `type`, o `null` si es un tipo built-in del schema-form. */
  rendererFor(type: string): Type<unknown> | null {
    return this.byType.get(type) ?? null;
  }
}
