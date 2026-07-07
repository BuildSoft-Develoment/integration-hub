import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoTransformWidgetComponent } from './widget.component';

// Solo para desarrollo standalone (abrir el remoto directo). La shell de la plataforma
// NO usa este host; carga el modulo expuesto ./Widget directamente.
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DemoTransformWidgetComponent],
  template: `
    <main style="max-width: 640px; margin: 2rem auto; font-family: system-ui;">
      <h1>demo-transform-widget (dev host)</h1>
      <app-demo-transform-widget />
    </main>
  `,
})
export class StandaloneHostComponent {}
