// @trace spec 007-tema-del-sistema RF-001, RF-003 (tema: consultar/persistir configuracion singleton via /api/system/theme)
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ThemeConfiguration } from './theme.service';

@Injectable({ providedIn: 'root' })
export class SystemThemeConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/system/theme';

  get(): Observable<ThemeConfiguration> {
    return this.http.get<ThemeConfiguration>(this.baseUrl);
  }

  update(configuration: ThemeConfiguration): Observable<ThemeConfiguration> {
    return this.http.put<ThemeConfiguration>(this.baseUrl, configuration);
  }
}
