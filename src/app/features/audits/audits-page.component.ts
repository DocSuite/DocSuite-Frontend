import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';

import { AlertMessageComponent } from '../../shared/components/alert-message/alert-message.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuditRecord } from './audit.models';
import { AuditService } from './audit.service';

@Component({
  selector: 'app-audits-page',
  standalone: true,
  imports: [CommonModule, AlertMessageComponent, LoadingStateComponent, PageHeaderComponent],
  templateUrl: './audits-page.component.html',
  styleUrl: './audits-page.component.scss',
})
export class AuditsPageComponent implements OnInit {
  private readonly auditService = inject(AuditService);

  readonly records = signal<AuditRecord[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAudits();
  }

  loadAudits(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auditService.listAudits().subscribe({
      next: (records) => {
        this.records.set(records);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar las auditorias.');
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

  statusLabel(status: string): string {
    return status === 'success' ? 'Normal' : status;
  }
}
