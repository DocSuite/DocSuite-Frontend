import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { TokenService } from '../../../core/auth/token.service';
import { environment } from '../../../../environments/environment';
import { Acta, ActaJob, ActaUpdatePayload, SpeakerNamePayload } from '../models/doc-acta.models';

@Injectable({
  providedIn: 'root',
})
export class DocActaService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly apiUrl = environment.apiUrl;

  createJob(file: File): Observable<ActaJob> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ActaJob>(`${this.apiUrl}/meeting-minutes/jobs`, formData);
  }

  getJob(jobId: string): Observable<ActaJob> {
    return this.http.get<ActaJob>(`${this.apiUrl}/meeting-minutes/jobs/${jobId}`);
  }

  streamJob(jobId: string): Observable<ActaJob> {
    return new Observable((observer) => {
      const controller = new AbortController();
      const token = this.tokenService.getToken();

      fetch(`${this.apiUrl}/meeting-minutes/jobs/${jobId}/stream`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok || !response.body) {
            throw new Error('SSE unavailable');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop() ?? '';

            for (const event of events) {
              const data = event
                .split('\n')
                .find((line) => line.startsWith('data: '))
                ?.slice(6);

              if (!data) {
                continue;
              }

              const payload = JSON.parse(data);
              if (payload.error) {
                throw new Error(payload.error);
              }

              observer.next({ job_id: jobId, ...payload });
              if (payload.status === 'completed' || payload.status === 'failed') {
                observer.complete();
                controller.abort();
                return;
              }
            }
          }
        })
        .catch((error) => {
          if (!controller.signal.aborted) {
            observer.error(error);
          }
        });

      return () => controller.abort();
    });
  }

  getActa(actaId: string): Observable<Acta> {
    return this.http.get<Acta>(`${this.apiUrl}/meeting-minutes/${actaId}`);
  }

  listMeetingMinutes(): Observable<Acta[]> {
    return this.http.get<Acta[]>(`${this.apiUrl}/history/meeting-minutes`);
  }

  updateActa(actaId: string, payload: ActaUpdatePayload): Observable<Acta> {
    return this.http.patch<Acta>(`${this.apiUrl}/meeting-minutes/${actaId}`, payload);
  }

  updateSpeakerNames(actaId: string, payload: SpeakerNamePayload): Observable<Acta> {
    return this.http.patch<Acta>(`${this.apiUrl}/meeting-minutes/${actaId}/speakers`, payload);
  }

  regenerateActa(actaId: string): Observable<Acta> {
    return this.http.post<Acta>(`${this.apiUrl}/meeting-minutes/${actaId}/regenerate`, {});
  }

  downloadActaDocx(actaId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/meeting-minutes/${actaId}/export/docx`, {
      responseType: 'blob',
    });
  }
}
