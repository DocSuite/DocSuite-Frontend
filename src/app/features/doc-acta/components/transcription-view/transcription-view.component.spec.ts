import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranscriptionViewComponent } from './transcription-view.component';

describe('TranscriptionViewComponent', () => {
  let component: TranscriptionViewComponent;
  let fixture: ComponentFixture<TranscriptionViewComponent>;

  beforeEach(async () => {
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
});
