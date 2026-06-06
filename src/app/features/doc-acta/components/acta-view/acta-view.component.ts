import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, inject, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { ActaRendererComponent } from '../acta-renderer/acta-renderer.component';
import { ActaTaskEditorComponent } from '../acta-task-editor/acta-task-editor.component';
import { Acta, ActaJob, ActaTask, ActaUpdatePayload } from '../../models/doc-acta.models';

@Component({
  selector: 'app-acta-view',
  standalone: true,
  imports: [CommonModule, FormsModule, ActaRendererComponent, ActaTaskEditorComponent],
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

  @HostListener('keydown', ['$event'])
  handleEditorShortcut(event: KeyboardEvent): void {
    if (!this.isEditing || this.isSaving) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && this.draftResult.trim()) {
      event.preventDefault();
      this.saveChanges();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      void this.cancelEditing();
    }
  }

  finishSaving(): void {
    this.isEditing = false;
    this.clearLocalDraft();
    this.draftStatus = null;
    this.resetDraft();
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
