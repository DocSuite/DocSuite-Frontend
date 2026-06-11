import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AlertMessageComponent } from '../../../shared/components/alert-message/alert-message.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { Acta } from '../../doc-acta/models/doc-acta.models';
import { DocActaService } from '../../doc-acta/services/doc-acta.service';
import { DocumentAnalysis } from '../../doc-analyzer/doc-analyzer.models';
import { DocAnalyzerService } from '../../doc-analyzer/doc-analyzer.service';

type HistoryView = 'actas' | 'documents';

@Component({
  selector: 'app-historial-page',
  standalone: true,
  imports: [CommonModule, RouterLink, AlertMessageComponent, LoadingStateComponent, PageHeaderComponent],
  templateUrl: './historial-page.component.html',
  styleUrl: './historial-page.component.scss',
})
export class HistorialPageComponent implements OnInit {
  private readonly docActaService = inject(DocActaService);
  private readonly docAnalyzerService = inject(DocAnalyzerService);

  readonly actas = signal<Acta[]>([]);
  readonly analyses = signal<DocumentAnalysis[]>([]);
  readonly activeView = signal<HistoryView>('actas');
  readonly searchTerm = signal('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly filteredActas = computed(() => {
    const term = this.normalizedSearch();
    if (!term) {
      return this.actas();
    }
    return this.actas().filter((acta) => this.matchesText(term, [acta.filename, acta.id]));
  });

  readonly filteredAnalyses = computed(() => {
    const term = this.normalizedSearch();
    if (!term) {
      return this.analyses();
    }
    return this.analyses().filter((analysis) =>
      this.matchesText(term, [analysis.filename, analysis.id, this.formatMode(analysis.mode)]),
    );
  });

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      actas: this.docActaService.listMeetingMinutes(),
      analyses: this.docAnalyzerService.listAnalyses(),
    }).subscribe({
      next: ({ actas, analyses }) => {
        this.actas.set(actas);
        this.analyses.set(analyses);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el historial.');
        this.isLoading.set(false);
      },
    });
  }

  setView(view: HistoryView): void {
    this.activeView.set(view);
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
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

  formatMode(mode: string): string {
    return mode === 'academic' ? 'Academico' : 'General';
  }

  downloadAnalysisJson(analysis: DocumentAnalysis): void {
    const blob = new Blob([JSON.stringify(this.parseResult(analysis.result), null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    this.downloadBlob(`${this.baseFilename(analysis.filename)}_analisis.json`, blob);
  }

  downloadAnalysisDocx(analysis: DocumentAnalysis): void {
    this.docAnalyzerService.downloadAnalysisDocx(analysis.id).subscribe({
      next: (blob) => this.downloadBlob(`${this.baseFilename(analysis.filename)}_analisis.docx`, blob),
      error: () => this.errorMessage.set('No se pudo descargar el DOCX.'),
    });
  }

  private parseResult(result: string): unknown {
    try {
      return JSON.parse(result);
    } catch {
      return { result };
    }
  }

  private downloadBlob(filename: string, blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private baseFilename(filename: string): string {
    return filename.replace(/\.[^/.]+$/, '').replace(/[^A-Za-z0-9._-]/g, '_');
  }

  private normalizedSearch(): string {
    return this.searchTerm().trim().toLowerCase();
  }

  private matchesText(term: string, values: Array<string | null | undefined>): boolean {
    return values.some((value) => (value ?? '').toLowerCase().includes(term));
  }
}
