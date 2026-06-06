import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AlertMessageComponent } from '../../../shared/components/alert-message/alert-message.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { Acta } from '../../doc-acta/models/doc-acta.models';
import { DocActaService } from '../../doc-acta/services/doc-acta.service';

@Component({
  selector: 'app-historial-page',
  standalone: true,
  imports: [CommonModule, RouterLink, AlertMessageComponent, LoadingStateComponent, PageHeaderComponent],
  templateUrl: './historial-page.component.html',
  styleUrl: './historial-page.component.scss',
})
export class HistorialPageComponent implements OnInit {
  private readonly docActaService = inject(DocActaService);

  readonly actas = signal<Acta[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.docActaService.listMeetingMinutes().subscribe({
      next: (actas) => {
        this.actas.set(actas);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el historial de actas.');
        this.isLoading.set(false);
      },
    });
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  formatDuration(seconds: number | null): string {
    if (!seconds) {
      return '--';
    }

    const totalSeconds = Math.round(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
