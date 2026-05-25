import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActaViewComponent } from './acta-view.component';

describe('ActaViewComponent', () => {
  let component: ActaViewComponent;
  let fixture: ComponentFixture<ActaViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActaViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActaViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
