import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranscriptionReaderComponent } from './transcription-reader.component';

describe('TranscriptionReaderComponent', () => {
  let component: TranscriptionReaderComponent;
  let fixture: ComponentFixture<TranscriptionReaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranscriptionReaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TranscriptionReaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should split transcription into paragraphs', () => {
    component.transcription = 'Primer parrafo\n\nSegundo parrafo';

    expect(component.paragraphs).toEqual(['Primer parrafo', 'Segundo parrafo']);
  });
});
