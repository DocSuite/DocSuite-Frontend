import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Acta, ActaJob, ActaTask, ActaUpdatePayload } from '../../models/doc-acta.models';

@Component({
  selector: 'app-acta-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './acta-view.component.html',
  styleUrl: './acta-view.component.scss',
})
export class ActaViewComponent implements OnChanges {
  @Input() job: ActaJob | null = null;
  @Input() acta: Acta | null = null;
  @Input() isSaving = false;
  @Output() saveActa = new EventEmitter<ActaUpdatePayload>();

  isEditing = false;
  draftResult = '';
  draftTasks: ActaTask[] = [];

  get isCompleted(): boolean {
    return this.job?.status === 'completed';
  }

  get resultParagraphs(): string[] {
    const result = this.acta?.result?.trim();
    if (!result) {
      return [];
    }

    return result
      .split(/\r?\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['acta']) {
      this.resetDraft();
      if (this.isEditing && changes['acta'].previousValue && changes['acta'].currentValue) {
        this.isEditing = false;
      }
    }
  }

  startEditing(): void {
    if (!this.acta) {
      return;
    }

    this.resetDraft();
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.resetDraft();
  }

  addTask(): void {
    this.draftTasks = [
      ...this.draftTasks,
      {
        description: '',
        owner: '',
        due_date: '',
        done: false,
      },
    ];
  }

  removeTask(index: number): void {
    this.draftTasks = this.draftTasks.filter((_, currentIndex) => currentIndex !== index);
  }

  saveChanges(): void {
    this.saveActa.emit({
      result: this.draftResult.trim(),
      tasks: this.draftTasks
        .filter((task) => task.description.trim().length > 0)
        .map((task) => ({
          description: task.description.trim(),
          owner: task.owner?.trim() || null,
          due_date: task.due_date?.trim() || null,
          done: task.done,
        })),
    });
  }

  finishSaving(): void {
    this.isEditing = false;
    this.resetDraft();
  }

  trackByIndex(index: number): number {
    return index;
  }

  private resetDraft(): void {
    this.draftResult = this.acta?.result ?? '';
    this.draftTasks = (this.acta?.tasks ?? []).map((task) => ({ ...task }));
  }
}
