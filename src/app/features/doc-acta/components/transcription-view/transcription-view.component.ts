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
  speakerDraft: Record<string, string> = {};
  activeSegmentIndex: number | null = null;

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
      this.draftTranscription = this.acta?.transcription ?? '';
      if (this.isEditing && changes['acta'].previousValue && changes['acta'].currentValue) {
        this.isEditing = false;
      }
    }

    if (changes['audioFile']) {
      this.setAudioUrl();
    }
  }

  startEditing(): void {
    this.draftTranscription = this.acta?.transcription ?? '';
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
    this.isEditing = false;
  }

  saveChanges(): void {
    this.saveTranscription.emit(this.draftTranscription.trim());
  }

  finishSaving(): void {
    this.isEditing = false;
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
      return;
    }

    this.activeSegmentIndex = index;
    player.currentTime = Math.max(0, segment.start);
    player.play();
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

  ngOnDestroy(): void {
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
  }
}
