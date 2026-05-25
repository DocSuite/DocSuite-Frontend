import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { ActaJob } from '../../models/doc-acta.models';

@Component({
  selector: 'app-transcription-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transcription-view.component.html',
  styleUrl: './transcription-view.component.scss',
})
export class TranscriptionViewComponent {
  @Input() job: ActaJob | null = null;
}
