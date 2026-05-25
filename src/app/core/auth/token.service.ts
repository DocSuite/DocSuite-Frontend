import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'docsuite_access_token';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  getToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  hasToken(): boolean {
    return this.getToken() !== null;
  }
}
