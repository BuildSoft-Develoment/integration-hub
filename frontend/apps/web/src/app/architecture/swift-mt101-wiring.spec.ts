
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  PROCESS_TASK_FORM_REGISTRY,
  PROCESS_TASK_PROVIDERS,
  PROCESS_TEMPLATE_REGISTRY,
} from '@integration-hub/core/providers';


/**
 * ADR-021: prueba de CABLEADO del vertical.
 *
 * <p>Vive en la app porque es la unica capa que ve dos features a la vez — y porque el cableado
 * ES de la app: `platform-plugin.manifest.ts` compone `buildProcessCatalogRoutes(...)` con lo que
 * aporta cada vertical.</p>
 *
 * <p>Existe por un agujero concreto: los task providers se prueban solos, la plantilla se prueba
 * sola, pero <b>nada verificaba que lleguen a estar registrados</b>. Un fallo de cableado (un
 * provider que no entra al array, una plantilla que no se registra) pasaba con toda la suite en
 * verde. Es la misma clase de error que hizo caer `MT101_BUILD_FROM_TABLE` al declarar
 * `summaryFields` en la clase base en vez de en la registrada.</p>
 */
describe('ADR-021 · cableado del vertical SWIFT MT101', () => {
  beforeEach(async () => {
    // Import DINAMICO, igual que en produccion: el manifest carga el vertical dentro de su
    // loadChildren. Un import estatico lo traeria al bundle inicial — la regla de fronteras Nx lo
    // rechaza, y con razon: es la garantia de lazy que sostiene los 174 kB iniciales.
    const { provideSwiftMt101ProcessTasks } = await import('@integration-hub/features/swift-mt101');
    // TestBed se resetea entre pruebas: configurar en una sola dejaba a las demas resolviendo
    // sobre un injector VACIO y pasando por vacio. (Cazado al escribir esta misma prueba.)
    TestBed.configureTestingModule({ providers: [...provideSwiftMt101ProcessTasks()] });
  });

  it('registra los 12 task providers del vertical', () => {
    const providers = TestBed.inject(PROCESS_TASK_PROVIDERS, []);

    expect(providers.length, 'no se registro ningun provider: el cableado no llego').toBe(12);
    const types = providers.map((provider) => provider.descriptor.type).sort();
    expect(types).toEqual(
      [
        'MT101_ARCHIVE',
        'MT101_BUILD_FROM_TABLE',
        'MT101_INBOUND_DELIVER',
        'MT101_PARSE',
        'MT101_PARSE_FROM_TABLE',
        'MT101_PAY',
        'MT101_RECONCILE',
        'MT101_REPAIR',
        'MT101_ROUTE',
        'MT101_SPLIT',
        'MT101_STATUS',
        'MT101_VALIDATE',
      ].sort()
    );
  });

  it('registra un formulario para cada tipo que aporta', () => {
    const forms = TestBed.inject(PROCESS_TASK_FORM_REGISTRY, []);
    expect(forms.length, 'no se registro ningun formulario').toBeGreaterThan(0);
    const providers = TestBed.inject(PROCESS_TASK_PROVIDERS, []);

    const formTypes = new Set(forms.map((form) => form.type));
    const missing = providers
      .map((provider) => provider.descriptor.type)
      .filter((type) => !formTypes.has(type));

    expect(missing, 'tipos sin formulario registrado').toEqual([]);
  });

  it('registra la plantilla masiva, y con los pasos que declara', () => {
    const templates = TestBed.inject(PROCESS_TEMPLATE_REGISTRY, []);

    const massive = templates.find((template) => template.id === 'swift-mt101-masivo');
    expect(massive, 'la plantilla masiva no quedo registrada').toBeDefined();
    expect(massive?.tasks).toHaveLength(6);
    // Si el labelKey no se resuelve, el boton del editor muestra la clave cruda: el vertical la
    // aporta por registerMessages(), no por el diccionario del core.
    expect(massive?.labelKey).toBe('processes.template.swiftMt101Massive');
  });
});
