import { Component } from '@angular/core';

@Component({
  selector: 'app-sample-plugin-widget',
  standalone: true,
  template: `
    <section class="sample-plugin-widget">
      <h3>Sample remote plugin</h3>
      <p>Loaded over Native Federation and verified by the ADR-013 chain.</p>
    </section>
  `,
  styles: [
    `.sample-plugin-widget { padding: 1rem; border: 1px solid var(--border, #ccc); border-radius: 8px; }`,
  ],
})
export class SamplePluginWidgetComponent {}
