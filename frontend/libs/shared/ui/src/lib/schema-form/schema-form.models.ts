/**
 * Contrato de formulario dirigido por schema. Un tipo contribuido por un plugin (connection,
 * source, reader, task…) declara sus campos de configuración con estos descriptores, y la UI
 * los renderiza dinámicamente con `ih-schema-form` — sin formularios hardcoded por tipo.
 *
 * Es el mismo contrato que el descriptor backend expone por `providedType`, de modo que un
 * plugin backend-only queda configurable en la UI sin enviar código frontend.
 */
export type SchemaFieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'textarea'
  | 'password'
  | 'secret';

export interface SchemaFieldOption {
  readonly value: string;
  /** Clave i18n para la etiqueta de la opción; si falta se usa `label` o el `value`. */
  readonly labelKey?: string;
  readonly label?: string;
}

export interface SchemaFieldDescriptor {
  readonly key: string;
  /**
   * Tipo built-in, o un `type` custom registrado con `provideSchemaFieldRenderers`
   * (p.ej. `token-text`). El `string & {}` preserva el autocompletado de los built-in.
   */
  readonly type: SchemaFieldType | (string & {});
  /** Clave i18n de la etiqueta; si falta se usa `label` o el `key`. */
  readonly labelKey?: string;
  readonly label?: string;
  readonly required?: boolean;
  readonly readonly?: boolean;
  readonly placeholder?: string;
  readonly placeholderKey?: string;
  /** Texto de ayuda (hint) bajo el campo. */
  readonly hintKey?: string;
  readonly hint?: string;
  /** Opciones para `select`. */
  readonly options?: readonly SchemaFieldOption[];
  /** Validación numérica. */
  readonly min?: number;
  readonly max?: number;
  /** Validación de texto (regex serializada). */
  readonly pattern?: string;
  /** Valor por defecto al construir el formulario. */
  readonly default?: unknown;
  /**
   * Visibilidad condicional: el campo solo se muestra (y se valida) cuando el campo referenciado
   * tiene el valor indicado. Los campos ocultos se deshabilitan (no afectan a la validez).
   */
  readonly visibleWhen?: {
    readonly field: string;
    readonly equals: unknown;
  };
}

export interface SchemaFormSchema {
  readonly fields: readonly SchemaFieldDescriptor[];
}

/** Valor de un formulario schema-driven: mapa clave → valor. */
export type SchemaFormValue = Record<string, unknown>;
