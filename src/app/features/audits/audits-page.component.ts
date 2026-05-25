import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface AuditRecord {
  event: string;
  user: string;
  module: string;
  date: string;
  status: string;
}

@Component({
  selector: 'app-audits-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audits-page.component.html',
  styleUrl: './audits-page.component.scss',
})
export class AuditsPageComponent {
  readonly records: AuditRecord[] = [
    {
      event: 'Inicio de sesion',
      user: 'admin@docsuite.edu.pe',
      module: 'Auth',
      date: 'Hace 8 min',
      status: 'Normal',
    },
    {
      event: 'Acta editada',
      user: 'admin@docsuite.edu.pe',
      module: 'DocActa',
      date: 'Hace 22 min',
      status: 'Revision',
    },
    {
      event: 'Documento analizado',
      user: 'docente@docsuite.edu.pe',
      module: 'DocAnalyzer',
      date: 'Hoy 09:15',
      status: 'Normal',
    },
    {
      event: 'Exportacion DOCX',
      user: 'admin@docsuite.edu.pe',
      module: 'DocActa',
      date: 'Ayer 16:42',
      status: 'Normal',
    },
  ];
}
