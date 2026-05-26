import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';

import { Acta } from '../../models/doc-acta.models';
import { ActaViewComponent } from './acta-view.component';

describe('ActaViewComponent', () => {
  let component: ActaViewComponent;
  let fixture: ComponentFixture<ActaViewComponent>;

  beforeEach(async () => {
    localStorage.clear();

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
    component.acta = createActa('# ACTA\n\n**Fecha:** 24 de mayo\n\n## Participantes\n\n- Docente\n- [ ] Revisar acta');

    expect(component.renderedBlocks.map((block) => block.type)).toEqual([
      'title',
      'property',
      'heading',
      'bullet',
      'task',
    ]);
  });

  it('should recover local acta draft', () => {
    const acta = createActa('Acta original');
    localStorage.setItem('docsuite.docacta.actaDraft.acta-1', JSON.stringify({
      result: 'Acta editada local',
      tasks: [],
    }));

    component.acta = acta;
    component.ngOnChanges({
      acta: new SimpleChange(null, acta, true),
    });
    component.startEditing();

    expect(component.draftResult).toBe('Acta editada local');
    expect(component.hasLocalDraft).toBeTrue();
  });
});

function createActa(result: string): Acta {
  return {
    id: 'acta-1',
    created_at: '2026-05-24T00:00:00Z',
    updated_at: '2026-05-24T00:00:00Z',
    filename: 'meeting.mp3',
    duration_seconds: 60,
    transcription: 'Texto',
    diarization: { segments: [] },
    result,
    tasks: [],
  };
}
