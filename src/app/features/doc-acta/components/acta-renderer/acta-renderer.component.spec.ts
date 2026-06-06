import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActaRendererComponent } from './acta-renderer.component';

describe('ActaRendererComponent', () => {
  let component: ActaRendererComponent;
  let fixture: ComponentFixture<ActaRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActaRendererComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActaRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render markdown as document blocks', () => {
    component.content = '# ACTA\n\n**Fecha:** 24 de mayo\n\n## Participantes\n\n- Docente\n- [ ] Revisar acta';

    expect(component.renderedBlocks.map((block) => block.type)).toEqual([
      'title',
      'property',
      'heading',
      'bullet',
      'task',
    ]);
  });
});
