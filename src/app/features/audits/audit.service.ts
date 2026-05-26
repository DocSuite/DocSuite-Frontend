import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuditRecord } from './audit.models';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  listAudits(): Observable<AuditRecord[]> {
    return this.http.get<AuditRecord[]>(`${this.apiUrl}/audits`);
  }
}
