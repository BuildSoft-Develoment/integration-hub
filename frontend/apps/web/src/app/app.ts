import { Component } from '@angular/core';
import { AppLayoutComponent } from '@integration-hub/shared/ui';

@Component({
  standalone: true,
  imports: [AppLayoutComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = 'integration-hub-web';
}
