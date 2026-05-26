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

  it('should render markdown as document blocks', () => {
    component.acta = {
      id: 'acta-1',
      created_at: '2026-05-24T00:00:00Z',
      updated_at: '2026-05-24T00:00:00Z',
      filename: 'meeting.mp3',
      duration_seconds: 60,
      transcription: 'Texto',
      diarization: { segments: [] },
      result: '# ACTA\n\n**Fecha:** 24 de mayo\n\n## Participantes\n\n- Docente\n- [ ] Revisar acta',
      tasks: [],
    };

    expect(component.renderedBlocks.map((block) => block.type)).toEqual([
      'title',
      'property',
      'heading',
      'bullet',
      'task',
    ]);
  });
});
