import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import {
  AuthAccessService,
  AuthService,
  I18nService,
} from '@integration-hub/core/services';

@Component({
  selector: 'ih-app-session-action',
  standalone: true,
  imports: [MatButtonModule, MatMenuModule],
  templateUrl: './app-session-action.component.html',
  styleUrl: './app-session-action.component.css',
})
export class AppSessionActionComponent {
  readonly auth = inject(AuthService);
  readonly access = inject(AuthAccessService);
  readonly i18n = inject(I18nService);
}
