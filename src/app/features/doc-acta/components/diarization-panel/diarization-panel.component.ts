import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { DiarizationSegment } from '../../models/doc-acta.models';

@Component({
  selector: 'app-diarization-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diarization-panel.component.html',
  styleUrl: './diarization-panel.component.scss',
})
export class DiarizationPanelComponent {
  @Input() segments: DiarizationSegment[] = [];
  @Input() activeSegmentIndex: number | null = null;
  @Output() playSegmentRequest = new EventEmitter<{ segment: DiarizationSegment; index: number }>();

  formatTime(seconds: number): string {
    const totalSeconds = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
