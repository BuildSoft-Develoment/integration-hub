import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SchemaFormSchema } from '@integration-hub/shared/ui';

import { SourceConfigSchemaService } from '../../../api/source-config-schema.service';
import { SourceTypeFormHostComponent } from './source-type-form-host.component';

/**
 * Renderiza el host inyectando un {@link SourceConfigSchemaService} de prueba. Un tipo built-in
 * usa su @switch; un tipo de plugin resuelve su config-schema del backend (aqui simulado) y lo
 * renderiza con ih-schema-form.
 */
function render(type: string, schema: SchemaFormSchema = { fields: [] }) {
  TestBed.configureTestingModule({
    imports: [SourceTypeFormHostComponent],
    providers: [
      { provide: SourceConfigSchemaService, useValue: { schemaFor: () => of(schema) } },
    ],
  });
  const fixture = TestBed.createComponent(SourceTypeFormHostComponent);
  fixture.componentRef.setInput('sourceType', type as never);
  fixture.componentRef.setInput('draft', { type } as never);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('SourceTypeFormHostComponent', () => {
  it('renders the built-in form for a local source type', () => {
    const el = render('FILESYSTEM');
    expect(el.querySelector('ih-source-filesystem-form')).toBeTruthy();
    expect(el.querySelector('ih-schema-form')).toBeNull();
  });

  it('shows an explicit message for an unknown source type without schema', () => {
    const el = render('QUANTUM', { fields: [] });
    expect(el.querySelector('.source-type-form-host__unsupported')).toBeTruthy();
    expect(el.querySelector('ih-schema-form')).toBeNull();
  });

  it('renders a schema-driven form for a plugin source type that declares a config-schema', () => {
    const el = render('DEMO_HTTP_FEED', {
      fields: [{ key: 'feedUrl', label: 'URL', type: 'text', required: true }],
    } as SchemaFormSchema);
    expect(el.querySelector('ih-schema-form')).toBeTruthy();
    expect(el.querySelector('.source-type-form-host__unsupported')).toBeNull();
  });
});
