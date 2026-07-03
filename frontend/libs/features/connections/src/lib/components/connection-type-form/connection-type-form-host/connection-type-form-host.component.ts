import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { ConnectionDraft, ConnectionProviderType } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { ConnectionJdbcFormComponent } from '../connection-jdbc-form/connection-jdbc-form.component';
import { ConnectionMongoDbFormComponent } from '../connection-mongodb-form/connection-mongodb-form.component';

@Component({
  selector: 'ih-connection-type-form-host',
  standalone: true,
  imports: [CommonModule, ConnectionJdbcFormComponent, ConnectionMongoDbFormComponent],
  template: `
    <!-- Selección explícita por familia; sin fallback silencioso a JDBC para tipos desconocidos. -->
    @switch (draft().family) {
      @case ('mongodb') {
        <ih-connection-mongodb-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" />
      }
      @case ('jdbc') {
        <ih-connection-jdbc-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" />
      }
      @default {
        <p class="connection-type-form-host__unsupported" role="alert">
          {{ i18n.t('common.unsupportedType') }}: <code>{{ connectionType() }}</code>
        </p>
      }
    }
  `,
})
export class ConnectionTypeFormHostComponent {
  readonly i18n = inject(I18nService);
  readonly connectionType = input.required<ConnectionProviderType>();
  readonly draft = input.required<ConnectionDraft>();
  readonly readonly = input(false);
  readonly patchDraft = output<Partial<ConnectionDraft>>();
}
