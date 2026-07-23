import { Component, input } from '@angular/core';

/**
 * Shell compartido de los formularios de tarea (extraido de MT101_BUILD_FROM_TABLE, ADR-018/UX).
 *
 * <p>Estandariza la estructura comun: un HEADER persistente (titulo + un "switch primario" opcional
 * proyectado, p.ej. Formato/Transporte/Modo/Canal) con el panel de runtime debajo, y un contenedor de
 * TABS que scrollea su contenido de forma consistente. El form consumidor proyecta:</p>
 * <ul>
 *   <li>{@code [shellSwitch]} — el control de contexto del header (opcional).</li>
 *   <li>{@code [shellRuntime]} — el {@code ih-process-task-runtime-panel} (el form conserva su cableado).</li>
 *   <li>contenido por defecto — su {@code mat-tab-group} con las tabs.</li>
 * </ul>
 * <p>Un hijo directo de una tab con la clase {@code tfs-fill} toma la altura restante (para workspaces de
 * mapeo paleta+board). El CSS de las tabs (::ng-deep .mat-mdc-tab-body-*) vive aca, no en cada form.</p>
 */
@Component({
  selector: 'ih-task-form-shell',
  standalone: true,
  templateUrl: './task-form-shell.component.html',
  styleUrl: './task-form-shell.component.css',
})
export class TaskFormShellComponent {
  /** Titulo del form (normalmente {@code i18n.t('processTask.<TYPE>')}); vacio = sin titulo. */
  readonly title = input('');
}
