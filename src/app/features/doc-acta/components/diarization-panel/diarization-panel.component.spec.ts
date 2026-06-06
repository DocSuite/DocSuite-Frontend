import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiarizationPanelComponent } from './diarization-panel.component';

describe('DiarizationPanelComponent', () => {
  let component: DiarizationPanelComponent;
  let fixture: ComponentFixture<DiarizationPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiarizationPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DiarizationPanelComponent);
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
