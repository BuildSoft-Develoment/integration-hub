import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ConnectionDraft, ConnectionProviderType } from '@integration-hub/core/providers';
import { ConnectionJdbcFormComponent } from '../connection-jdbc-form/connection-jdbc-form.component';
import { ConnectionMongoDbFormComponent } from '../connection-mongodb-form/connection-mongodb-form.component';

@Component({
  selector: 'ih-connection-type-form-host',
  standalone: true,
  imports: [CommonModule, ConnectionJdbcFormComponent, ConnectionMongoDbFormComponent],
  template: `
    @switch (connectionType()) {
      @case ('MONGODB') {
        <ih-connection-mongodb-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" />
      }
      @default {
        <ih-connection-jdbc-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" />
      }
    }
  `,
})
export class ConnectionTypeFormHostComponent {
  readonly connectionType = input.required<ConnectionProviderType>();
  readonly draft = input.required<ConnectionDraft>();
  readonly readonly = input(false);
  readonly patchDraft = output<Partial<ConnectionDraft>>();
}
