import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { Acta, ActaJob, ActaTask, ActaUpdatePayload } from '../../models/doc-acta.models';

interface ActaBlock {
  type: 'title' | 'heading' | 'subheading' | 'property' | 'paragraph' | 'bullet' | 'number' | 'task' | 'divider';
  text: string;
  label?: string;
  value?: string;
  checked?: boolean;
}

@Component({
  selector: 'app-acta-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './acta-view.component.html',
  styleUrl: './acta-view.component.scss',
})
export class ActaViewComponent implements OnChanges {
  private readonly confirmDialogService = inject(ConfirmDialogService);

  @Input() job: ActaJob | null = null;
  @Input() acta: Acta | null = null;
  @Input() isSaving = false;
  @Input() isRegenerating = false;
  @Output() saveActa = new EventEmitter<ActaUpdatePayload>();
  @Output() regenerateActa = new EventEmitter<void>();

  isEditing = false;
  draftResult = '';
  draftTasks: ActaTask[] = [];

  get isCompleted(): boolean {
    return Boolean(this.acta) || this.job?.status === 'completed';
  }

  get renderedBlocks(): ActaBlock[] {
    const result = this.acta?.result?.trim();
    if (!result) {
      return [];
    }

    return result
      .split(/\r?\n/)
      .map((line) => this.parseBlock(line))
      .filter((block): block is ActaBlock => block !== null);
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

  async cancelEditing(): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({
      title: 'Descartar cambios',
      message: 'Se perderán los ajustes realizados en el acta.',
      confirmLabel: 'Descartar',
      tone: 'danger',
    });

    if (!confirmed) {
      return;
    }

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

  async removeTask(index: number): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({
      title: 'Quitar tarea',
      message: 'Esta tarea se eliminará del borrador del acta.',
      confirmLabel: 'Quitar',
      tone: 'danger',
    });

    if (!confirmed) {
      return;
    }

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

  private parseBlock(rawLine: string): ActaBlock | null {
    const line = rawLine.trim();
    if (!line) {
      return null;
    }

    if (line === '---') {
      return { type: 'divider', text: '' };
    }

    if (line.startsWith('# ')) {
      return { type: 'title', text: this.cleanInline(line.slice(2)) };
    }

    if (line.startsWith('## ')) {
      return { type: 'heading', text: this.cleanInline(line.slice(3)) };
    }

    if (line.startsWith('### ')) {
      return { type: 'subheading', text: this.cleanInline(line.slice(4)) };
    }

    const propertyMatch = line.match(/^\*\*(.+?)\*\*:\s*(.*)$/);
    if (propertyMatch) {
      return {
        type: 'property',
        text: '',
        label: this.cleanInline(propertyMatch[1]),
        value: this.cleanInline(propertyMatch[2] || 'No especificado'),
      };
    }

    const taskMatch = line.match(/^-\s+\[( |x|X)\]\s+(.*)$/);
    if (taskMatch) {
      return {
        type: 'task',
        text: this.cleanInline(taskMatch[2]),
        checked: taskMatch[1].toLowerCase() === 'x',
      };
    }

    if (line.startsWith('- ')) {
      return { type: 'bullet', text: this.cleanInline(line.slice(2)) };
    }

    const numberMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberMatch) {
      return { type: 'number', text: `${numberMatch[1]}. ${this.cleanInline(numberMatch[2])}` };
    }

    return { type: 'paragraph', text: this.cleanInline(line) };
  }

  private cleanInline(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .trim();
  }

  private resetDraft(): void {
    this.draftResult = this.acta?.result ?? '';
    this.draftTasks = (this.acta?.tasks ?? []).map((task) => ({ ...task }));
  }
}
