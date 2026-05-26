import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';

import { Acta } from '../../models/doc-acta.models';
import { TranscriptionViewComponent } from './transcription-view.component';

describe('TranscriptionViewComponent', () => {
  let component: TranscriptionViewComponent;
  let fixture: ComponentFixture<TranscriptionViewComponent>;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [TranscriptionViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TranscriptionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format duration as minutes and seconds', () => {
    expect(component.formatTime(65)).toBe('1:05');
  });

  it('should recover local transcription draft', () => {
    const acta = createActa();
    localStorage.setItem('docsuite.docacta.transcriptionDraft.acta-1', JSON.stringify({
      transcription: 'Texto editado local',
    }));

    component.acta = acta;
    component.ngOnChanges({
      acta: new SimpleChange(null, acta, true),
    });
    component.startEditing();

    expect(component.draftTranscription).toBe('Texto editado local');
    expect(component.hasLocalDraft).toBeTrue();
  });
});

function createActa(): Acta {
  return {
    id: 'acta-1',
    created_at: '2026-05-24T00:00:00Z',
    updated_at: '2026-05-24T00:00:00Z',
    filename: 'meeting.mp3',
    duration_seconds: 60,
    transcription: 'Texto transcrito',
    diarization: { segments: [] },
    result: 'Acta',
    tasks: [],
  };
}
