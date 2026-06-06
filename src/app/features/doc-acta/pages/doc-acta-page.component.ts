import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, switchMap, takeWhile, timer } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ActaFormComponent } from '../components/acta-form/acta-form.component';
import { ActaViewComponent } from '../components/acta-view/acta-view.component';
import { AudioUploadComponent } from '../components/audio-upload/audio-upload.component';
import { ExportPanelComponent } from '../components/export-panel/export-panel.component';
import { ProgressStepsComponent } from '../components/progress-steps/progress-steps.component';
import { TranscriptionViewComponent } from '../components/transcription-view/transcription-view.component';
import { Acta, ActaJob, ActaUpdatePayload, AudioFileInfo, AudioValidationFeedback } from '../models/doc-acta.models';
import { DocActaService } from '../services/doc-acta.service';

const ALLOWED_AUDIO_EXTENSIONS = new Set([
  'aac',
  'aiff',
  'amr',
  'flac',
  'm4a',
  'mp3',
  'mp4',
  'mpeg',
  'oga',
  'ogg',
  'opus',
  'wav',
  'webm',
  'wma',
]);
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
const WARNING_FILE_SIZE_BYTES = 75 * 1024 * 1024;
const MAX_DURATION_SECONDS = 2 * 60 * 60;
const WARNING_DURATION_SECONDS = 60 * 60;

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
export class DocActaPageComponent implements OnInit, OnDestroy {
  private readonly docActaService = inject(DocActaService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private pollingSubscription?: Subscription;

  readonly selectedFile = signal<File | null>(null);
  readonly fileInfo = signal<AudioFileInfo | null>(null);
  readonly job = signal<ActaJob | null>(null);
  readonly acta = signal<Acta | null>(null);
  readonly isLoadingActa = signal(false);
  readonly isSavingActa = signal(false);
  readonly isSavingTranscription = signal(false);
  readonly isSavingSpeakers = signal(false);
  readonly isRegeneratingActa = signal(false);
  readonly isReadingAudioMetadata = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly validationFeedback = signal<AudioValidationFeedback | null>(null);
  readonly isActaPanelOpen = signal(false);
  readonly canCreateDocActa = computed(() => this.authService.canCreatePath('/doc-acta'));
  readonly canUpdateDocActa = computed(() => this.authService.canUpdatePath('/doc-acta'));

  readonly isProcessing = computed(() => {
    const status = this.job()?.status;
    return this.isSubmitting() || status === 'queued' || status === 'running';
  });

  readonly canStart = computed(() => Boolean(this.selectedFile()) && this.canCreateDocActa() && !this.isProcessing() && !this.isReadingAudioMetadata());

  ngOnInit(): void {
    const actaId = this.route.snapshot.queryParamMap.get('actaId');
    if (actaId) {
      this.loadActa(actaId);
    }
  }

  async onFileSelected(file: File): Promise<void> {
    this.selectedFile.set(null);
    this.fileInfo.set({
      name: file.name,
      sizeLabel: this.formatFileSize(file.size),
      extension: this.getExtension(file.name),
    });
    this.job.set(null);
    this.acta.set(null);
    this.errorMessage.set(null);
    this.validationFeedback.set(null);
    this.pollingSubscription?.unsubscribe();

    const fileFeedback = this.validateFile(file);
    if (fileFeedback?.level === 'error') {
      this.validationFeedback.set(fileFeedback);
      return;
    }

    this.isReadingAudioMetadata.set(true);

    try {
      const duration = await this.readAudioDuration(file);
      this.fileInfo.update((info) => info ? { ...info, durationLabel: this.formatTime(duration) } : info);
      const durationFeedback = this.validateDuration(duration);
      this.validationFeedback.set(this.mergeFeedback(fileFeedback, durationFeedback));

      if (durationFeedback?.level !== 'error') {
        this.selectedFile.set(file);
      }
    } catch {
      this.validationFeedback.set(this.mergeFeedback(fileFeedback, {
        level: 'warning',
        messages: ['No se pudo leer la duracion antes de subirlo. El backend intentara procesarlo de todos modos.'],
      }));
      this.selectedFile.set(file);
    } finally {
      this.isReadingAudioMetadata.set(false);
    }
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
    this.validationFeedback.set(null);
  }

  startJob(): void {
    const file = this.selectedFile();
    if (!file || !this.canCreateDocActa() || this.isReadingAudioMetadata()) {
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
    this.pollingSubscription = this.docActaService.streamJob(jobId).subscribe({
      next: (job) => this.handleJobUpdate(job),
      error: () => this.pollJobWithTimer(jobId),
    });
  }

  private pollJobWithTimer(jobId: string): void {
    this.pollingSubscription = timer(0, 2500)
      .pipe(
        switchMap(() => this.docActaService.getJob(jobId)),
        takeWhile((job) => job.status === 'queued' || job.status === 'running', true),
      )
      .subscribe({
        next: (job) => this.handleJobUpdate(job),
        error: (error) => {
          this.errorMessage.set(this.getErrorMessage(error, 'No se pudo consultar el progreso del procesamiento.'));
        },
      });
  }

  private handleJobUpdate(job: ActaJob): void {
    this.job.set(job);
    if (job.status === 'completed' && job.acta_id) {
      this.loadActa(job.acta_id);
    }
    if (job.status === 'failed') {
      this.errorMessage.set(job.error || 'No se pudo completar el procesamiento.');
    }
  }

  private loadActa(actaId: string): void {
    this.isLoadingActa.set(true);
    this.docActaService.getActa(actaId).subscribe({
      next: (acta) => {
        this.acta.set(acta);
        this.isActaPanelOpen.set(true);
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
    if (!acta || !this.canUpdateDocActa()) {
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
    if (!acta || !this.canUpdateDocActa()) {
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
    if (!acta || !this.canUpdateDocActa()) {
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

  async regenerateActa(): Promise<void> {
    const acta = this.acta();
    if (!acta || !this.canUpdateDocActa()) {
      return;
    }

    const confirmed = await this.confirmDialogService.confirm({
      title: 'Regenerar acta',
      message: 'Se generara una nueva acta usando la transcripcion actual. La version anterior sera reemplazada.',
      confirmLabel: 'Regenerar',
      tone: 'danger',
    });

    if (!confirmed) {
      return;
    }

    this.isRegeneratingActa.set(true);
    this.errorMessage.set(null);
    this.docActaService.regenerateActa(acta.id).subscribe({
      next: (updatedActa) => {
        this.acta.set(updatedActa);
        this.isActaPanelOpen.set(true);
        this.isRegeneratingActa.set(false);
      },
      error: (error) => {
        this.isRegeneratingActa.set(false);
        this.errorMessage.set(this.getErrorMessage(error, 'No se pudo regenerar el acta.'));
      },
    });
  }

  openActaPanel(): void {
    if (this.acta()) {
      this.isActaPanelOpen.set(true);
    }
  }

  closeActaPanel(): void {
    this.isActaPanelOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (this.isTypingTarget(event.target)) {
      return;
    }

    if (event.key === 'Escape' && this.isActaPanelOpen()) {
      event.preventDefault();
      this.closeActaPanel();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && this.canStart()) {
      event.preventDefault();
      this.startJob();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'a' && this.acta()) {
      event.preventDefault();
      this.isActaPanelOpen.update((value) => !value);
    }
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    if (!element) {
      return false;
    }

    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName) || element.isContentEditable;
  }

  private formatFileSize(size: number): string {
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  private formatTime(seconds: number): string {
    const totalSeconds = Math.max(0, Math.round(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private getExtension(filename: string): string {
    const extension = filename.split('.').pop();
    return extension ? extension.toUpperCase() : 'AUDIO';
  }

  private validateFile(file: File): AudioValidationFeedback | null {
    const extension = this.getExtension(file.name).toLowerCase();
    const messages: string[] = [];

    if (!ALLOWED_AUDIO_EXTENSIONS.has(extension)) {
      return {
        level: 'error',
        messages: [`Formato no permitido: .${extension || 'archivo'}. Usa MP3, WAV, M4A, MP4, WEBM, OGG o FLAC.`],
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        level: 'error',
        messages: [`El archivo pesa ${this.formatFileSize(file.size)}. El maximo permitido es ${this.formatFileSize(MAX_FILE_SIZE_BYTES)}.`],
      };
    }

    if (file.size > WARNING_FILE_SIZE_BYTES) {
      messages.push(`El archivo pesa ${this.formatFileSize(file.size)}. Puede tardar mas en transcribirse.`);
    }

    return messages.length ? { level: 'warning', messages } : null;
  }

  private validateDuration(duration: number): AudioValidationFeedback | null {
    if (duration > MAX_DURATION_SECONDS) {
      return {
        level: 'error',
        messages: [`El audio dura ${this.formatTime(duration)}. El maximo recomendado para esta etapa es ${this.formatTime(MAX_DURATION_SECONDS)}.`],
      };
    }

    if (duration > WARNING_DURATION_SECONDS) {
      return {
        level: 'warning',
        messages: [`El audio dura ${this.formatTime(duration)}. Puede tardar bastante en procesarse.`],
      };
    }

    return null;
  }

  private mergeFeedback(
    first: AudioValidationFeedback | null,
    second: AudioValidationFeedback | null,
  ): AudioValidationFeedback | null {
    if (!first) {
      return second;
    }

    if (!second) {
      return first;
    }

    return {
      level: first.level === 'error' || second.level === 'error' ? 'error' : 'warning',
      messages: [...first.messages, ...second.messages],
    };
  }

  private readAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      const url = URL.createObjectURL(file);

      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        Number.isFinite(audio.duration) ? resolve(audio.duration) : reject();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject();
      };
      audio.src = url;
    });
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
