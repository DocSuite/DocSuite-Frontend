import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-transcription-reader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transcription-reader.component.html',
  styleUrl: './transcription-reader.component.scss',
})
export class TranscriptionReaderComponent {
  @Input() transcription = '';

  get paragraphs(): string[] {
    const text = this.transcription.trim();
    if (!text) {
      return [];
    }

    return text
      .split(/\r?\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }
}
