import { InjectionToken, Provider, Type } from '@angular/core';
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

/**
 * Registra uno o más renderers de campo custom (multi-provider). Provéelo donde tenga sentido
 * (root, o el injector de un feature/ruta): `ih-schema-form` resuelve los renderers de su propio
 * injector, así que ve los registrados en cualquier ancestro.
 */
export function provideSchemaFieldRenderers(
  registrations: SchemaFieldRendererRegistration[]
): Provider[] {
  return registrations.map((registration) => ({
    provide: SCHEMA_FIELD_RENDERERS,
    useValue: registration,
    multi: true,
  }));
}

/** Construye el índice `type → component` desde las registraciones inyectadas. */
export function indexFieldRenderers(
  registrations: readonly SchemaFieldRendererRegistration[] | null
): Map<string, Type<unknown>> {
  return new Map((registrations ?? []).map((r) => [r.type, r.component]));
}
