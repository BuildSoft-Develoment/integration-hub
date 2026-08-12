import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { OutputSinkCatalogService } from './output-sink-catalog.service';

/**
 * El catálogo de fuentes admite ocho tipos de entrada y la salida sólo escribe en dos. Sin este
 * servicio el selector de destino ofrecía tipos que no se pueden entregar, y el fallo aparecía en la
 * primera ejecución con el proceso ya publicado.
 */
describe('OutputSinkCatalogService', () => {
  function crear(respuesta: unknown, falla = false) {
    const get = vi.fn().mockReturnValue(falla ? throwError(() => new Error('red caída')) : of(respuesta));
    TestBed.configureTestingModule({
      providers: [OutputSinkCatalogService, { provide: HttpClient, useValue: { get } }],
    });
    return { service: TestBed.inject(OutputSinkCatalogService), get };
  }

  it('sólo acepta los tipos que el motor sabe entregar', () => {
    const { service } = crear({ deliverableTypes: ['FILESYSTEM', 'SFTP'] });
    service.load();

    expect(service.canDeliverTo('FILESYSTEM')).toBe(true);
    expect(service.canDeliverTo('SFTP')).toBe(true);
    expect(service.canDeliverTo('FTP')).toBe(false);
    expect(service.canDeliverTo('S3')).toBe(false);
  });

  it('compara sin distinguir mayúsculas, porque el tipo viaja de las dos formas', () => {
    const { service } = crear({ deliverableTypes: ['FILESYSTEM'] });
    service.load();

    expect(service.canDeliverTo('filesystem')).toBe(true);
    expect(service.canDeliverTo('FileSystem')).toBe(true);
  });

  it('no esconde nada mientras no sabe', () => {
    // Antes de responder no se puede afirmar que un tipo NO sea entregable. Vaciar el selector
    // durante la carga haría parecer que no hay destinos configurados.
    const { service } = crear({ deliverableTypes: ['FILESYSTEM'] });

    expect(service.canDeliverTo('FTP')).toBe(true);
  });

  it('si el catálogo no responde, deja decidir al backend', () => {
    // Esconder destinos válidos por un fallo de red sería peor que ofrecerlos: el guardado los
    // rechaza igual, y con un motivo.
    const { service } = crear(null, true);
    service.load();

    expect(service.canDeliverTo('FTP')).toBe(true);
  });

  it('se pide una sola vez: la lista sólo cambia con un despliegue', () => {
    const { service, get } = crear({ deliverableTypes: ['FILESYSTEM'] });

    service.load();
    service.load();
    service.load();

    expect(get).toHaveBeenCalledTimes(1);
  });
});
