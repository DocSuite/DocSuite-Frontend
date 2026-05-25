import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface MetricCard {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone: string;
}

interface ActivityItem {
  title: string;
  type: string;
  reference: string;
  icon: string;
  status: string;
}

interface AuditItem {
  title: string;
  detail: string;
  severity: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  readonly metrics: MetricCard[] = [
    {
      label: 'Documentos analizados',
      value: '184',
      detail: '28 esta semana',
      icon: 'pi-file',
      tone: 'text-brand-600 bg-surface-50',
    },
    {
      label: 'Actas generadas',
      value: '42',
      detail: '9 esta semana',
      icon: 'pi-microphone',
      tone: 'text-brand-600 bg-surface-50',
    },
    {
      label: 'Auditorias registradas',
      value: '17',
      detail: '3 requieren revision',
      icon: 'pi-shield',
      tone: 'text-surface-800 bg-surface-50',
    },
  ];

  readonly activity: ActivityItem[] = [
    {
      title: 'Reunion Comite Academico',
      type: 'Acta',
      reference: 'Hace 12 min',
      icon: 'pi-microphone',
      status: 'Completado',
    },
    {
      title: 'tesis-marquez-cap3-revisado.pdf',
      type: 'Analisis',
      reference: 'Hace 1 hora',
      icon: 'pi-file',
      status: 'Completado',
    },
    {
      title: 'Defensa de Proyecto - L. Vargas',
      type: 'Acta',
      reference: 'Ayer 16:42',
      icon: 'pi-microphone',
      status: 'Revisar',
    },
  ];

  readonly audits: AuditItem[] = [
    {
      title: 'Inicio de sesion administrativo',
      detail: 'admin@docsuite.edu.pe · hace 8 min',
      severity: 'Normal',
    },
    {
      title: 'Acta editada',
      detail: 'Reunion Comite Academico · hace 22 min',
      severity: 'Revision',
    },
    {
      title: 'Exportacion DOCX',
      detail: 'Defensa de Proyecto · ayer',
      severity: 'Normal',
    },
  ];
}
