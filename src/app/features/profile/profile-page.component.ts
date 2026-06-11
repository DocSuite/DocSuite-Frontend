import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { User } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { AlertMessageComponent } from '../../shared/components/alert-message/alert-message.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlertMessageComponent, LoadingStateComponent, PageHeaderComponent],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly user = signal<User | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isEditing = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly fullNameDraft = signal('');
  readonly canUpdateProfile = computed(() => this.authService.canUpdatePath('/profile'));
  readonly profileValidationMessage = computed(() => {
    const fullName = this.fullNameDraft().trim();
    if (fullName.length < 2 || fullName.length > 255) {
      return 'El nombre debe tener entre 2 y 255 caracteres.';
    }
    return null;
  });

  ngOnInit(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.me().subscribe({
      next: (user) => {
        this.user.set(user);
        this.fullNameDraft.set(user.full_name);
        this.isLoading.set(false);
      },
      error: () => {
        this.user.set(null);
        this.errorMessage.set('No se pudo cargar la informacion del perfil.');
        this.isLoading.set(false);
      },
    });
  }

  startEditing(): void {
    if (!this.canUpdateProfile() || !this.user()) {
      return;
    }

    this.fullNameDraft.set(this.user()?.full_name ?? '');
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.fullNameDraft.set(this.user()?.full_name ?? '');
    this.isEditing.set(false);
    this.errorMessage.set(null);
  }

  saveProfile(): void {
    const fullName = this.fullNameDraft().trim();
    const validationMessage = this.profileValidationMessage();
    if (validationMessage) {
      this.errorMessage.set(validationMessage);
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.authService.updateProfile({ full_name: fullName }).subscribe({
      next: (user) => {
        this.user.set(user);
        this.fullNameDraft.set(user.full_name);
        this.isEditing.set(false);
        this.isSaving.set(false);
        this.notificationService.showSuccess('Perfil actualizado.');
      },
      error: () => {
        this.errorMessage.set('No se pudo actualizar el perfil.');
        this.isSaving.set(false);
      },
    });
  }

  formatDate(value: string | undefined): string {
    if (!value) {
      return 'No disponible';
    }

    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}
