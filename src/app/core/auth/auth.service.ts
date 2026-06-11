import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  ResetPasswordRequest,
  TokenResponse,
  User,
  UserProfileUpdate,
} from './auth.models';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly apiUrl = environment.apiUrl;
  readonly currentUser = signal<User | null>(null);

  private readonly protectedPaths = [
    { route: '/dashboard', permission: '/dashboard' },
    { route: '/profile', permission: '/profile' },
    { route: '/doc-analyzer', permission: '/doc-analyzer' },
    { route: '/doc-acta', permission: '/doc-acta' },
    { route: '/history', permission: '/history' },
    { route: '/audits', permission: '/audits' },
    { route: '/admin/access', permission: '/admin/roles' },
  ];

  login(credentials: LoginRequest): Observable<TokenResponse> {
    const body = new HttpParams()
      .set('username', credentials.email)
      .set('password', credentials.password);

    return this.http
      .post<TokenResponse>(`${this.apiUrl}/auth/login`, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .pipe(tap((response) => this.tokenService.setToken(response.access_token)));
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`).pipe(
      tap((user) => this.currentUser.set(user)),
    );
  }

  changePassword(payload: ChangePasswordRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/change-password`, payload).pipe(
      tap((user) => this.currentUser.set(user)),
    );
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/auth/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/auth/reset-password`, payload);
  }

  updateProfile(payload: UserProfileUpdate): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/auth/me`, payload).pipe(
      tap((user) => this.currentUser.set(user)),
    );
  }

  canReadPath(path: string): boolean {
    return this.hasPathPermission(path, '');
  }

  canCreatePath(path: string): boolean {
    return this.hasPathPermission(path, ':w');
  }

  canUpdatePath(path: string): boolean {
    return this.hasPathPermission(path, ':e');
  }

  canDeletePath(path: string): boolean {
    return this.hasPathPermission(path, ':d');
  }

  private hasPathPermission(path: string, suffix: string): boolean {
    const user = this.currentUser();
    if (!user) {
      return false;
    }
    if (user.permissions?.includes('*')) {
      return true;
    }

    const protectedPath = this.permissionForPath(path);
    if (!protectedPath) {
      return true;
    }
    if (!suffix && protectedPath.route === '/profile') {
      return true;
    }

    return user.permissions?.includes(`${protectedPath.permission}${suffix}`) ?? false;
  }

  private permissionForPath(path: string): { route: string; permission: string } | undefined {
    const cleanPath = path.split('?')[0].split('#')[0];
    return this.protectedPaths.find(
      (item) => cleanPath === item.route || cleanPath.startsWith(`${item.route}/`),
    );
  }

  firstAccessiblePath(): string {
    const user = this.currentUser();
    if (!user) {
      return '/login';
    }
    if (user.permissions?.includes('*')) {
      return '/dashboard';
    }
    return (
      this.protectedPaths.find((item) => user.permissions?.includes(item.permission))?.route ??
      '/profile'
    );
  }

  logout(): void {
    this.tokenService.clearToken();
    this.currentUser.set(null);
  }
}
