import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { DocActaService } from '../../doc-acta/services/doc-acta.service';
import { HistorialPageComponent } from './historial-page.component';

describe('HistorialPageComponent', () => {
  let component: HistorialPageComponent;
  let fixture: ComponentFixture<HistorialPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: DocActaService,
          useValue: {
            listMeetingMinutes: () => of([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HistorialPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
