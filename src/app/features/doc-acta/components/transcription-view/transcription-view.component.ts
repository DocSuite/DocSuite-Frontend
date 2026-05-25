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
} from '@angular/core';
import { FormsModule } from '@angular/forms';

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

  @Input() job: ActaJob | null = null;
  @Input() acta: Acta | null = null;
  @Input() audioFile: File | null = null;
  @Input() isLoading = false;
  @Input() isSaving = false;
  @Output() saveTranscription = new EventEmitter<string>();

  audioUrl: string | null = null;
  isEditing = false;
  draftTranscription = '';
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

  cancelEditing(): void {
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
