import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

interface ActaBlock {
  type: 'title' | 'heading' | 'subheading' | 'property' | 'paragraph' | 'bullet' | 'number' | 'task' | 'divider';
  text: string;
  label?: string;
  value?: string;
  checked?: boolean;
}

@Component({
  selector: 'app-acta-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './acta-renderer.component.html',
  styleUrl: './acta-renderer.component.scss',
})
export class ActaRendererComponent {
  @Input() content = '';

  get renderedBlocks(): ActaBlock[] {
    const result = this.content.trim();
    if (!result) {
      return [];
    }

    return result
      .split(/\r?\n/)
      .map((line) => this.parseBlock(line))
      .filter((block): block is ActaBlock => block !== null);
  }

  trackByIndex(index: number): number {
    return index;
  }

  private parseBlock(rawLine: string): ActaBlock | null {
    const line = rawLine.trim();
    if (!line) {
      return null;
    }

    if (line === '---') {
      return { type: 'divider', text: '' };
    }

    if (line.startsWith('# ')) {
      return { type: 'title', text: this.cleanInline(line.slice(2)) };
    }

    if (line.startsWith('## ')) {
      return { type: 'heading', text: this.cleanInline(line.slice(3)) };
    }

    if (line.startsWith('### ')) {
      return { type: 'subheading', text: this.cleanInline(line.slice(4)) };
    }

    const propertyMatch = line.match(/^\*\*(.+?)\*\*:\s*(.*)$/);
    if (propertyMatch) {
      return {
        type: 'property',
        text: '',
        label: this.cleanInline(propertyMatch[1]),
        value: this.cleanInline(propertyMatch[2] || 'No especificado'),
      };
    }

    const taskMatch = line.match(/^-\s+\[( |x|X)\]\s+(.*)$/);
    if (taskMatch) {
      return {
        type: 'task',
        text: this.cleanInline(taskMatch[2]),
        checked: taskMatch[1].toLowerCase() === 'x',
      };
    }

    if (line.startsWith('- ')) {
      return { type: 'bullet', text: this.cleanInline(line.slice(2)) };
    }

    const numberMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberMatch) {
      return { type: 'number', text: `${numberMatch[1]}. ${this.cleanInline(numberMatch[2])}` };
    }

    return { type: 'paragraph', text: this.cleanInline(line) };
  }

  private cleanInline(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .trim();
  }
}
