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
});
