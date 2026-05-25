import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-acta-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './acta-form.component.html',
  styleUrl: './acta-form.component.scss',
})
export class ActaFormComponent {
  @Input() disabled = false;
  @Input() isReady = false;
  @Output() startProcessing = new EventEmitter<void>();
}
