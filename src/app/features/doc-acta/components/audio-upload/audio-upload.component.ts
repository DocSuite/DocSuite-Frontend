import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AudioFileInfo, AudioValidationFeedback } from '../../models/doc-acta.models';

const ALLOWED_EXTENSIONS = [
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
];

@Component({
  selector: 'app-audio-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-upload.component.html',
  styleUrl: './audio-upload.component.scss',
})
export class AudioUploadComponent {
  @Input() fileInfo: AudioFileInfo | null = null;
  @Input() validationFeedback: AudioValidationFeedback | null = null;
  @Input() isReadingMetadata = false;
  @Input() disabled = false;
  @Output() fileSelected = new EventEmitter<File>();
  @Output() fileRemoved = new EventEmitter<void>();

  readonly accept = ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(',');
  readonly allowedText = 'MP3, WAV, M4A, MP4, WEBM, OGG, FLAC';

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileSelected.emit(file);
    }
    input.value = '';
  }
}
