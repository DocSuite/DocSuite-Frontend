import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly token = signal(this.route.snapshot.queryParamMap.get('token') ?? '');

  readonly form = this.formBuilder.nonNullable.group({
    new_password: ['', [Validators.required, Validators.minLength(8)]],
    confirm_password: ['', [Validators.required, Validators.minLength(8)]],
  });

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

    if (!this.token()) {
      this.errorMessage.set('El enlace de restablecimiento no es valido.');
      return;
    }

    const value = this.form.getRawValue();
    if (value.new_password !== value.confirm_password) {
      this.errorMessage.set('La confirmacion no coincide.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.authService.resetPassword({
      token: this.token(),
      new_password: value.new_password,
    }).subscribe({
      next: () => {
        void this.router.navigate(['/login']);
      },
      error: () => {
        this.errorMessage.set('El enlace no es valido o ya vencio.');
        this.isSubmitting.set(false);
      },
    });
  }
}
