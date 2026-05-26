import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { Acta, ActaJob, DiarizationSegment } from '../../models/doc-acta.models';

@Component({
  selector: 'app-transcription-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transcription-view.component.html',
  styleUrl: './transcription-view.component.scss',
})
export class TranscriptionViewComponent implements OnChanges, OnDestroy {
  @ViewChild('audioPlayer') audioPlayer?: ElementRef<HTMLAudioElement>;
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private draftSaveTimeout: ReturnType<typeof setTimeout> | null = null;

  @Input() job: ActaJob | null = null;
  @Input() acta: Acta | null = null;
  @Input() audioFile: File | null = null;
  @Input() isLoading = false;
  @Input() isSaving = false;
  @Input() isSavingSpeakers = false;
  @Output() saveTranscription = new EventEmitter<string>();
  @Output() saveSpeakers = new EventEmitter<Record<string, string>>();

  audioUrl: string | null = null;
  isEditing = false;
  isRenamingSpeakers = false;
  draftTranscription = '';
  draftStatus: string | null = null;
  hasLocalDraft = false;
  speakerDraft: Record<string, string> = {};
  activeSegmentIndex: number | null = null;
  activeSegmentEnd: number | null = null;
  playbackMessage: string | null = null;

  get paragraphs(): string[] {
    const text = this.acta?.transcription?.trim();
    if (!text) {
      return [];
    }

    return text
      .split(/\r?\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  get segments(): DiarizationSegment[] {
    return this.acta?.diarization?.segments ?? [];
  }

  get speakerCount(): number {
    return new Set(this.segments.map((segment) => segment.speaker)).size;
  }

  get speakers(): string[] {
    return Array.from(new Set(this.segments.map((segment) => segment.speaker))).sort();
  }

  get durationLabel(): string {
    const duration = this.acta?.duration_seconds;
    if (!duration) {
      return '--';
    }

    return this.formatTime(duration);
  }

  formatTime(seconds: number): string {
    const totalSeconds = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
        if (previousActa?.id && previousActa.id === currentActa?.id && previousActa.transcription !== currentActa?.transcription) {
          this.clearLocalDraft();
          this.draftStatus = null;
        }
        this.draftTranscription = this.acta?.transcription ?? '';
        this.loadLocalDraft();
      }
    }

    if (changes['audioFile']) {
      this.setAudioUrl();
    }
  }

  startEditing(): void {
    this.draftTranscription = this.acta?.transcription ?? '';
    this.loadLocalDraft();
    this.isEditing = true;
  }

  async cancelEditing(): Promise<void> {
    if (this.draftTranscription.trim() !== (this.acta?.transcription ?? '').trim()) {
      const confirmed = await this.confirmDialogService.confirm({
        title: 'Descartar cambios',
        message: 'Se perderán los ajustes que hiciste en la transcripción.',
        confirmLabel: 'Descartar',
        tone: 'danger',
      });

      if (!confirmed) {
        return;
      }
    }

    this.draftTranscription = this.acta?.transcription ?? '';
    this.clearLocalDraft();
    this.draftStatus = null;
    this.isEditing = false;
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
    this.saveTranscription.emit(this.draftTranscription.trim());
  }

  finishSaving(): void {
    this.isEditing = false;
    this.clearLocalDraft();
    this.draftStatus = null;
    this.draftTranscription = this.acta?.transcription ?? '';
  }

  openSpeakerEditor(): void {
    this.speakerDraft = this.speakers.reduce<Record<string, string>>((draft, speaker) => {
      draft[speaker] = speaker;
      return draft;
    }, {});
    this.isRenamingSpeakers = true;
  }

  async closeSpeakerEditor(): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({
      title: 'Cerrar edición',
      message: 'Se descartarán los nombres de participantes que todavía no guardaste.',
      confirmLabel: 'Cerrar',
      tone: 'danger',
    });

    if (confirmed) {
      this.isRenamingSpeakers = false;
    }
  }

  saveSpeakerNames(): void {
    const names = Object.entries(this.speakerDraft).reduce<Record<string, string>>((payload, [speaker, name]) => {
      const cleanName = name.trim();
      if (cleanName) {
        payload[speaker] = cleanName;
      }
      return payload;
    }, {});

    this.saveSpeakers.emit(names);
    this.isRenamingSpeakers = false;
  }

  playSegment(segment: DiarizationSegment, index: number): void {
    const player = this.audioPlayer?.nativeElement;
    if (!player || !this.audioUrl) {
      this.playbackMessage = 'Para escuchar segmentos, conserva el audio seleccionado en esta pantalla.';
      return;
    }

    this.activeSegmentIndex = index;
    this.activeSegmentEnd = Math.max(segment.end, segment.start + 1.5);
    this.playbackMessage = null;

    try {
      player.pause();
      player.volume = 1;
      player.currentTime = Math.max(0, segment.start);
      const playback = player.play();
      if (playback) {
        playback.catch(() => {
          this.playbackMessage = 'No se pudo reproducir este segmento. Usa el reproductor del audio para verificar el archivo.';
        });
      }
    } catch {
      this.playbackMessage = 'No se pudo ubicar este segmento dentro del audio.';
    }
  }

  onAudioTimeUpdate(): void {
    const player = this.audioPlayer?.nativeElement;
    if (!player || this.activeSegmentEnd === null) {
      return;
    }

    if (player.currentTime >= this.activeSegmentEnd) {
      player.pause();
      this.activeSegmentEnd = null;
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  private setAudioUrl(): void {
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }

    this.audioUrl = this.audioFile ? URL.createObjectURL(this.audioFile) : null;
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
      const parsedDraft = JSON.parse(rawDraft) as { transcription?: string };
      if (typeof parsedDraft.transcription === 'string' && parsedDraft.transcription !== (this.acta?.transcription ?? '')) {
        this.draftTranscription = parsedDraft.transcription;
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

    if (this.draftTranscription.trim() === (this.acta?.transcription ?? '').trim()) {
      this.clearLocalDraft();
      this.draftStatus = null;
      return;
    }

    localStorage.setItem(key, JSON.stringify({
      transcription: this.draftTranscription,
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
    return this.acta?.id ? `docsuite.docacta.transcriptionDraft.${this.acta.id}` : null;
  }

  ngOnDestroy(): void {
    if (this.draftSaveTimeout) {
      clearTimeout(this.draftSaveTimeout);
    }
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
  }
}
