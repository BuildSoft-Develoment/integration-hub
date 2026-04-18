import { Component } from '@angular/core';
import { AppLayoutComponent } from '@integration-hub/shared/ui';

@Component({
  standalone: true,
  imports: [AppLayoutComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  protected readonly title = 'integration-hub-web';
}
