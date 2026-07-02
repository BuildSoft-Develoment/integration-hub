import { TestBed } from '@angular/core/testing';

import { UiKitGalleryComponent } from './ui-kit-gallery.component';

describe('UiKitGalleryComponent', () => {
  async function render() {
    TestBed.configureTestingModule({ imports: [UiKitGalleryComponent] });
    const fixture = TestBed.createComponent(UiKitGalleryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders every status badge kind and the UI-kit primitives', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    // One badge per kind (plus the badges inside the catalog rows).
    expect(el.querySelectorAll('ih-status-badge').length).toBeGreaterThanOrEqual(5);
    expect(el.querySelector('ih-empty-state')).toBeTruthy();
    expect(el.querySelector('ih-loading')).toBeTruthy();
    expect(el.querySelector('ih-catalog-list')).toBeTruthy();
    expect(el.querySelectorAll('ih-icon').length).toBeGreaterThan(0);
  });

  it('shows sample rows by default and empties them when a non-data state is selected', async () => {
    const fixture = await render();
    const component = fixture.componentInstance;

    expect(component.visibleRows().length).toBe(3);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('[data-row-index]').length).toBe(3);

    component.state.set('empty');
    fixture.detectChanges();
    expect(component.visibleRows().length).toBe(0);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('[data-row-index]').length).toBe(0);

    component.state.set('error');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.ih-catalog-error__message')).toBeTruthy();
  });
});
