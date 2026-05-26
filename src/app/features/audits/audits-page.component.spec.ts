import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuditService } from './audit.service';
import { AuditsPageComponent } from './audits-page.component';

describe('AuditsPageComponent', () => {
  let component: AuditsPageComponent;
  let fixture: ComponentFixture<AuditsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditsPageComponent],
      providers: [
        {
          provide: AuditService,
          useValue: {
            listAudits: () => of([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
