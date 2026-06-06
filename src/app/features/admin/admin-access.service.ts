import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AdminRole,
  AdminUser,
  RolePayload,
  RolePermission,
  UserAccessPayload,
  UserCreatePayload,
} from './admin-access.models';

@Injectable({
  providedIn: 'root',
})
export class AdminAccessService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  listUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/admin/users`);
  }

  createUser(payload: UserCreatePayload): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.apiUrl}/admin/users`, payload);
  }

  updateUser(userId: string, payload: UserAccessPayload): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/admin/users/${userId}`, payload);
  }

  listRoles(): Observable<AdminRole[]> {
    return this.http.get<AdminRole[]>(`${this.apiUrl}/admin/roles`);
  }

  createRole(payload: RolePayload): Observable<AdminRole> {
    return this.http.post<AdminRole>(`${this.apiUrl}/admin/roles`, payload);
  }

  updateRole(roleId: number, payload: RolePayload): Observable<AdminRole> {
    return this.http.patch<AdminRole>(`${this.apiUrl}/admin/roles/${roleId}`, payload);
  }

  deleteRole(roleId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/roles/${roleId}`);
  }

  getPermissions(roleId: number): Observable<RolePermission[]> {
    return this.http.get<RolePermission[]>(`${this.apiUrl}/admin/roles/${roleId}/permissions`);
  }

  savePermissions(roleId: number, permissions: RolePermission[]): Observable<RolePermission[]> {
    return this.http.put<RolePermission[]>(
      `${this.apiUrl}/admin/roles/${roleId}/permissions`,
      permissions,
    );
  }
}
