import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranscriptionEditorComponent } from './transcription-editor.component';

describe('TranscriptionEditorComponent', () => {
  let component: TranscriptionEditorComponent;
  let fixture: ComponentFixture<TranscriptionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranscriptionEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TranscriptionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit draft value and draft change', () => {
    spyOn(component.draftTranscriptionChange, 'emit');
    spyOn(component.draftChange, 'emit');

    component.onDraftInput('Texto editado');

    expect(component.draftTranscriptionChange.emit).toHaveBeenCalledWith('Texto editado');
    expect(component.draftChange.emit).toHaveBeenCalled();
  });
});
