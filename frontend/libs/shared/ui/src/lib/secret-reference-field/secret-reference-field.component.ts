import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  isPlaintextSecret,
  isSecretReference,
  parseSecretReference,
  withSecretSource,
} from '@integration-hub/core/providers';
import { I18nService, SecretSourcesService } from '@integration-hub/core/services';

// @trace ADR-031 D6 (un solo componente para fuentes, conexiones y tareas), D1, D2, D7

/**
 * El campo donde se escribe una credencial, en las tres superficies que guardan una.
 *
 * <p><b>Por que uno solo.</b> Habia diez campos de credencial escritos a mano en ocho plantillas, y
 * no hacian lo mismo: siete pintaban el aviso de texto plano, y los de GCS y Azure Blob no pintaban
 * ninguno —aunque el guardado SI los bloquea—, asi que el operador se enteraba al fallar el guardado.
 * Diez copias son diez sitios donde arreglar el mismo fallo la proxima vez.</p>
 *
 * <p><b>Que ofrece el desplegable.</b> Los origenes que ESTE despliegue resuelve, preguntados al
 * backend (ADR-031 D1). Elegir uno reescribe el prefijo y respeta la ruta que ya hubiera. No ofrece
 * todavia las CLAVES concretas: eso es enumerar la boveda, y necesita la pieza de D3/D4, que aun no
 * existe. Cuando exista, entra aqui y en ningun otro sitio.</p>
 *
 * <p><b>El campo sigue aceptando texto libre</b> (D2). El desplegable asiste; no sustituye. Uno que
 * no supiera degradar a escritura manual romperia los despliegues en nube, donde los gestores de
 * secretos no se pueden enumerar.</p>
 */
@Component({
  selector: 'ih-secret-reference-field',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  template: `
    <mat-form-field [class]="fieldClass()" subscriptSizing="dynamic">
      <mat-label>{{ label() }}</mat-label>
      @if (multiline()) {
        <textarea
          matInput
          [rows]="rows()"
          [disabled]="readonly()"
          [ngModel]="value()"
          [ngModelOptions]="{ standalone: true }"
          (ngModelChange)="valueChange.emit($event)"
        ></textarea>
      } @else {
        <input
          matInput
          [type]="visible() ? 'text' : 'password'"
          [disabled]="readonly()"
          [ngModel]="value()"
          [ngModelOptions]="{ standalone: true }"
          (ngModelChange)="valueChange.emit($event)"
        />
      }

      @if (!multiline()) {
      <button
        matSuffix
        mat-icon-button
        type="button"
        [disabled]="readonly()"
        [attr.aria-label]="i18n.t(visible() ? 'secretField.hide' : 'secretField.show')"
        [matTooltip]="i18n.t(visible() ? 'secretField.hide' : 'secretField.show')"
        (click)="visible.set(!visible())"
      >
        <mat-icon>{{ visible() ? 'visibility_off' : 'visibility' }}</mat-icon>
      </button>
      }

      <button
        matSuffix
        mat-icon-button
        type="button"
        [disabled]="readonly()"
        [attr.aria-label]="i18n.t('secretField.chooseSource')"
        [matTooltip]="i18n.t('secretField.chooseSource')"
        [matMenuTriggerFor]="menu"
      >
        <mat-icon>key</mat-icon>
      </button>

      <mat-menu #menu="matMenu">
        @for (fuente of secretSources.sources(); track fuente.source) {
          <button mat-menu-item type="button" (click)="usarOrigen(fuente.source)">
            <code>{{ ejemplo(fuente.source) }}</code>
          </button>
        } @empty {
          <!-- Sin catalogo no se inventa una lista: decirlo es mas util que ofrecer un origen que
               quiza no resuelva aqui, que es justo el fallo que ADR-031 arregla. -->
          <span class="secret-field__empty">{{ i18n.t('secretField.noSources') }}</span>
        }
      </mat-menu>

      @if (error()) {
        <mat-error>{{ error() }}</mat-error>
      } @else {
        <mat-hint [class.secret-field__warn]="enClaro() || sinRuta() || origenDesconocido()">
          {{ hint() }}
        </mat-hint>
      }
    </mat-form-field>
  `,
  styles: [
    `
      .secret-field__warn {
        color: var(--mat-sys-error, #b3261e);
      }
      .secret-field__empty {
        display: block;
        padding: 0.5rem 1rem;
        opacity: 0.7;
      }
      code {
        font-family: var(--ih-font-mono, monospace);
      }
    `,
  ],
})
export class SecretReferenceFieldComponent {
  readonly i18n = inject(I18nService);
  readonly secretSources = inject(SecretSourcesService);

  /** Etiqueta YA traducida: cada superficie pone la suya (`ui.password`, `ui.accountKey`...). */
  readonly label = input('');
  readonly value = input<string | undefined>('');
  readonly readonly = input(false);
  /**
   * Multilinea: lo piden el JSON de service account de Google y el bearer de REST, que ya eran
   * `textarea` antes de existir este componente. Un textarea no admite `type=password`, asi que
   * ahi no hay interruptor de visibilidad —tampoco lo habia antes—.
   */
  readonly multiline = input(false);
  readonly rows = input(3);
  /**
   * Mensaje de error a pintar en vez del hint. Lo necesita `schema-form`, que valida por
   * `FormControl` y ya pintaba el suyo; sin esto, pasar por aqui le quitaria la validacion.
   */
  readonly error = input('');
  /** Clase extra, para que la plantilla que lo usa controle el ancho como hacia con su campo. */
  readonly fieldClass = input('');
  readonly valueChange = output<string>();

  /**
   * Empieza oculto y se puede revelar.
   *
   * <p>Una REFERENCIA no es un secreto y taparla estorba —no se puede comprobar lo que se escribio, y
   * escribirla bien es justo lo que esto intenta facilitar—, pero el campo tambien admite texto libre
   * y ahi si hay algo que tapar. Decidirlo por el contenido cambiaria el `type` del input mientras se
   * teclea; el interruptor lo deja en manos de quien mira.</p>
   */
  readonly visible = signal(false);

  constructor() {
    void this.secretSources.load();
  }

  private readonly referencia = computed(() => parseSecretReference(this.value()));

  protected readonly enClaro = computed(() => isPlaintextSecret(this.value()) && !this.sinRuta());

  /** `${vaultkv:}` recien elegido del desplegable: todavia no es referencia, y no es texto plano. */
  protected readonly sinRuta = computed(() =>
    /^\$\{[a-z]+:\}$/i.test(String(this.value() ?? '').trim()),
  );

  /**
   * El valor guardado usa un origen que este despliegue NO resuelve.
   *
   * <p>Es el fallo entero de ADR-031 hecho visible: un `${secret:...}` guardado cuando habia
   * file-vault sigue validando y guardandose en la VM, y revienta en ejecucion. Aqui se ve al abrir
   * la pantalla, en vez de en mitad de un proceso. Callado mientras no haya catalogo: sin respuesta
   * no se puede afirmar que algo no resuelve.</p>
   */
  protected readonly origenDesconocido = computed(() => {
    const actual = this.referencia();
    const catalogo = this.secretSources.sources();
    if (!actual || catalogo.length === 0) {
      return false;
    }
    return !catalogo.some((fuente) => fuente.source.toLowerCase() === actual.source.toLowerCase());
  });

  protected readonly hint = computed(() => {
    if (this.sinRuta()) {
      return this.i18n.t('secretField.missingPath');
    }
    if (this.enClaro()) {
      return this.i18n.t('sources.credentialPlaintext');
    }
    if (this.origenDesconocido()) {
      return this.i18n.t('secretField.unknownSource', {
        origen: this.referencia()?.source ?? '',
        prefijos: this.secretSources.prefijos(),
      });
    }
    if (isSecretReference(this.value())) {
      return this.i18n.t('schemaForm.secretRef');
    }
    return this.i18n.t('secretField.empty', { prefijos: this.secretSources.prefijos() });
  });

  protected ejemplo(source: string): string {
    return '${' + source + ':...}';
  }

  protected usarOrigen(source: string): void {
    if (this.readonly()) {
      return;
    }
    this.valueChange.emit(withSecretSource(this.value(), source));
  }
}
