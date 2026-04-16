import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@integration-hub/core/services';

@Component({
  selector: 'ih-process-editor-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <div class="panel-topbar">
      <button mat-stroked-button type="button" (click)="close.emit()">
        {{ i18n.t('common.close') }}
      </button>
    </div>

    <div class="profile-stack">
      <div class="profile-header">
        <div class="profile-avatar">P</div>
        <div class="profile-copy">
          <h3 class="profile-name">{{ i18n.t(titleKey()) }}</h3>
          <p class="profile-subtitle">
            {{
              scheduled()
                ? i18n.t('status.scheduled')
                : i18n.t('status.manual')
            }}
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .panel-topbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 0.65rem;
      }
      .profile-stack {
        display: grid;
        gap: 0.8rem;
        margin-bottom: 1rem;
      }
      .profile-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 0;
      }
      .profile-avatar {
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        width: 4rem;
        height: 4rem;
        border-radius: 22px;
        background: color-mix(in srgb, var(--ih-accent) 14%, transparent);
        color: var(--ih-accent-strong);
        font-size: 1.2rem;
        font-weight: 800;
      }
      .profile-copy {
        display: grid;
        gap: 0.28rem;
        min-width: 0;
      }
      .profile-name {
        margin: 0;
        font-size: 1.45rem;
        font-weight: 700;
        letter-spacing: -0.03em;
        overflow-wrap: anywhere;
      }
      .profile-subtitle {
        margin: 0;
        color: var(--ih-text-soft);
        overflow-wrap: anywhere;
      }
      @media (max-width: 760px) {
        .profile-header {
          align-items: flex-start;
          gap: 0.75rem;
        }
        .profile-avatar {
          width: 3.25rem;
          height: 3.25rem;
          border-radius: 18px;
          font-size: 1rem;
        }
        .profile-name {
          font-size: 1.2rem;
        }
      }
    `,
  ],
})
export class ProcessEditorHeaderComponent {
  readonly i18n = inject(I18nService);

  readonly titleKey = input.required<string>();
  readonly scheduled = input(false);

  readonly close = output<void>();
}
