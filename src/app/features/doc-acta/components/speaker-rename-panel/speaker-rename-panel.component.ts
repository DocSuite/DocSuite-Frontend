import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-speaker-rename-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './speaker-rename-panel.component.html',
  styleUrl: './speaker-rename-panel.component.scss',
})
export class SpeakerRenamePanelComponent {
  @Input() speakers: string[] = [];
  @Input() speakerDraft: Record<string, string> = {};
  @Input() isSavingSpeakers = false;
  @Output() speakerDraftChange = new EventEmitter<Record<string, string>>();
  @Output() closeEditor = new EventEmitter<void>();
  @Output() saveSpeakers = new EventEmitter<void>();

  onSpeakerNameChange(speaker: string, name: string): void {
    this.speakerDraftChange.emit({
      ...this.speakerDraft,
      [speaker]: name,
    });
  }
}
