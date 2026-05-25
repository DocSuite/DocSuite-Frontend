import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressStepsComponent } from './progress-steps.component';

describe('ProgressStepsComponent', () => {
  let component: ProgressStepsComponent;
  let fixture: ComponentFixture<ProgressStepsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressStepsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressStepsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
