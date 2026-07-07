import { bootstrapApplication } from '@angular/platform-browser';
import { provideZoneChangeDetection } from '@angular/core';
import { StandaloneHostComponent } from './app/host.component';

// Standalone dev host: cuando se abre el remoto directo (fuera de la shell) monta el widget.
// En produccion la shell de la plataforma carga ./Widget via Native Federation, no este host.
bootstrapApplication(StandaloneHostComponent, {
  providers: [provideZoneChangeDetection({ eventCoalescing: true })],
}).catch((err) => console.error(err));
