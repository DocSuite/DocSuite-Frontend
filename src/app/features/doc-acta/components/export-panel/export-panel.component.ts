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

    this.downloadPdf('Acta de Reunion', this.acta.result, `${this.baseName()}_acta.pdf`);
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

  private createPdf(title: string, text: string): Uint8Array {
    const pageWidth = 595;
    const pageHeight = 842;
    const marginX = 56;
    const maxWidth = pageWidth - marginX * 2;
    const bottomMargin = 64;
    const pages: string[][] = [];
    let currentPage: string[] = [];
    let y = 782;

    const addPage = (): void => {
      pages.push(currentPage);
      currentPage = [];
      y = 782;
    };

    const addLine = (line: string, size = 11, bold = false): void => {
      if (y < bottomMargin) {
        addPage();
      }

      currentPage.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${marginX} ${y} Td (${this.toPdfString(line)}) Tj ET`);
      y -= Math.round(size * 1.55);
    };

    addLine(title.toUpperCase(), 16, true);
    y -= 12;

    for (const block of this.toPdfBlocks(text, maxWidth)) {
      if (block.type === 'space') {
        y -= 8;
        continue;
      }

      const size = block.type === 'heading' ? 14 : 10;
      const bold = block.type === 'heading' || block.type === 'label';
      for (const line of block.lines) {
        addLine(line, size, bold);
      }
      y -= block.type === 'heading' ? 10 : 4;
    }

    pages.push(currentPage);

    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      `2 0 obj << /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >> endobj`,
      ...pages.flatMap((pageLines, index) => {
        const pageObject = 3 + index * 2;
        const contentObject = pageObject + 1;
        const content = pageLines.join('\n');
        return [
          `${pageObject} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R /F2 ${4 + pages.length * 2} 0 R >> >> /Contents ${contentObject} 0 R >> endobj`,
          `${contentObject} 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
        ];
      }),
      `${3 + pages.length * 2} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj`,
      `${4 + pages.length * 2} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >> endobj`,
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
    return this.toPdfBytes(pdf);
  }

  private toPdfBlocks(text: string, maxWidth: number): Array<{ type: 'heading' | 'label' | 'text' | 'space'; lines: string[] }> {
    return text.split(/\r?\n/).map((rawLine) => {
      const line = rawLine.trim();
      if (!line) {
        return { type: 'space', lines: [] };
      }

      if (line.startsWith('#')) {
        return {
          type: 'heading',
          lines: this.wrapText(line.replace(/^#+\s*/, '').toUpperCase(), maxWidth, 14),
        };
      }

      if (/^\*\*.+\*\*:/.test(line) || /^[A-Z\u00C1\u00C9\u00CD\u00D3\u00DA\u00D1][^:]{2,40}:/.test(line)) {
        return {
          type: 'label',
          lines: this.wrapText(this.cleanMarkdown(line), maxWidth, 10),
        };
      }

      return {
        type: 'text',
        lines: this.wrapText(this.cleanMarkdown(line), maxWidth, 10),
      };
    });
  }

  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const maxLength = Math.max(28, Math.floor(maxWidth / (fontSize * 0.55)));
    const lines: string[] = [];
    const words = text.split(/\s+/).filter(Boolean);
    let line = '';

    for (const word of words) {
      const nextLine = line ? `${line} ${word}` : word;
      if (nextLine.length > maxLength && line) {
        lines.push(line);
        line = word;
      } else {
        line = nextLine;
      }
    }

    if (line) {
      lines.push(line);
    }

    return lines;
  }

  private cleanMarkdown(text: string): string {
    return text
      .replace(/^[-*]\s+/, '- ')
      .replace(/^\d+\.\s+/, (match) => match)
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^---+$/, '');
  }

  private toPdfString(text: string): string {
    return this.normalizePdfText(text)
      .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  private normalizePdfText(text: string): string {
    return text
      .replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"')
      .replace(/[\u2018\u2019\u201A]/g, "'")
      .replace(/[\u2013\u2014\u2212]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\u2022/g, '-')
      .replace(/\u00B7/g, '-')
      .replace(/\u2610/g, '[ ]')
      .replace(/\u2611/g, '[x]')
      .replace(/\u2713/g, 'x')
      .replace(/\u2714/g, 'x')
      .replace(/\u20AC/g, 'EUR')
      .replace(/\u2122/g, '(TM)')
      .replace(/\u00A0/g, ' ');
  }

  private toPdfBytes(pdf: string): Uint8Array {
    const bytes = new Uint8Array(pdf.length);
    for (let index = 0; index < pdf.length; index += 1) {
      bytes[index] = pdf.charCodeAt(index) & 0xff;
    }
    return bytes;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private baseName(): string {
    return (this.acta?.filename || 'docsuite')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_');
  }
}
