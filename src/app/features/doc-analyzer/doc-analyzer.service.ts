import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { TokenService } from '../../core/auth/token.service';
import { environment } from '../../../environments/environment';
import { AnalysisMode, DocumentAnalysis, DocumentAnalysisJob } from './doc-analyzer.models';

@Injectable({
  providedIn: 'root',
})
export class DocAnalyzerService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly apiUrl = environment.apiUrl;

  analyzeDocument(file: File, mode: AnalysisMode): Observable<DocumentAnalysis> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    return this.http.post<DocumentAnalysis>(`${this.apiUrl}/documents/analysis`, formData);
  }

  createJob(file: File, mode: AnalysisMode): Observable<DocumentAnalysisJob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    return this.http.post<DocumentAnalysisJob>(`${this.apiUrl}/documents/analysis/jobs`, formData);
  }

  streamJob(jobId: string): Observable<DocumentAnalysisJob> {
    return new Observable((observer) => {
      const controller = new AbortController();
      const token = this.tokenService.getToken();

      fetch(`${this.apiUrl}/documents/analysis/jobs/${jobId}/stream`, {
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

  getAnalysis(analysisId: string): Observable<DocumentAnalysis> {
    return this.http.get<DocumentAnalysis>(`${this.apiUrl}/documents/analysis/${analysisId}`);
  }

  downloadAnalysisDocx(analysisId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/documents/analysis/${analysisId}/export/docx`, {
      responseType: 'blob',
    });
  }

  listAnalyses(): Observable<DocumentAnalysis[]> {
    return this.http.get<DocumentAnalysis[]>(`${this.apiUrl}/history/document-analyses`);
  }
}
