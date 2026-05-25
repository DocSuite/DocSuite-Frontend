import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { environment } from '../../../../environments/environment';
import { DocActaService } from './doc-acta.service';

describe('DocActaService', () => {
  let service: DocActaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DocActaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create an acta job', () => {
    const file = new File(['audio'], 'meeting.mp3', { type: 'audio/mpeg' });

    service.createJob(file).subscribe((response) => {
      expect(response.job_id).toBe('job-1');
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/meeting-minutes/jobs`);
    expect(request.request.method).toBe('POST');
    request.flush({
      job_id: 'job-1',
      status: 'queued',
      progress: 0,
      message: 'Queued',
      acta_id: null,
      error: null,
    });
  });

  it('should get an acta by id', () => {
    service.getActa('acta-1').subscribe((response) => {
      expect(response.id).toBe('acta-1');
      expect(response.transcription).toBe('Texto transcrito');
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/meeting-minutes/acta-1`);
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'acta-1',
      created_at: '2026-05-24T00:00:00Z',
      updated_at: '2026-05-24T00:00:00Z',
      filename: 'meeting.mp3',
      duration_seconds: 60,
      transcription: 'Texto transcrito',
      diarization: { segments: [] },
      result: 'Acta',
      tasks: [],
    });
  });

  it('should update an acta', () => {
    service.updateActa('acta-1', { result: 'Acta editada', tasks: [] }).subscribe((response) => {
      expect(response.result).toBe('Acta editada');
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/meeting-minutes/acta-1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ result: 'Acta editada', tasks: [] });
    request.flush({
      id: 'acta-1',
      created_at: '2026-05-24T00:00:00Z',
      updated_at: '2026-05-24T00:00:00Z',
      filename: 'meeting.mp3',
      duration_seconds: 60,
      transcription: 'Texto transcrito',
      diarization: { segments: [] },
      result: 'Acta editada',
      tasks: [],
    });
  });

  it('should download an acta docx', () => {
    service.downloadActaDocx('acta-1').subscribe((response) => {
      expect(response instanceof Blob).toBeTrue();
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/meeting-minutes/acta-1/export/docx`);
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['docx']));
  });
});
