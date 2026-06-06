import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ActaTask } from '../../models/doc-acta.models';

@Component({
  selector: 'app-acta-task-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './acta-task-editor.component.html',
  styleUrl: './acta-task-editor.component.scss',
})
export class ActaTaskEditorComponent {
  @Input() tasks: ActaTask[] = [];
  @Input() isSaving = false;
  @Output() tasksChange = new EventEmitter<ActaTask[]>();
  @Output() draftChange = new EventEmitter<void>();
  @Output() removeTaskRequest = new EventEmitter<number>();

  addTask(): void {
    this.tasksChange.emit([
      ...this.tasks,
      {
        description: '',
        owner: '',
        due_date: '',
        done: false,
      },
    ]);
    this.draftChange.emit();
  }

  onTaskChange(): void {
    this.tasksChange.emit(this.tasks.map((task) => ({ ...task })));
    this.draftChange.emit();
  }

  trackByIndex(index: number): number {
    return index;
  }
}
