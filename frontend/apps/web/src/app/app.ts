import { Component } from '@angular/core';
import { AppShellComponent } from '@integration-hub/shared/ui';

@Component({
  standalone: true,
  imports: [AppShellComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = 'integration-hub-web';
}
