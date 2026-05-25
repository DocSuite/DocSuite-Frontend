import { ComponentFixture, TestBed } from '@angular/core/testing';
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
            getJob: () =>
              of({
                job_id: 'job-1',
                status: 'completed',
                progress: 100,
                message: 'Completed',
                acta_id: 'acta-1',
                error: null,
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
