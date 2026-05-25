import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DocActaService } from '../../services/doc-acta.service';
import { ExportPanelComponent } from './export-panel.component';

describe('ExportPanelComponent', () => {
  let component: ExportPanelComponent;
  let fixture: ComponentFixture<ExportPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportPanelComponent],
      providers: [
        {
          provide: DocActaService,
          useValue: {
            downloadActaDocx: () => of(new Blob(['docx'])),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
