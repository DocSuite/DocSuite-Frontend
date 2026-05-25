import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { Subscription, switchMap, takeWhile, timer } from 'rxjs';

import { ActaFormComponent } from '../components/acta-form/acta-form.component';
import { ActaViewComponent } from '../components/acta-view/acta-view.component';
import { AudioUploadComponent } from '../components/audio-upload/audio-upload.component';
import { ExportPanelComponent } from '../components/export-panel/export-panel.component';
import { ProgressStepsComponent } from '../components/progress-steps/progress-steps.component';
import { TranscriptionViewComponent } from '../components/transcription-view/transcription-view.component';
import { ActaJob, AudioFileInfo } from '../models/doc-acta.models';
import { DocActaService } from '../services/doc-acta.service';

@Component({
  selector: 'app-doc-acta-page',
  standalone: true,
  imports: [
    CommonModule,
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
  private pollingSubscription?: Subscription;

  readonly selectedFile = signal<File | null>(null);
  readonly fileInfo = signal<AudioFileInfo | null>(null);
  readonly job = signal<ActaJob | null>(null);
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
    this.errorMessage.set(null);
  }

  removeFile(): void {
    if (this.isProcessing()) {
      return;
    }

    this.selectedFile.set(null);
    this.fileInfo.set(null);
    this.job.set(null);
    this.errorMessage.set(null);
  }

  startJob(): void {
    const file = this.selectedFile();
    if (!file) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.pollingSubscription?.unsubscribe();

    this.docActaService.createJob(file).subscribe({
      next: (job) => {
        this.job.set(job);
        this.isSubmitting.set(false);
        this.pollJob(job.job_id);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('No se pudo iniciar el procesamiento del audio.');
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
          if (job.status === 'failed') {
            this.errorMessage.set(job.error || 'No se pudo completar el procesamiento.');
          }
        },
        error: () => {
          this.errorMessage.set('No se pudo consultar el progreso del procesamiento.');
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

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
  }
}
