import { CommonModule } from '@angular/common';
import { Component, inject, Input, signal } from '@angular/core';

import { Acta } from '../../models/doc-acta.models';
import { DocActaService } from '../../services/doc-acta.service';

@Component({
  selector: 'app-export-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-panel.component.html',
  styleUrl: './export-panel.component.scss',
})
export class ExportPanelComponent {
  private readonly docActaService = inject(DocActaService);

  @Input() acta: Acta | null = null;

  readonly feedback = signal<string | null>(null);
  readonly isDownloadingDocx = signal(false);

  copyTranscription(): void {
    this.copyText(this.acta?.transcription ?? '', 'Transcripcion copiada');
  }

  copyActa(): void {
    this.copyText(this.acta?.result ?? '', 'Acta copiada');
  }

  downloadTranscriptionPdf(): void {
    if (!this.acta?.transcription) {
      return;
    }

    this.downloadPdf('Transcripcion', this.acta.transcription, `${this.baseName()}_transcripcion.pdf`);
  }

  downloadActaPdf(): void {
    if (!this.acta?.result) {
      return;
    }

    this.downloadPdf('Acta', this.acta.result, `${this.baseName()}_acta.pdf`);
  }

  downloadActaDocx(): void {
    if (!this.acta) {
      return;
    }

    this.isDownloadingDocx.set(true);
    this.docActaService.downloadActaDocx(this.acta.id).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `${this.baseName()}_acta.docx`);
        this.isDownloadingDocx.set(false);
      },
      error: () => {
        this.feedback.set('No se pudo descargar el DOCX');
        this.isDownloadingDocx.set(false);
      },
    });
  }

  private async copyText(text: string, message: string): Promise<void> {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      this.feedback.set(message);
    } catch {
      this.copyWithTextarea(text);
      this.feedback.set(message);
    }

    window.setTimeout(() => this.feedback.set(null), 2200);
  }

  private copyWithTextarea(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  private downloadPdf(title: string, text: string, filename: string): void {
    const blob = new Blob([this.createPdf(title, text)], { type: 'application/pdf' });
    this.downloadBlob(blob, filename);
  }

  private createPdf(title: string, text: string): string {
    const lines = this.wrapText([title, '', ...text.split(/\r?\n/)].join('\n'), 92);
    const content = [
      'BT',
      '/F1 11 Tf',
      '50 790 Td',
      '14 TL',
      ...lines.slice(0, 52).map((line) => `<${this.toUtf16Hex(line)}> Tj T*`),
      'ET',
    ].join('\n');

    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
      '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
      `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
    ];

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const object of objects) {
      offsets.push(pdf.length);
      pdf += `${object}\n`;
    }

    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    offsets.slice(1).forEach((offset) => {
      pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return pdf;
  }

  private wrapText(text: string, maxLength: number): string[] {
    const lines: string[] = [];
    for (const rawLine of text.split(/\r?\n/)) {
      const words = rawLine.split(/\s+/).filter(Boolean);
      let line = '';
      for (const word of words) {
        const nextLine = line ? `${line} ${word}` : word;
        if (nextLine.length > maxLength) {
          lines.push(line);
          line = word;
        } else {
          line = nextLine;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  private toUtf16Hex(text: string): string {
    const codes = [0xfeff, ...Array.from(text).map((char) => char.charCodeAt(0))];
    return codes.map((code) => code.toString(16).padStart(4, '0')).join('').toUpperCase();
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private baseName(): string {
    return (this.acta?.filename || 'docsuite')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_');
  }
}
