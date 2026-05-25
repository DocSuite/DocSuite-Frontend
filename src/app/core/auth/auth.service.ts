import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginRequest, TokenResponse, User } from './auth.models';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly apiUrl = environment.apiUrl;

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
    return this.http.get<User>(`${this.apiUrl}/auth/me`);
  }

  logout(): void {
    this.tokenService.clearToken();
  }
}
