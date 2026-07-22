import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { TaskFormShellComponent } from './task-form-shell.component';

/**
 * Host de prueba: proyecta los tres slots del shell (switch, runtime, contenido) para verificar el
 * content-projection que no se puede validar a ojo (browser auth bloqueado). Cierra ese gap.
 */
@Component({
  standalone: true,
  imports: [TaskFormShellComponent],
  template: `
    <ih-task-form-shell [title]="title">
      <button shellSwitch data-testid="switch">fmt</button>
      <div shellRuntime data-testid="runtime">runtime</div>
      <div class="tfs-fill" data-testid="tabs">tabs</div>
    </ih-task-form-shell>
  `,
})
class HostComponent {
  title = 'Construir MT101 desde staging';
}

function setup(withTitle = true) {
  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [provideNoopAnimations()],
  });
  const fixture = TestBed.createComponent(HostComponent);
  if (!withTitle) {
    fixture.componentInstance.title = '';
  }
  fixture.detectChanges();
  return fixture;
}

function html(fixture: ReturnType<typeof setup>): string {
  return fixture.nativeElement.textContent ?? '';
}

describe('TaskFormShellComponent', () => {
  it('renderiza el titulo cuando esta presente', () => {
    const el = setup(true).nativeElement as HTMLElement;
    const title = el.querySelector('.tfs__title');
    expect(title?.textContent?.trim()).toBe('Construir MT101 desde staging');
  });

  it('omite el titulo cuando esta vacio', () => {
    const el = setup(false).nativeElement as HTMLElement;
    expect(el.querySelector('.tfs__title')).toBeNull();
  });

  it('proyecta el switch primario dentro del header', () => {
    const el = setup().nativeElement as HTMLElement;
    const sw = el.querySelector('.tfs__topbar [data-testid="switch"]');
    expect(sw).not.toBeNull();
    expect(sw?.closest('.tfs__switch')).not.toBeNull();
  });

  it('proyecta el panel de runtime dentro del header', () => {
    const el = setup().nativeElement as HTMLElement;
    const runtime = el.querySelector('.tfs__topbar [data-testid="runtime"]');
    expect(runtime).not.toBeNull();
  });

  it('proyecta el contenido (tabs) fuera del header, en el contenedor de tabs', () => {
    const el = setup().nativeElement as HTMLElement;
    const tabs = el.querySelector('.tfs__tabs [data-testid="tabs"]');
    expect(tabs).not.toBeNull();
    // el contenido NO debe caer dentro del header
    expect(el.querySelector('.tfs__topbar [data-testid="tabs"]')).toBeNull();
  });
});
