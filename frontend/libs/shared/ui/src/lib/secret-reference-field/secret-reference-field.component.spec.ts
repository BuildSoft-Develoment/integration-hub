import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { I18nService, SecretSourcesService } from '@integration-hub/core/services';
import { SecretReferenceFieldComponent } from './secret-reference-field.component';

// @trace ADR-031 D6, D1, D2

/**
 * Doble del catalogo. `SecretSourcesService` pide `/api/secret-sources` al construirse; aqui se
 * sustituye por uno que responde ya cargado, para que el test hable del COMPONENTE y no del HTTP.
 */
class CatalogoFalso {
  fuentes: { source: string; enumerable: boolean }[] = [];
  sources = () => this.fuentes;
  prefijos = () => this.fuentes.map((f) => '${' + f.source + ':...}').join(', ');
  enumerables = () => this.fuentes.filter((f) => f.enumerable);
  load = async () => undefined;
}

describe('ih-secret-reference-field · ADR-031 D6', () => {
  let catalogo: CatalogoFalso;
  let i18n: I18nService;
  let fixture: ComponentFixture<SecretReferenceFieldComponent>;

  const montar = (valor: string) => {
    fixture = TestBed.createComponent(SecretReferenceFieldComponent);
    fixture.componentRef.setInput('value', valor);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  const hint = () => fixture.nativeElement.querySelector('mat-hint')?.textContent?.trim() ?? '';

  beforeEach(() => {
    catalogo = new CatalogoFalso();
    catalogo.fuentes = [
      { source: 'config', enumerable: false },
      { source: 'vaultkv', enumerable: true },
    ];
    TestBed.configureTestingModule({
      imports: [SecretReferenceFieldComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: SecretSourcesService, useValue: catalogo },
      ],
    });
    // Se compara contra `i18n.t(...)` y no contra el literal: el test habla de QUE mensaje elige
    // el componente, no de como esta redactado. Un cambio de redaccion no debe ponerlo rojo.
    i18n = TestBed.inject(I18nService);
  });

  it('elegir un origen envuelve lo escrito y conserva la ruta', () => {
    const componente = montar('${secret:sources/sftp/password}');
    const emitido: string[] = [];
    componente.valueChange.subscribe((v) => emitido.push(v));

    (componente as unknown as { usarOrigen(s: string): void }).usarOrigen('vaultkv');

    expect(emitido).toEqual(['${vaultkv:sources/sftp/password}']);
  });

  it('sobre texto plano, elegir un origen lo envuelve como ruta y lo deja a la vista', () => {
    // No se pierde lo escrito: la persona ve que su "hunter2" quedo de ruta y lo corrige. Borrarlo en
    // silencio seria peor -desaparece sin explicacion- y adivinar una ruta seria inventar.
    const componente = montar('hunter2');
    const emitido: string[] = [];
    componente.valueChange.subscribe((v) => emitido.push(v));

    (componente as unknown as { usarOrigen(s: string): void }).usarOrigen('vaultkv');

    expect(emitido).toEqual(['${vaultkv:hunter2}']);
  });

  it('en solo lectura, elegir un origen no emite nada', () => {
    const componente = montar('hunter2');
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    const emitido: string[] = [];
    componente.valueChange.subscribe((v) => emitido.push(v));

    (componente as unknown as { usarOrigen(s: string): void }).usarOrigen('vaultkv');

    expect(emitido).toEqual([]);
  });

  it('avisa de texto plano', () => {
    montar('hunter2');
    expect(hint()).toBe(i18n.t('sources.credentialPlaintext'));
  });

  it('una referencia valida y resoluble aqui no lleva aviso', () => {
    montar('${vaultkv:sources/sftp/password}');
    expect(hint()).toBe(i18n.t('schemaForm.secretRef'));
  });

  it('avisa cuando el origen guardado NO lo resuelve este despliegue', () => {
    // Es el fallo entero de ADR-031: `${secret:...}` guardado con file-vault sigue validando en la
    // VM y revienta en ejecucion. Aqui se ve al abrir la pantalla.
    montar('${secret:sources/sftp/password}');
    expect(hint()).toBe(
      i18n.t('secretField.unknownSource', { origen: 'secret', prefijos: catalogo.prefijos() }),
    );
  });

  it('sin catalogo NO afirma que un origen no resuelva', () => {
    // Sin respuesta del backend no hay base para decirlo, y un aviso falso sobre una referencia
    // correcta es peor que ningun aviso.
    catalogo.fuentes = [];
    montar('${secret:sources/sftp/password}');
    expect(hint()).toBe(i18n.t('schemaForm.secretRef'));
  });

  it('`${vaultkv:}` recien elegido no es texto plano: pide la ruta', () => {
    montar('${vaultkv:}');
    expect(hint()).toBe(i18n.t('secretField.missingPath'));
  });

  it('vacio no es texto plano', () => {
    montar('');
    expect(hint()).toBe(i18n.t('secretField.empty', { prefijos: catalogo.prefijos() }));
  });

  it('ofrece los origenes del catalogo, y solo esos', () => {
    montar('');
    const componente = fixture.componentInstance as unknown as { ejemplo(s: string): string };
    expect(componente.ejemplo('vaultkv')).toBe('${vaultkv:...}');
    expect(catalogo.sources().map((f) => f.source)).toEqual(['config', 'vaultkv']);
  });

  it('multilinea pinta textarea y sin interruptor de visibilidad', () => {
    montar('');
    fixture.componentRef.setInput('multiline', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('textarea')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('input')).toBeFalsy();
    // Un textarea no admite type=password: no hay nada que alternar.
    const botones = fixture.nativeElement.querySelectorAll('button[mat-icon-button]');
    expect(botones.length).toBe(1);
  });

  it('el valor arranca oculto y el interruptor lo revela', () => {
    const componente = montar('${vaultkv:sources/sftp/password}');
    const input = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input().type).toBe('password');
    componente.visible.set(true);
    fixture.detectChanges();
    expect(input().type).toBe('text');
  });
});
