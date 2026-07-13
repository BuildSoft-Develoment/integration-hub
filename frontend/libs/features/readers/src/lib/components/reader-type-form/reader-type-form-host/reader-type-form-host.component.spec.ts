import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SchemaFormSchema } from '@integration-hub/shared/ui';

import { ReaderConfigSchemaService } from '../../../api/reader-config-schema.service';
import { ReaderTypeFormHostComponent } from './reader-type-form-host.component';

/**
 * Renderiza el host inyectando un {@link ReaderConfigSchemaService} de prueba que devuelve
 * `schema` para cualquier tipo. Un tipo built-in usa su @switch; un tipo de plugin resuelve
 * su config-schema del backend (aqui simulado) y lo renderiza con ih-schema-form.
 */
function render(type: string, schema: SchemaFormSchema = { fields: [] }) {
  TestBed.configureTestingModule({
    imports: [ReaderTypeFormHostComponent],
    providers: [
      { provide: ReaderConfigSchemaService, useValue: { schemaFor: () => of(schema) } },
    ],
  });
  const fixture = TestBed.createComponent(ReaderTypeFormHostComponent);
  fixture.componentRef.setInput('readerType', type as never);
  fixture.componentRef.setInput('draft', { type } as never);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ReaderTypeFormHostComponent', () => {
  it('shows an explicit message for an unknown reader type without schema (no silent JSON fallback)', () => {
    const el = render('QUANTUM', { fields: [] });
    expect(el.querySelector('.reader-type-form-host__unsupported')).toBeTruthy();
    expect(el.querySelector('ih-reader-json-form')).toBeNull();
  });

  it('renders a schema-driven form for a plugin reader type that declares a config-schema', () => {
    const el = render('MI_READER', {
      fields: [{ key: 'delimiter', label: 'Delimitador', type: 'text', required: true }],
    } as SchemaFormSchema);
    expect(el.querySelector('ih-schema-form')).toBeTruthy();
    expect(el.querySelector('.reader-type-form-host__unsupported')).toBeNull();
  });
});
