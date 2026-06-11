import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AlertMessageComponent } from '../../shared/components/alert-message/alert-message.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import {
  AcademicConclusions,
  AnalysisMode,
  AnalysisResult,
  DocumentElementSummary,
  DocumentAnalysisJob,
  DocumentAnalysis,
  GeneralSection,
  ImportantData,
  MethodologyEvidence,
  UsefulQuote,
} from './doc-analyzer.models';
import { DocAnalyzerService } from './doc-analyzer.service';

const MAX_FILE_SIZE_MB = 200;
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'];

@Component({
  selector: 'app-doc-analyzer-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertMessageComponent, LoadingStateComponent, PageHeaderComponent],
  templateUrl: './doc-analyzer-page.component.html',
  styleUrl: './doc-analyzer-page.component.scss',
})
export class DocAnalyzerPageComponent implements OnInit {
  private readonly docAnalyzerService = inject(DocAnalyzerService);
  private readonly route = inject(ActivatedRoute);

  readonly mode = signal<AnalysisMode>('general');
  readonly selectedFile = signal<File | null>(null);
  readonly analysis = signal<DocumentAnalysis | null>(null);
  readonly currentJob = signal<DocumentAnalysisJob | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly analysisResult = computed<AnalysisResult | null>(() => {
    const currentAnalysis = this.analysis();
    if (!currentAnalysis) {
      return null;
    }

    try {
      return JSON.parse(currentAnalysis.result) as AnalysisResult;
    } catch {
      return {
        language: null,
        source_filename: currentAnalysis.filename,
        executive_summary: currentAnalysis.result,
      };
    }
  });

  ngOnInit(): void {
    const analysisId = this.route.snapshot.queryParamMap.get('analysisId');
    if (analysisId) {
      this.isLoading.set(true);
      this.loadAnalysis(analysisId);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.analysis.set(null);
    this.currentJob.set(null);

    if (!file) {
      this.selectedFile.set(null);
      return;
    }

    const extension = this.fileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      this.selectedFile.set(null);
      input.value = '';
      this.errorMessage.set('Formato no soportado. Selecciona un archivo PDF, DOCX, TXT o MD.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      this.selectedFile.set(null);
      input.value = '';
      this.errorMessage.set(`El archivo supera el maximo permitido de ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    this.selectedFile.set(file);
    this.successMessage.set('Archivo listo para analizar. Los documentos largos pueden tardar varios minutos.');
  }

  analyze(): void {
    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Selecciona un documento para analizar.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.analysis.set(null);
    this.currentJob.set(null);

    this.docAnalyzerService.createJob(file, this.mode()).subscribe({
      next: (job) => {
        this.currentJob.set(job);
        this.listenJob(job.job_id);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.errorDetail(error, 'No se pudo iniciar el analisis.'));
        this.isLoading.set(false);
      },
    });
  }

  private listenJob(jobId: string): void {
    this.docAnalyzerService.streamJob(jobId).subscribe({
      next: (job) => {
        this.currentJob.set(job);
        if (job.status === 'completed' && job.analysis_id) {
          this.loadAnalysis(job.analysis_id);
        }
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message || 'No se pudo procesar el documento.');
        this.isLoading.set(false);
      },
    });
  }

  private loadAnalysis(analysisId: string): void {
    this.docAnalyzerService.getAnalysis(analysisId).subscribe({
      next: (analysis) => {
        this.analysis.set(analysis);
        this.mode.set(analysis.mode);
        this.successMessage.set('Analisis generado correctamente.');
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('El analisis termino, pero no se pudo cargar el resultado guardado.');
        this.isLoading.set(false);
      },
    });
  }

  copyResult(): void {
    const result = this.analysisResult();
    if (!result) {
      return;
    }

    navigator.clipboard.writeText(this.analysisJson()).then(() => {
      this.successMessage.set('Analisis copiado al portapapeles.');
    });
  }

  copyExtractedText(): void {
    const text = this.analysis()?.extracted_text;
    if (!text) {
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      this.successMessage.set('Texto extraido copiado al portapapeles.');
    });
  }

  downloadResult(): void {
    const analysis = this.analysis();
    if (!analysis) {
      return;
    }
    this.downloadText(`${this.baseFilename(analysis.filename)}_analisis.json`, this.analysisJson(), 'application/json');
  }

  downloadExtractedText(): void {
    const analysis = this.analysis();
    if (!analysis) {
      return;
    }
    this.downloadText(`${this.baseFilename(analysis.filename)}_extraccion.txt`, analysis.extracted_text, 'text/plain');
  }

  downloadDocx(): void {
    const analysis = this.analysis();
    if (!analysis) {
      return;
    }

    this.docAnalyzerService.downloadAnalysisDocx(analysis.id).subscribe({
      next: (blob) => {
        this.downloadBlob(`${this.baseFilename(analysis.filename)}_analisis.docx`, blob);
      },
      error: () => {
        this.errorMessage.set('No se pudo descargar el DOCX.');
      },
    });
  }

  private analysisJson(): string {
    return JSON.stringify(this.analysisResult(), null, 2);
  }

  private downloadText(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    this.downloadBlob(filename, blob);
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

  private errorDetail(error: HttpErrorResponse, fallback: string): string {
    const detail = error.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    return fallback;
  }

  fileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() ?? '';
  }

  formatFileSize(file: File | null): string {
    if (!file) {
      return '';
    }

    const sizeMb = file.size / 1024 / 1024;
    return `${sizeMb.toFixed(2)} MB`;
  }

  asTextList(value: string[] | undefined | null): string[] {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  asSections(value: GeneralSection[] | undefined | null): GeneralSection[] {
    return Array.isArray(value) ? value : [];
  }

  asImportantData(value: ImportantData[] | undefined | null): ImportantData[] {
    return Array.isArray(value) ? value : [];
  }

  asDocumentElements(value: DocumentElementSummary[] | undefined | null): DocumentElementSummary[] {
    return Array.isArray(value) ? value : [];
  }

  asMethodologyEvidence(value: MethodologyEvidence[] | undefined | null): MethodologyEvidence[] {
    return Array.isArray(value) ? value : [];
  }

  asQuotes(value: UsefulQuote[] | undefined | null): UsefulQuote[] {
    return Array.isArray(value) ? value : [];
  }

  academicConclusions(value: string[] | AcademicConclusions | undefined | null): AcademicConclusions | null {
    if (!value || Array.isArray(value)) {
      return null;
    }
    return value;
  }

  generalConclusions(value: string[] | AcademicConclusions | undefined | null): string[] {
    return Array.isArray(value) ? value : [];
  }
}
