import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { RecordLineageApiService, RecordLineageEntry } from '@integration-hub/shared/audit-kit';
import { RecordLineageComponent } from './record-lineage.component';

describe('RecordLineageComponent', () => {
  let component: RecordLineageComponent;
  let lastQuery: Record<string, unknown> | null;

  beforeEach(() => {
    lastQuery = null;
    const api = {
      recordLineage: (q: Record<string, unknown>) => {
        lastQuery = q;
        return of([] as RecordLineageEntry[]);
      },
    } as unknown as RecordLineageApiService;
    const route = { snapshot: { queryParamMap: { get: () => null } } } as unknown as ActivatedRoute;

    TestBed.configureTestingModule({
      providers: [
        { provide: RecordLineageApiService, useValue: api },
        { provide: ActivatedRoute, useValue: route },
      ],
    });
    component = TestBed.runInInjectionContext(() => new RecordLineageComponent());
  });

  describe('búsqueda unificada por modo', () => {
    it('arranca en modo Registro', () => {
      expect(component.mode()).toBe('record');
    });

    it('canSearch valida los campos requeridos del modo activo', () => {
      expect(component.canSearch()).toBe(false);
      component.recordId = ':20:ABC';
      expect(component.canSearch()).toBe(true);

      component.setMode('sourceRow');
      expect(component.canSearch()).toBe(false);
      component.sourceFileHash = 'abc';
      component.recordNumber = '1002';
      expect(component.canSearch()).toBe(true);
    });

    it('un único search() despacha según el modo (clave)', () => {
      component.setMode('key');
      component.key = 'uetr';
      component.value = 'XYZ';
      component.search();
      expect(lastQuery).toEqual({ key: 'uetr', value: 'XYZ', limit: 500 });
    });

    it('search() en modo archivo+fila manda hash y fila', () => {
      component.setMode('sourceRow');
      component.sourceFileHash = 'deadbeef';
      component.recordNumber = '1002';
      component.search();
      expect(lastQuery).toEqual({ sourceFileHash: 'deadbeef', recordNumber: '1002', limit: 500 });
    });

    it('no busca si faltan datos del modo', () => {
      component.setMode('trace');
      component.search();
      expect(lastQuery).toBeNull();
    });
  });

  describe('duración entre hitos', () => {
    it('es null en el primer hito y calcula el resto', () => {
      component.entries.set([
        { stage: 'INGESTED', status: 'INGESTED', eventTs: '2026-06-18T10:15:32Z' } as RecordLineageEntry,
        { stage: 'BUILT', status: 'BUILT', eventTs: '2026-06-18T10:15:33Z' } as RecordLineageEntry,
      ]);
      expect(component.durationAt(0)).toBeNull();
      expect(component.durationAt(1)).toBe('1s');
    });
  });

  describe('pivote de claves del timeline', () => {
    it('pivotKey pasa a modo Clave y relanza la busqueda', () => {
      component.pivotKey('uetr', 'U-123');
      expect(component.mode()).toBe('key');
      expect(component.key).toBe('uetr');
      expect(lastQuery).toEqual({ key: 'uetr', value: 'U-123', limit: 500 });
    });

    it('pivotKey coacciona valores numericos a texto (archiveId)', () => {
      component.pivotKey('archiveId', 42);
      expect(component.value).toBe('42');
      expect(lastQuery).toEqual({ key: 'archiveId', value: '42', limit: 500 });
    });

    it('pivotSourceRow pasa a modo Archivo+fila', () => {
      component.pivotSourceRow('abc', 1002);
      expect(component.mode()).toBe('sourceRow');
      expect(lastQuery).toEqual({ sourceFileHash: 'abc', recordNumber: '1002', limit: 500 });
    });

    it('pivotRecord pasa a modo Registro', () => {
      component.pivotRecord('M10000');
      expect(component.mode()).toBe('record');
      expect(lastQuery).toEqual({ recordId: 'M10000', limit: 500 });
    });
  });
});
