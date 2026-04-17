import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { SourceDraft, SourceProviderType } from '@integration-hub/core/providers';
import { SourceFilesystemFormComponent } from '../source-filesystem-form/source-filesystem-form.component';
import { SourceFtpFormComponent } from '../source-ftp-form/source-ftp-form.component';
import { SourceRestFormComponent } from '../source-rest-form/source-rest-form.component';
import { SourceSftpFormComponent } from '../source-sftp-form/source-sftp-form.component';

@Component({
  selector: 'ih-source-type-form-host',
  standalone: true,
  imports: [CommonModule, SourceFilesystemFormComponent, SourceFtpFormComponent, SourceSftpFormComponent, SourceRestFormComponent],
  template: `
    @switch (sourceType()) {
      @case ('FILESYSTEM') { <ih-source-filesystem-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" /> }
      @case ('FTP') { <ih-source-ftp-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" /> }
      @case ('SFTP') { <ih-source-sftp-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" /> }
      @case ('REST') { <ih-source-rest-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" /> }
    }
  `,
})
export class SourceTypeFormHostComponent {
  readonly sourceType = input.required<SourceProviderType>();
  readonly draft = input.required<SourceDraft>();
  readonly readonly = input(false);
  readonly patchDraft = output<Partial<SourceDraft>>();
}
