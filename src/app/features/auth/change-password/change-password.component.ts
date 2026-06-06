import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
})
export class ChangePasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly isActivationChange = computed(() => this.authService.currentUser()?.must_change_password ?? false);

  readonly form = this.formBuilder.nonNullable.group({
    current_password: ['', [Validators.required, Validators.minLength(8)]],
    new_password: ['', [Validators.required, Validators.minLength(8)]],
    confirm_password: ['', [Validators.required, Validators.minLength(8)]],
  });

  toggleCurrentPassword(): void {
    this.showCurrentPassword.update((value) => !value);
  }

  toggleNewPassword(): void {
    this.showNewPassword.update((value) => !value);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    if (value.new_password !== value.confirm_password) {
      this.errorMessage.set('La confirmacion no coincide.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.authService
      .changePassword({
        current_password: value.current_password,
        new_password: value.new_password,
      })
      .subscribe({
        next: () => {
          void this.router.navigate([this.authService.firstAccessiblePath()]);
        },
        error: () => {
          this.errorMessage.set('No se pudo actualizar la contrasena.');
          this.isSubmitting.set(false);
        },
      });
  }
}
