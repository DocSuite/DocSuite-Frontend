import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { ActaJob } from '../../models/doc-acta.models';

@Component({
  selector: 'app-progress-steps',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-steps.component.html',
  styleUrl: './progress-steps.component.scss',
})
export class ProgressStepsComponent {
  @Input() job: ActaJob | null = null;

  readonly steps = [
    { progress: 10, label: 'Audio recibido', icon: 'pi-cloud-upload' },
    { progress: 25, label: 'Transcribiendo audio', icon: 'pi-align-left' },
    { progress: 55, label: 'Identificando participantes', icon: 'pi-users' },
    { progress: 80, label: 'Generando acta', icon: 'pi-file-edit' },
    { progress: 100, label: 'Finalizado', icon: 'pi-check-circle' },
  ];

  isDone(stepProgress: number): boolean {
    return (this.job?.progress ?? 0) >= stepProgress;
  }
}
