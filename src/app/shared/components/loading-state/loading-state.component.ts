import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-state.component.html',
  styleUrl: './loading-state.component.scss',
})
export class LoadingStateComponent {
  @Input() visible = false;
  @Input() message = 'Cargando.';
  @Input() containerClass = 'mb-5';
}
