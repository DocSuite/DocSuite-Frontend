import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
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
export class ActaViewComponent implements OnChanges, OnDestroy {
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private draftSaveTimeout: ReturnType<typeof setTimeout> | null = null;

  @Input() job: ActaJob | null = null;
  @Input() acta: Acta | null = null;
  @Input() isSaving = false;
  @Input() isRegenerating = false;
  @Output() saveActa = new EventEmitter<ActaUpdatePayload>();
  @Output() regenerateActa = new EventEmitter<void>();

  isEditing = false;
  draftResult = '';
  draftTasks: ActaTask[] = [];
  draftStatus: string | null = null;
  hasLocalDraft = false;

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
      const previousActa = changes['acta'].previousValue as Acta | null;
      const currentActa = changes['acta'].currentValue as Acta | null;

      if (this.isEditing && previousActa?.id && previousActa.id === currentActa?.id) {
        this.clearLocalDraft();
        this.draftStatus = null;
        this.isEditing = false;
      } else {
        if (previousActa?.id && previousActa.id === currentActa?.id && previousActa.result !== currentActa?.result) {
          this.clearLocalDraft();
          this.draftStatus = null;
        }
        this.resetDraft();
        this.loadLocalDraft();
      }
    }
  }

  startEditing(): void {
    if (!this.acta) {
      return;
    }

    this.resetDraft();
    this.loadLocalDraft();
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
    this.clearLocalDraft();
    this.draftStatus = null;
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
    this.onDraftChange();
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
    this.onDraftChange();
  }

  onDraftChange(): void {
    if (!this.isEditing) {
      return;
    }

    if (this.draftSaveTimeout) {
      clearTimeout(this.draftSaveTimeout);
    }

    this.draftStatus = 'Guardando borrador...';
    this.draftSaveTimeout = setTimeout(() => this.saveLocalDraft(), 500);
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
    this.clearLocalDraft();
    this.draftStatus = null;
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

  private loadLocalDraft(): void {
    const key = this.getDraftKey();
    if (!key) {
      this.hasLocalDraft = false;
      return;
    }

    const rawDraft = localStorage.getItem(key);
    if (!rawDraft) {
      this.hasLocalDraft = false;
      return;
    }

    try {
      const parsedDraft = JSON.parse(rawDraft) as { result?: string; tasks?: ActaTask[] };
      const resultChanged = typeof parsedDraft.result === 'string' && parsedDraft.result !== (this.acta?.result ?? '');
      const tasksChanged = Array.isArray(parsedDraft.tasks);

      if (resultChanged || tasksChanged) {
        this.draftResult = typeof parsedDraft.result === 'string' ? parsedDraft.result : this.draftResult;
        this.draftTasks = tasksChanged ? parsedDraft.tasks!.map((task) => ({ ...task })) : this.draftTasks;
        this.hasLocalDraft = true;
        this.draftStatus = 'Borrador local recuperado.';
        return;
      }
    } catch {
      localStorage.removeItem(key);
    }

    this.hasLocalDraft = false;
  }

  private saveLocalDraft(): void {
    const key = this.getDraftKey();
    if (!key) {
      return;
    }

    const serverTasks = JSON.stringify(this.acta?.tasks ?? []);
    const draftTasks = JSON.stringify(this.draftTasks);
    const hasChanges = this.draftResult.trim() !== (this.acta?.result ?? '').trim() || draftTasks !== serverTasks;

    if (!hasChanges) {
      this.clearLocalDraft();
      this.draftStatus = null;
      return;
    }

    localStorage.setItem(key, JSON.stringify({
      result: this.draftResult,
      tasks: this.draftTasks,
      updatedAt: new Date().toISOString(),
    }));
    this.hasLocalDraft = true;
    this.draftStatus = 'Borrador guardado localmente.';
  }

  private clearLocalDraft(): void {
    const key = this.getDraftKey();
    if (key) {
      localStorage.removeItem(key);
    }
    this.hasLocalDraft = false;
  }

  private getDraftKey(): string | null {
    return this.acta?.id ? `docsuite.docacta.actaDraft.${this.acta.id}` : null;
  }

  ngOnDestroy(): void {
    if (this.draftSaveTimeout) {
      clearTimeout(this.draftSaveTimeout);
    }
  }
}
