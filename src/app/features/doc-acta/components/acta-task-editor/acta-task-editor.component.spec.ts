import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActaTaskEditorComponent } from './acta-task-editor.component';

describe('ActaTaskEditorComponent', () => {
  let component: ActaTaskEditorComponent;
  let fixture: ComponentFixture<ActaTaskEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActaTaskEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActaTaskEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit a new empty task', () => {
    spyOn(component.tasksChange, 'emit');
    spyOn(component.draftChange, 'emit');

    component.addTask();

    expect(component.tasksChange.emit).toHaveBeenCalledWith([
      { description: '', owner: '', due_date: '', done: false },
    ]);
    expect(component.draftChange.emit).toHaveBeenCalled();
  });
});
