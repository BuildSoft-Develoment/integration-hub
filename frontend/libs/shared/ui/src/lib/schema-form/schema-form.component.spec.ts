import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';

import { provideSchemaFieldRenderers } from './schema-field-renderer';
import { SchemaFormComponent } from './schema-form.component';
import { SchemaFieldDescriptor, SchemaFormSchema, SchemaFormValue } from './schema-form.models';

// Renderer de campo custom de prueba para el tipo 'token-text'.
@Component({
  selector: 'ih-test-token-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `<input class="token-field" [formControl]="control()" [attr.data-key]="field().key" />`,
})
class TestTokenFieldComponent {
  readonly field = input.required<SchemaFieldDescriptor>();
  readonly control = input.required<FormControl>();
  readonly readonly = input(false);
}

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
  const form = (fixture.componentInstance as unknown as { form: () => import('@angular/forms').FormGroup }).form();
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

    const form = (fixture.componentInstance as unknown as { form: () => import('@angular/forms').FormGroup }).form();
    expect(form.controls['host'].value).toBe('seed');
    expect(form.controls['port'].value).toBe(1234);
    // Applying the external value must not fire valueChange (would cause feedback loops).
    expect(emissions).toBe(0);
  });

  it('rebuilds the form and re-renders the template when the schema input changes', () => {
    const { fixture } = setup();
    // Switch to a different schema on the SAME component instance.
    const schema2: SchemaFormSchema = {
      fields: [{ key: 'onlyField', type: 'text', label: 'Only', required: true }],
    };
    fixture.componentRef.setInput('schema', schema2);
    fixture.detectChanges();

    const form = (fixture.componentInstance as unknown as { form: () => import('@angular/forms').FormGroup }).form();
    expect(Object.keys(form.controls)).toEqual(['onlyField']);
    // The template reflects the new schema (one field, no toggle from the previous schema).
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('mat-form-field').length).toBe(1);
    expect(el.querySelector('mat-slide-toggle')).toBeNull();
  });

  it('disables every control when readonly', () => {
    const { form } = setup({}, true);
    expect(form.disabled).toBe(true);
  });

  it('shows a field only when its visibleWhen matches and excludes hidden fields from validity', () => {
    const conditional: SchemaFormSchema = {
      fields: [
        {
          key: 'channel',
          type: 'select',
          label: 'Channel',
          options: [
            { value: 'log', label: 'Log' },
            { value: 'webhook', label: 'Webhook' },
          ],
          default: 'log',
        },
        {
          key: 'url',
          type: 'text',
          label: 'URL',
          required: true,
          visibleWhen: { field: 'channel', equals: 'webhook' },
        },
      ],
    };
    TestBed.configureTestingModule({ imports: [SchemaFormComponent] });
    const fixture = TestBed.createComponent(SchemaFormComponent);
    fixture.componentRef.setInput('schema', conditional);
    fixture.detectChanges();
    const form = (fixture.componentInstance as unknown as { form: () => import('@angular/forms').FormGroup }).form();
    const el = fixture.nativeElement as HTMLElement;

    // channel='log' -> url hidden (only the select renders) + disabled -> form valid despite required.
    expect(el.querySelectorAll('mat-form-field').length).toBe(1);
    expect(form.controls['url'].disabled).toBe(true);
    expect(form.valid).toBe(true);

    // Switch to webhook -> url becomes visible, enabled and required -> invalid until filled.
    form.controls['channel'].setValue('webhook');
    fixture.detectChanges();
    expect(el.querySelectorAll('mat-form-field').length).toBe(2);
    expect(form.controls['url'].enabled).toBe(true);
    expect(form.valid).toBe(false);
    form.controls['url'].setValue('https://hook.example');
    expect(form.valid).toBe(true);
  });

  it('delegates custom field types to a registered renderer (extensibility)', () => {
    const customSchema: SchemaFormSchema = {
      fields: [
        { key: 'host', type: 'text', label: 'Host', required: true },
        { key: 'message', type: 'token-text', label: 'Message' },
      ],
    };
    TestBed.configureTestingModule({
      imports: [SchemaFormComponent],
      providers: [
        provideSchemaFieldRenderers([{ type: 'token-text', component: TestTokenFieldComponent }]),
      ],
    });
    const fixture = TestBed.createComponent(SchemaFormComponent);
    fixture.componentRef.setInput('schema', customSchema);
    fixture.componentRef.setInput('value', { message: 'seed' });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    // The custom type renders the registered component, wired to its FormControl.
    const custom = el.querySelector('input.token-field') as HTMLInputElement;
    expect(custom).toBeTruthy();
    expect(custom.getAttribute('data-key')).toBe('message');
    expect(custom.value).toBe('seed');
    // The built-in 'text' field still renders natively as a mat-form-field.
    expect(el.querySelector('mat-form-field')).toBeTruthy();
  });

  it('enforces number min/max validators from the descriptor', () => {
    const { form } = setup();
    form.controls['port'].setValue(70000);
    expect(form.controls['port'].valid).toBe(false);
    form.controls['port'].setValue(8080);
    expect(form.controls['port'].valid).toBe(true);
  });
});
