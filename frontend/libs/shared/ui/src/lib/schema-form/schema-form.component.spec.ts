import { TestBed } from '@angular/core/testing';

import { SchemaFormComponent } from './schema-form.component';
import { SchemaFormSchema, SchemaFormValue } from './schema-form.models';

const schema: SchemaFormSchema = {
  fields: [
    { key: 'host', type: 'text', label: 'Host', required: true },
    { key: 'port', type: 'number', label: 'Port', min: 1, max: 65535 },
    { key: 'ssl', type: 'boolean', label: 'SSL' },
    {
      key: 'engine',
      type: 'select',
      label: 'Engine',
      options: [
        { value: 'pg', label: 'Postgres' },
        { value: 'my', label: 'MySQL' },
      ],
    },
    { key: 'password', type: 'secret', label: 'Password', required: true },
  ],
};

function setup(value: SchemaFormValue = {}, readonly = false) {
  TestBed.configureTestingModule({ imports: [SchemaFormComponent] });
  const fixture = TestBed.createComponent(SchemaFormComponent);
  fixture.componentRef.setInput('schema', schema);
  fixture.componentRef.setInput('value', value);
  fixture.componentRef.setInput('readonly', readonly);
  fixture.detectChanges();
  // Access the protected reactive form for assertions.
  const form = (fixture.componentInstance as unknown as { form: import('@angular/forms').FormGroup }).form;
  return { fixture, form };
}

describe('SchemaFormComponent', () => {
  it('renders one control per field with the right input type', () => {
    const { fixture } = setup();
    const el = fixture.nativeElement as HTMLElement;
    // text + number + select + secret => 4 mat-form-field; boolean is a slide toggle.
    expect(el.querySelectorAll('mat-form-field').length).toBe(4);
    expect(el.querySelector('mat-slide-toggle')).toBeTruthy();
    expect(el.querySelector('input[type="number"]')).toBeTruthy();
    // Secret is masked (rendered as a password input).
    expect(el.querySelector('input[type="password"]')).toBeTruthy();
  });

  it('is invalid while a required field is empty and valid once filled', () => {
    const { fixture, form } = setup();
    const validEvents: boolean[] = [];
    fixture.componentInstance.validChange.subscribe((v) => validEvents.push(v));

    expect(form.valid).toBe(false); // host + password required, empty

    form.controls['host'].setValue('db.local');
    form.controls['password'].setValue('secret://db-password');
    expect(form.valid).toBe(true);
    expect(validEvents[validEvents.length - 1]).toBe(true);
  });

  it('emits the full value object when the user edits a field', () => {
    const { fixture, form } = setup();
    let last: SchemaFormValue | undefined;
    fixture.componentInstance.valueChange.subscribe((v) => (last = v));

    form.controls['host'].setValue('h1');
    form.controls['port'].setValue(5432);

    expect(last?.['host']).toBe('h1');
    expect(last?.['port']).toBe(5432);
  });

  it('seeds the controls from the incoming value without emitting a change', () => {
    let emissions = 0;
    TestBed.configureTestingModule({ imports: [SchemaFormComponent] });
    const fixture = TestBed.createComponent(SchemaFormComponent);
    fixture.componentInstance.valueChange.subscribe(() => emissions++);
    fixture.componentRef.setInput('schema', schema);
    fixture.componentRef.setInput('value', { host: 'seed', port: 1234 });
    fixture.detectChanges();

    const form = (fixture.componentInstance as unknown as { form: import('@angular/forms').FormGroup }).form;
    expect(form.controls['host'].value).toBe('seed');
    expect(form.controls['port'].value).toBe(1234);
    // Applying the external value must not fire valueChange (would cause feedback loops).
    expect(emissions).toBe(0);
  });

  it('disables every control when readonly', () => {
    const { form } = setup({}, true);
    expect(form.disabled).toBe(true);
  });

  it('enforces number min/max validators from the descriptor', () => {
    const { form } = setup();
    form.controls['port'].setValue(70000);
    expect(form.controls['port'].valid).toBe(false);
    form.controls['port'].setValue(8080);
    expect(form.controls['port'].valid).toBe(true);
  });
});
