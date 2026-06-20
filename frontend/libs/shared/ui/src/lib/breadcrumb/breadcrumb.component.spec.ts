import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BreadcrumbComponent, IhBreadcrumbItem } from './breadcrumb.component';

@Component({
  standalone: true,
  imports: [BreadcrumbComponent],
  template: `<ih-breadcrumb [items]="items" />`,
})
class HostComponent {
  items: IhBreadcrumbItem[] = [
    { label: 'Auditoria', link: ['/audit'] },
    { label: 'Cuarentena' },
  ];
}

describe('BreadcrumbComponent', () => {
  function render() {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza un landmark de navegación con aria-label', () => {
    const nav: HTMLElement = render().nativeElement.querySelector('nav.ih-breadcrumb');
    expect(nav).toBeTruthy();
    expect(nav.getAttribute('aria-label')).toBe('breadcrumb');
  });

  it('el último item es el actual (aria-current=page) y no es enlace', () => {
    const el: HTMLElement = render().nativeElement;
    const current = el.querySelector('.ih-breadcrumb__current');
    expect(current?.textContent?.trim()).toBe('Cuarentena');
    expect(current?.getAttribute('aria-current')).toBe('page');
    expect(el.querySelectorAll('a.ih-breadcrumb__link').length).toBe(1);
  });
});
