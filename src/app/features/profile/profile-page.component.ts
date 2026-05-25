import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';

import { User } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly user = signal<User | null>(null);

  ngOnInit(): void {
    this.authService.me().subscribe({
      next: (user) => this.user.set(user),
      error: () => this.user.set(null),
    });
  }
}
