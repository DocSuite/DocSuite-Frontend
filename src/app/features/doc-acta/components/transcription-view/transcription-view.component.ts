import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { Acta, ActaJob, DiarizationSegment } from '../../models/doc-acta.models';

@Component({
  selector: 'app-transcription-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transcription-view.component.html',
  styleUrl: './transcription-view.component.scss',
})
export class TranscriptionViewComponent {
  @Input() job: ActaJob | null = null;
  @Input() acta: Acta | null = null;
  @Input() isLoading = false;

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
}
