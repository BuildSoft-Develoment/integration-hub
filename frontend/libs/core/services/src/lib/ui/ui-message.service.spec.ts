import { TestBed } from '@angular/core/testing';
import { I18nService } from '@integration-hub/core/i18n';
import { UiMessageService } from './ui-message.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UiMessageSnackbarComponent } from '@integration-hub/plugin-ui-kit';

describe('UiMessageService', () => {
  let service: UiMessageService;
  let calls: Array<{ component: unknown; config: Record<string, unknown> }> = [];

  beforeEach(() => {
    calls = [];

    TestBed.configureTestingModule({
      providers: [
        UiMessageService,
        I18nService,
        {
          provide: MatSnackBar,
          useValue: {
            openFromComponent: (component: unknown, config: Record<string, unknown>) =>
              calls.push({ component, config }),
          },
        },
      ],
    });

    service = TestBed.inject(UiMessageService);
  });

  it('should render success messages with the snackbar component and severity metadata', () => {
    service.show({ kind: 'success', message: 'Conexion creada correctamente.' });

    expect(calls[0]?.component).toBe(UiMessageSnackbarComponent);
    expect(calls[0]?.config['data']).toEqual({
      kind: 'success',
      message: 'Conexion creada correctamente.',
      severityLabel: 'OK',
    });
    expect(calls[0]?.config['panelClass']).toEqual(['ih-snackbar', 'ih-snackbar--success']);
  });

  it('should pass distinct severity metadata for warning and error messages', () => {
    service.show({ kind: 'warning', message: 'Revisa el timeout configurado.' });
    service.show({ kind: 'error', message: 'No se pudo guardar la conexion.' });

    expect(calls[0]?.config['data']).toEqual({
      kind: 'warning',
      message: 'Revisa el timeout configurado.',
      severityLabel: 'Aviso',
    });
    expect(calls[1]?.config['data']).toEqual({
      kind: 'error',
      message: 'No se pudo guardar la conexion.',
      severityLabel: 'Error',
    });
  });
});
