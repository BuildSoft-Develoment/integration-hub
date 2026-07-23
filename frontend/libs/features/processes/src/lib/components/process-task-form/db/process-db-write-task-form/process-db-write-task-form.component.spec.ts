import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ProcessTaskFormBridgeService } from '@integration-hub/core/providers';
import { ProcessTaskManagerService } from '@integration-hub/core/services';
import { beforeAll, describe, expect, it } from 'vitest';

import { ProcessDbWriteTaskFormComponent } from './process-db-write-task-form.component';
import { ProcessTaskFormModel } from '../../../../models/process.models';

/**
 * El campo "Tabla destino" no esta atado al draft: muestra la señal `tableQuery`, que un effect mantiene en sync.
 * Estos casos fijan que ese sync no MIENTA sobre la configuracion real — el bug que aparecio al interactuar con
 * el form: al pasar del datasource de plataforma a una conexion JDBC, el draft se quedaba (a proposito) sin
 * tabla, pero el campo seguia mostrando `staging_record`. Se guardaba una tarea sin destino creyendo lo contrario.
 */
// El form usa mat-tabs/autocomplete, que consultan MediaMatcher; el DOM de test no trae matchMedia.
beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
});

function taskWith(config: Record<string, unknown>): ProcessTaskFormModel {
  return { clientId: 'c1', taskType: 'DB_WRITE', configurationJson: JSON.stringify(config) } as unknown as ProcessTaskFormModel;
}

/** Draft minimo derivado del config: al efecto solo le importan targetSchema/targetTable. */
const managerStub = {
  draftFor: (t: ProcessTaskFormModel) => ({
    taskRef: 'w1',
    executionMode: 'batch',
    connectionRef: '',
    mode: 'insert',
    targetSchema: '',
    targetTable: '',
    jdbcBatchSize: '1000',
    mappings: [],
    ...JSON.parse(t.configurationJson || '{}'),
  }),
  toTaskPatch: () => ({}),
};

function setup(config: Record<string, unknown>) {
  TestBed.configureTestingModule({
    imports: [ProcessDbWriteTaskFormComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideNoopAnimations(),
      ProcessTaskFormBridgeService,
      { provide: ProcessTaskManagerService, useValue: managerStub },
    ],
  });
  const fixture = TestBed.createComponent(ProcessDbWriteTaskFormComponent);
  fixture.componentRef.setInput('task', taskWith(config));
  fixture.componentRef.setInput('tasks', []);
  fixture.componentRef.setInput('readers', []);
  fixture.componentRef.setInput('connections', []);
  fixture.detectChanges();
  return fixture;
}

describe('ProcessDbWriteTaskFormComponent — sync de "Tabla destino"', () => {
  it('hidrata el campo con la tabla del draft', () => {
    const fixture = setup({ targetTable: 'staging_record' });
    expect(fixture.componentInstance.tableQuery()).toBe('staging_record');
  });

  it('califica con el esquema cuando hay tabla', () => {
    const fixture = setup({ targetSchema: 'ventas', targetTable: 'pedido' });
    expect(fixture.componentInstance.tableQuery()).toBe('ventas.pedido');
  });

  it('LIMPIA el campo cuando el draft se queda sin tabla (regresion)', () => {
    // Es lo que pasa al cambiar a una conexion externa: handleConnectionChange vacia targetTable a proposito.
    // Antes el campo se quedaba con el nombre viejo porque la guarda comparaba contra un '' recien asignado,
    // asi que solo "limpiaba" lo que ya estaba vacio.
    const fixture = setup({ targetTable: 'staging_record' });
    expect(fixture.componentInstance.tableQuery()).toBe('staging_record');

    fixture.componentRef.setInput('task', taskWith({ connectionRef: 'bdtrama', targetTable: '' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.tableQuery()).toBe('');
  });

  it('un esquema sin tabla NO se escribe en el campo de tabla (regresion)', () => {
    // Antes el nombre calificado se armaba con [schema, table] a secas: con la tabla vacia quedaba el esquema
    // solo, y terminaba mostrandose como si fuera la tabla destino.
    const fixture = setup({ targetSchema: 'ventas', targetTable: '' });
    expect(fixture.componentInstance.tableQuery()).toBe('');
  });

  it('respeta lo que el usuario tipeo: no lo pisa al cambiar el draft', () => {
    const fixture = setup({ targetTable: 'staging_record' });
    fixture.componentInstance.tableQuery.set('lo_que_escribio_el_usuario');

    fixture.componentRef.setInput('task', taskWith({ targetTable: '' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.tableQuery()).toBe('lo_que_escribio_el_usuario');
  });
});
