import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { DashboardActivityItem, DashboardMetric, DashboardSummary } from './dashboard.models';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  readonly auth = inject(AuthService);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly visibleMetrics = computed(() => this.summary()?.metrics ?? []);
  readonly maxTrendValue = computed(() => {
    const values = this.summary()?.trend.flatMap((point) => [point.analyses, point.actas]) ?? [0];
    return Math.max(1, ...values);
  });
  readonly distributionTotal = computed(() =>
    (this.summary()?.distribution ?? []).reduce((total, item) => total + item.value, 0),
  );
  readonly taskTotal = computed(() => {
    const tasks = this.summary()?.tasks;
    return (tasks?.pending ?? 0) + (tasks?.completed ?? 0);
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.dashboardService.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el resumen del dashboard.');
        this.isLoading.set(false);
      },
    });
  }

  canRead(path: string): boolean {
    return this.auth.canReadPath(path);
  }

  canCreate(path: string): boolean {
    return this.auth.canCreatePath(path);
  }

  metricIcon(metric: DashboardMetric): string {
    return {
      analyses: 'pi-file',
      actas: 'pi-microphone',
      tasks: 'pi-check-square',
    }[metric.key] ?? 'pi-chart-bar';
  }

  activityIcon(item: DashboardActivityItem): string {
    return item.type === 'Acta' ? 'pi-microphone' : 'pi-file';
  }

  trendBarWidth(value: number): number {
    return Math.round((value / this.maxTrendValue()) * 100);
  }

  distributionWidth(value: number): number {
    const total = this.distributionTotal();
    return total ? Math.round((value / total) * 100) : 0;
  }

  taskWidth(value: number): number {
    const total = this.taskTotal();
    return total ? Math.round((value / total) * 100) : 0;
  }

  formatRelativeDate(value: string): string {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.max(0, Math.floor(diffMs / 60000));
    if (minutes < 1) {
      return 'Ahora';
    }
    if (minutes < 60) {
      return `Hace ${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `Hace ${hours} h`;
    }

    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(date);
  }
}
