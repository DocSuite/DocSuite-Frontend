import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-transcription-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transcription-editor.component.html',
  styleUrl: './transcription-editor.component.scss',
})
export class TranscriptionEditorComponent {
  @Input() draftTranscription = '';
  @Input() draftStatus: string | null = null;
  @Input() isSaving = false;
  @Output() draftTranscriptionChange = new EventEmitter<string>();
  @Output() draftChange = new EventEmitter<void>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() saveEdit = new EventEmitter<void>();

  onDraftInput(value: string): void {
    this.draftTranscriptionChange.emit(value);
    this.draftChange.emit();
  }
}
