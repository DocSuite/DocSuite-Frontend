import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { DocActaService } from '../services/doc-acta.service';
import { DocActaPageComponent } from './doc-acta-page.component';

describe('DocActaPageComponent', () => {
  let component: DocActaPageComponent;
  let fixture: ComponentFixture<DocActaPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocActaPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
        {
          provide: DocActaService,
          useValue: {
            createJob: () =>
              of({
                job_id: 'job-1',
                status: 'completed',
                progress: 100,
                message: 'Completed',
                acta_id: 'acta-1',
                error: null,
              }),
            streamJob: () =>
              of({
                job_id: 'job-1',
                status: 'completed',
                progress: 100,
                message: 'Completed',
                acta_id: 'acta-1',
                error: null,
              }),
            getJob: () =>
              of({
                job_id: 'job-1',
                status: 'completed',
                progress: 100,
                message: 'Completed',
                acta_id: 'acta-1',
                error: null,
              }),
            getActa: () =>
              of({
                id: 'acta-1',
                created_at: '2026-05-24T00:00:00Z',
                updated_at: '2026-05-24T00:00:00Z',
                filename: 'meeting.mp3',
                duration_seconds: 60,
                transcription: 'Texto transcrito',
                diarization: { segments: [] },
                result: 'Acta',
                tasks: [],
              }),
            updateActa: () =>
              of({
                id: 'acta-1',
                created_at: '2026-05-24T00:00:00Z',
                updated_at: '2026-05-24T00:00:00Z',
                filename: 'meeting.mp3',
                duration_seconds: 60,
                transcription: 'Texto transcrito',
                diarization: { segments: [] },
                result: 'Acta editada',
                tasks: [],
              }),
            updateSpeakerNames: () =>
              of({
                id: 'acta-1',
                created_at: '2026-05-24T00:00:00Z',
                updated_at: '2026-05-24T00:00:00Z',
                filename: 'meeting.mp3',
                duration_seconds: 60,
                transcription: 'Texto transcrito',
                diarization: { segments: [] },
                result: 'Acta editada',
                tasks: [],
              }),
            regenerateActa: () =>
              of({
                id: 'acta-1',
                created_at: '2026-05-24T00:00:00Z',
                updated_at: '2026-05-24T00:00:00Z',
                filename: 'meeting.mp3',
                duration_seconds: 60,
                transcription: 'Texto transcrito',
                diarization: { segments: [] },
                result: 'Acta regenerada',
                tasks: [],
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocActaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
