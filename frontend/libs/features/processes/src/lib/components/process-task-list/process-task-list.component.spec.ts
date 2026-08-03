import { TestBed } from '@angular/core/testing';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';

import { ProcessFlowApiService } from '../../api/process-flow-api.service';
import { ProcessTaskType } from '../../models/process.models';
import { ProcessTaskListComponent } from './process-task-list.component';

/**
 * Un task type puede venir de un plugin remoto cuya firma no verifico: el descriptor lo marca
 * DEGRADED, UNTRUSTED o SHADOWED_BY_LOCAL y `isAvailable()` pasa a false.
 *
 * <p>Lo unico que impedia arrastrarlo al lienzo era el atributo `disabled` del boton de la paleta.
 * Un atributo de presentacion no es un control: se quita desde el inspector del navegador, y
 * `handleCreateNode` — el sitio donde de verdad se decide si una tarea entra al flujo — solo
 * miraba `readonly`. La paleta puede seguir pintando el chip en gris; eso es UX.</p>
 */
describe('ProcessTaskListComponent · quien entra al lienzo', () => {
  let component: ProcessTaskListComponent;
  let disponibles: Set<string>;
  let anadidos: ProcessTaskType[];

  beforeEach(() => {
    disponibles = new Set(['FILE_READ']);
    anadidos = [];

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProcessTaskManagerService,
          useValue: { isAvailable: (type: string) => disponibles.has(type) },
        },
        { provide: I18nService, useValue: { t: (key: string) => key } },
        { provide: ProcessFlowApiService, useValue: {} },
      ],
    });

    component = TestBed.runInInjectionContext(() => new ProcessTaskListComponent());
    component.addTaskAt.subscribe((evento) => anadidos.push(evento.taskType));
  });

  it('deja entrar un task type disponible', () => {
    component.handleCreateNode({ data: 'FILE_READ' as ProcessTaskType, rect: { x: 10, y: 20 } });

    expect(anadidos).toEqual(['FILE_READ']);
  });

  it('NO deja entrar un task type de un plugin no disponible, aunque el drop llegue', () => {
    // El drop llega igual: el boton pudo desbloquearse desde el inspector, o el evento pudo
    // sintetizarse. La decision no puede depender de como se veia el boton.
    component.handleCreateNode({ data: 'DEMO_TRANSFORM_PY' as ProcessTaskType, rect: { x: 10, y: 20 } });

    expect(anadidos).toEqual([]);
  });
});
