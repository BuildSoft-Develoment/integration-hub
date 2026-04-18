import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SourceDraft, SourceProviderDescriptor } from '@integration-hub/core/providers';
import { SourceEditorComponent } from './source-editor.component';

describe('SourceEditorComponent readonly parity', () => {
  const providerOptions: readonly SourceProviderDescriptor[] = [
    {
      type: 'FILESYSTEM',
      label: 'Filesystem',
      description: 'Filesystem source',
      category: 'file',
      capabilities: ['path'],
      supportsConnectionSecret: false,
    },
  ];

  const form = {
    id: 42,
    name: 'Archivo clientes',
    sourceType: 'FILESYSTEM' as const,
    active: true,
    configurationJson: '{}',
  };

  const draft: SourceDraft = {
    type: 'FILESYSTEM',
    connectionKind: 'filesystem',
    pollingMode: 'manual',
    includePatterns: ['*.*'],
    path: '/dropzone/clientes',
    fileNameTemplate: '*.csv',
    selectionMode: 'latestModified',
    fileErrorPolicy: 'continue',
    mediaType: 'text/csv',
    templateVariablesText: 'fecha=20260404',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SourceEditorComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
  });

  it('shows the same form shell in readonly mode and disables inputs', async () => {
    const fixture = TestBed.createComponent(SourceEditorComponent);
    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('draft', draft);
    fixture.componentRef.setInput('providerOptions', providerOptions);
    fixture.componentRef.setInput('titleKey', 'sources.detail');
    fixture.componentRef.setInput('readonly', true);
    fixture.componentRef.setInput('canEdit', true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const nameInput = element.querySelector('input[name="sourceName"]') as HTMLInputElement | null;

    expect(element.textContent).toContain('Perfil de conexion');
    expect(element.textContent).toContain('Provider');
    expect(element.textContent).toContain('Editar');
    expect(nameInput?.disabled).toBe(true);
  });

  it('keeps save actions in edit mode', async () => {
    const fixture = TestBed.createComponent(SourceEditorComponent);
    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('draft', draft);
    fixture.componentRef.setInput('providerOptions', providerOptions);
    fixture.componentRef.setInput('titleKey', 'sources.edit');
    fixture.componentRef.setInput('readonly', false);
    fixture.componentRef.setInput('canEdit', true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const nameInput = element.querySelector('input[name="sourceName"]') as HTMLInputElement | null;

    expect(element.textContent).toContain('Guardar cambios');
    expect(element.textContent).toContain('Cancelar');
    expect(nameInput?.disabled).toBe(false);
  });
});
