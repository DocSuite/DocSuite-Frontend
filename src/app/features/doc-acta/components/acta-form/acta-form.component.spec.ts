import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActaFormComponent } from './acta-form.component';

describe('ActaFormComponent', () => {
  let component: ActaFormComponent;
  let fixture: ComponentFixture<ActaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActaFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
