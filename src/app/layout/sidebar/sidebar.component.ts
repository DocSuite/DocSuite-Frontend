import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/auth/auth.models';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = signal<User | null>(null);

  readonly workspaceItems: SidebarItem[] = [
    { label: 'Dashboard', icon: 'pi-home', route: '/dashboard' },
    { label: 'DocAnalyzer', icon: 'pi-file', route: '/dashboard', badge: 'Pronto', disabled: true },
    { label: 'DocActa', icon: 'pi-microphone', route: '/doc-acta' },
    { label: 'Historial', icon: 'pi-history', route: '/dashboard', badge: 'Pronto', disabled: true },
    { label: 'Auditorias', icon: 'pi-shield', route: '/audits' },
    { label: 'Mi perfil', icon: 'pi-user', route: '/profile' },
  ];

  ngOnInit(): void {
    this.authService.me().subscribe({
      next: (user) => this.user.set(user),
      error: () => this.user.set(null),
    });
  }

  get initials(): string {
    const name = this.user()?.full_name || this.user()?.email || 'DS';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  get displayName(): string {
    return this.user()?.full_name || 'Usuario DocSuite';
  }

  get displayEmail(): string {
    return this.user()?.email || 'sesion activa';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
