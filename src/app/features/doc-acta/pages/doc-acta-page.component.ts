import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription, switchMap, takeWhile, timer } from 'rxjs';

import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ActaFormComponent } from '../components/acta-form/acta-form.component';
import { ActaViewComponent } from '../components/acta-view/acta-view.component';
import { AudioUploadComponent } from '../components/audio-upload/audio-upload.component';
import { ExportPanelComponent } from '../components/export-panel/export-panel.component';
import { ProgressStepsComponent } from '../components/progress-steps/progress-steps.component';
import { TranscriptionViewComponent } from '../components/transcription-view/transcription-view.component';
import { Acta, ActaJob, ActaUpdatePayload, AudioFileInfo } from '../models/doc-acta.models';
import { DocActaService } from '../services/doc-acta.service';

@Component({
  selector: 'app-doc-acta-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ActaFormComponent,
    ActaViewComponent,
    AudioUploadComponent,
    ExportPanelComponent,
    ProgressStepsComponent,
    TranscriptionViewComponent,
  ],
  templateUrl: './doc-acta-page.component.html',
  styleUrl: './doc-acta-page.component.scss',
})
export class DocActaPageComponent implements OnDestroy {
  private readonly docActaService = inject(DocActaService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private pollingSubscription?: Subscription;

  readonly selectedFile = signal<File | null>(null);
  readonly fileInfo = signal<AudioFileInfo | null>(null);
  readonly job = signal<ActaJob | null>(null);
  readonly acta = signal<Acta | null>(null);
  readonly isLoadingActa = signal(false);
  readonly isSavingActa = signal(false);
  readonly isSavingTranscription = signal(false);
  readonly isSavingSpeakers = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly isProcessing = computed(() => {
    const status = this.job()?.status;
    return this.isSubmitting() || status === 'queued' || status === 'running';
  });

  readonly canStart = computed(() => Boolean(this.selectedFile()) && !this.isProcessing());

  onFileSelected(file: File): void {
    this.selectedFile.set(file);
    this.fileInfo.set({
      name: file.name,
      sizeLabel: this.formatFileSize(file.size),
      extension: this.getExtension(file.name),
    });
    this.job.set(null);
    this.acta.set(null);
    this.errorMessage.set(null);
  }

  async removeFile(): Promise<void> {
    if (this.isProcessing()) {
      return;
    }

    const confirmed = await this.confirmDialogService.confirm({
      title: 'Quitar audio',
      message: 'Se limpiará el audio seleccionado y el resultado actual de DocActa.',
      confirmLabel: 'Quitar audio',
      tone: 'danger',
    });

    if (!confirmed) {
      return;
    }

    this.selectedFile.set(null);
    this.fileInfo.set(null);
    this.job.set(null);
    this.acta.set(null);
    this.errorMessage.set(null);
  }

  startJob(): void {
    const file = this.selectedFile();
    if (!file) {
      return;
    }

    this.isSubmitting.set(true);
    this.acta.set(null);
    this.errorMessage.set(null);
    this.pollingSubscription?.unsubscribe();

    this.docActaService.createJob(file).subscribe({
      next: (job) => {
        this.job.set(job);
        this.isSubmitting.set(false);
        this.pollJob(job.job_id);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.getErrorMessage(error, 'No se pudo iniciar el procesamiento del audio.'));
      },
    });
  }

  private pollJob(jobId: string): void {
    // Polling consulta el backend periodicamente hasta que el trabajo termina.
    this.pollingSubscription = timer(0, 2500)
      .pipe(
        switchMap(() => this.docActaService.getJob(jobId)),
        takeWhile((job) => job.status === 'queued' || job.status === 'running', true),
      )
      .subscribe({
        next: (job) => {
          this.job.set(job);
          if (job.status === 'completed' && job.acta_id) {
            this.loadActa(job.acta_id);
          }
          if (job.status === 'failed') {
            this.errorMessage.set(job.error || 'No se pudo completar el procesamiento.');
          }
        },
        error: (error) => {
          this.errorMessage.set(this.getErrorMessage(error, 'No se pudo consultar el progreso del procesamiento.'));
        },
      });
  }

  private loadActa(actaId: string): void {
    this.isLoadingActa.set(true);
    this.docActaService.getActa(actaId).subscribe({
      next: (acta) => {
        this.acta.set(acta);
        this.isLoadingActa.set(false);
      },
      error: (error) => {
        this.isLoadingActa.set(false);
        this.errorMessage.set(this.getErrorMessage(error, 'El acta fue creada, pero no se pudo cargar la transcripcion.'));
      },
    });
  }

  saveActa(payload: ActaUpdatePayload): void {
    const acta = this.acta();
    if (!acta) {
      return;
    }

    this.isSavingActa.set(true);
    this.errorMessage.set(null);

    this.docActaService.updateActa(acta.id, payload).subscribe({
      next: (updatedActa) => {
        this.acta.set(updatedActa);
        this.isSavingActa.set(false);
      },
      error: (error) => {
        this.isSavingActa.set(false);
        this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron guardar los cambios del acta.'));
      },
    });
  }

  saveTranscription(transcription: string): void {
    const acta = this.acta();
    if (!acta) {
      return;
    }

    this.isSavingTranscription.set(true);
    this.errorMessage.set(null);

    this.docActaService.updateActa(acta.id, { transcription }).subscribe({
      next: (updatedActa) => {
        this.acta.set(updatedActa);
        this.isSavingTranscription.set(false);
      },
      error: (error) => {
        this.isSavingTranscription.set(false);
        this.errorMessage.set(this.getErrorMessage(error, 'No se pudo guardar la transcripcion revisada.'));
      },
    });
  }

  saveSpeakerNames(names: Record<string, string>): void {
    const acta = this.acta();
    if (!acta) {
      return;
    }

    this.isSavingSpeakers.set(true);
    this.errorMessage.set(null);
    this.docActaService.updateSpeakerNames(acta.id, { names }).subscribe({
      next: (updatedActa) => {
        this.acta.set(updatedActa);
        this.isSavingSpeakers.set(false);
      },
      error: (error) => {
        this.isSavingSpeakers.set(false);
        this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron actualizar los participantes.'));
      },
    });
  }

  private formatFileSize(size: number): string {
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  private getExtension(filename: string): string {
    const extension = filename.split('.').pop();
    return extension ? extension.toUpperCase() : 'AUDIO';
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    if (error.status === 429) {
      return 'DocActa ya tiene un procesamiento en curso. Espera a que termine antes de iniciar otro.';
    }

    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : fallback;
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
  }
}
