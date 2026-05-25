import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { Acta, ActaJob } from '../../models/doc-acta.models';

@Component({
  selector: 'app-acta-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './acta-view.component.html',
  styleUrl: './acta-view.component.scss',
})
export class ActaViewComponent {
  @Input() job: ActaJob | null = null;
  @Input() acta: Acta | null = null;

  get isCompleted(): boolean {
    return this.job?.status === 'completed';
  }

  get resultParagraphs(): string[] {
    const result = this.acta?.result?.trim();
    if (!result) {
      return [];
    }

    return result
      .split(/\r?\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }
}
