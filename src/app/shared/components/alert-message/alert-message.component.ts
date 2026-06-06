import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-alert-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-message.component.html',
  styleUrl: './alert-message.component.scss',
})
export class AlertMessageComponent {
  @Input() message: string | null = null;
}
