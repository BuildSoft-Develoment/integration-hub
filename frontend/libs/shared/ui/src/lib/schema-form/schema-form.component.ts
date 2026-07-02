import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  Type,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { I18nService } from '@integration-hub/core/services';

import {
  SCHEMA_FIELD_RENDERERS,
  indexFieldRenderers,
} from './schema-field-renderer';
import {
  SchemaFieldDescriptor,
  SchemaFormSchema,
  SchemaFormValue,
} from './schema-form.models';

/**
 * Renderiza dinámicamente un formulario a partir de un `SchemaFormSchema`. Es la pieza que
 * permite configurar en la UI un tipo contribuido por un plugin (incluido backend-only) sin
 * un formulario hardcoded: el plugin declara sus campos y esto los pinta y valida.
 *
 * Emite `valueChange` (el objeto completo) y `validChange` (validez del formulario). Los campos
 * `secret` se enmascaran; el valor es una **referencia** a un secreto, nunca el valor en claro.
 */
@Component({
  selector: 'ih-schema-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './schema-form.component.html',
  styleUrl: './schema-form.component.css',
})
export class SchemaFormComponent {
  readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);
  // Resuelto del injector propio → ve renderers registrados en cualquier ancestro (root/feature/ruta).
  private readonly fieldRenderers = indexFieldRenderers(
    inject(SCHEMA_FIELD_RENDERERS, { optional: true })
  );

  readonly schema = input.required<SchemaFormSchema>();
  readonly value = input<SchemaFormValue>({});
  readonly readonly = input(false);

  readonly valueChange = output<SchemaFormValue>();
  readonly validChange = output<boolean>();

  /** FormGroup construido desde el schema; signal para que el template reaccione al reconstruirlo. */
  protected readonly form = signal(new FormGroup<Record<string, FormControl>>({}));
  private currentSchema: SchemaFormSchema | null = null;

  constructor() {
    // Reconstruye el formulario cuando cambia el schema; luego aplica el valor entrante.
    effect(() => {
      const schema = this.schema();
      if (schema !== this.currentSchema) {
        this.currentSchema = schema;
        this.buildForm(schema);
      }
      this.applyIncomingValue(this.value());
      this.applyReadonly(this.readonly());
    });
  }

  protected fieldLabel(field: SchemaFieldDescriptor): string {
    return field.labelKey ? this.i18n.t(field.labelKey) : field.label ?? field.key;
  }

  protected fieldPlaceholder(field: SchemaFieldDescriptor): string {
    if (field.placeholderKey) {
      return this.i18n.t(field.placeholderKey);
    }
    return field.placeholder ?? '';
  }

  protected fieldHint(field: SchemaFieldDescriptor): string | null {
    if (field.hintKey) {
      return this.i18n.t(field.hintKey);
    }
    return field.hint ?? null;
  }

  protected optionLabel(option: {
    value: string;
    labelKey?: string;
    label?: string;
  }): string {
    return option.labelKey
      ? this.i18n.t(option.labelKey)
      : option.label ?? option.value;
  }

  protected control(key: string): FormControl {
    return this.form().controls[key];
  }

  /** Renderer custom registrado para un `type`, o `null` si es built-in. */
  protected customRenderer(type: string): Type<unknown> | null {
    return this.fieldRenderers.get(type) ?? null;
  }

  /** Inputs para el renderer custom (via NgComponentOutlet). */
  protected rendererInputs(field: SchemaFieldDescriptor): Record<string, unknown> {
    return { field, control: this.control(field.key), readonly: this.readonly() };
  }

  private buildForm(schema: SchemaFormSchema): void {
    const controls: Record<string, FormControl> = {};
    for (const field of schema.fields) {
      controls[field.key] = new FormControl(field.default ?? this.emptyFor(field), {
        nonNullable: false,
        validators: this.validatorsFor(field),
      });
    }
    const group = new FormGroup(controls);
    this.form.set(group);

    // Reemite el valor + validez ante cualquier cambio del usuario.
    group.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.valueChange.emit({ ...group.getRawValue() } as SchemaFormValue);
      this.validChange.emit(group.valid);
    });
    // Validez inicial (el form recién construido puede ser inválido por `required`).
    this.validChange.emit(group.valid);
  }

  private applyIncomingValue(value: SchemaFormValue): void {
    if (!this.currentSchema) {
      return;
    }
    const form = this.form();
    const patch: Record<string, unknown> = {};
    for (const field of this.currentSchema.fields) {
      if (value && Object.prototype.hasOwnProperty.call(value, field.key)) {
        patch[field.key] = value[field.key];
      }
    }
    // `emitEvent: false`: aplicar el valor externo no debe disparar `valueChange` (evita bucles).
    form.patchValue(patch, { emitEvent: false });
    this.validChange.emit(form.valid);
  }

  private applyReadonly(readonly: boolean): void {
    const form = this.form();
    if (readonly && form.enabled) {
      form.disable({ emitEvent: false });
    } else if (!readonly && form.disabled) {
      form.enable({ emitEvent: false });
    }
  }

  private validatorsFor(field: SchemaFieldDescriptor): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    if (field.required) {
      validators.push(field.type === 'boolean' ? Validators.requiredTrue : Validators.required);
    }
    if (field.type === 'number') {
      if (field.min !== undefined) {
        validators.push(Validators.min(field.min));
      }
      if (field.max !== undefined) {
        validators.push(Validators.max(field.max));
      }
    }
    if (field.pattern && (field.type === 'text' || field.type === 'password' || field.type === 'secret')) {
      validators.push(Validators.pattern(field.pattern));
    }
    return validators;
  }

  private emptyFor(field: SchemaFieldDescriptor): unknown {
    switch (field.type) {
      case 'boolean':
        return false;
      case 'number':
        return null;
      default:
        return '';
    }
  }
}
