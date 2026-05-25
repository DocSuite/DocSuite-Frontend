import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Acta, ActaJob, ActaUpdatePayload } from '../models/doc-acta.models';

@Injectable({
  providedIn: 'root',
})
export class DocActaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  createJob(file: File): Observable<ActaJob> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ActaJob>(`${this.apiUrl}/meeting-minutes/jobs`, formData);
  }

  getJob(jobId: string): Observable<ActaJob> {
    return this.http.get<ActaJob>(`${this.apiUrl}/meeting-minutes/jobs/${jobId}`);
  }

  getActa(actaId: string): Observable<Acta> {
    return this.http.get<Acta>(`${this.apiUrl}/meeting-minutes/${actaId}`);
  }

  updateActa(actaId: string, payload: ActaUpdatePayload): Observable<Acta> {
    return this.http.patch<Acta>(`${this.apiUrl}/meeting-minutes/${actaId}`, payload);
  }
}
