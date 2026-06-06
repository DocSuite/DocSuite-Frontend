import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Role } from '../../core/auth/auth.models';
import { NotificationService } from '../../core/services/notification.service';
import { AlertMessageComponent } from '../../shared/components/alert-message/alert-message.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AdminAccessService } from './admin-access.service';
import { AdminUser, RolePermission } from './admin-access.models';

type AdminTab = 'users' | 'roles' | 'permissions';

@Component({
  selector: 'app-admin-access-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertMessageComponent, LoadingStateComponent, PageHeaderComponent],
  templateUrl: './admin-access-page.component.html',
  styleUrl: './admin-access-page.component.scss',
})
export class AdminAccessPageComponent implements OnInit {
  private readonly adminAccessService = inject(AdminAccessService);
  private readonly notificationService = inject(NotificationService);

  readonly activeTab = signal<AdminTab>('users');
  readonly users = signal<AdminUser[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly permissions = signal<RolePermission[]>([]);
  readonly selectedRoleId = signal<number | null>(null);
  readonly editingRoleId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly roleName = signal('');
  readonly roleDescription = signal('');
  readonly userFormOpen = signal(false);
  readonly editingUserId = signal<string | null>(null);
  readonly userFullName = signal('');
  readonly userEmail = signal('');
  readonly userDni = signal('');
  readonly userRoleId = signal<number | null>(null);
  readonly showTemporaryPassword = signal(false);

  readonly selectedRole = computed(() => {
    const roleId = this.selectedRoleId();
    return this.roles().find((role) => role.id === roleId) ?? null;
  });

  ngOnInit(): void {
    this.loadAccessData();
  }

  loadAccessData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminAccessService.listRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.selectedRoleId.set(this.selectedRoleId() ?? roles[0]?.id ?? null);
        this.loadUsers();
        this.loadPermissions();
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar la configuracion de acceso.');
        this.isLoading.set(false);
      },
    });
  }

  loadUsers(): void {
    this.adminAccessService.listUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar los usuarios.');
        this.isLoading.set(false);
      },
    });
  }

  loadPermissions(): void {
    const roleId = this.selectedRoleId();
    if (!roleId) {
      this.permissions.set([]);
      return;
    }

    this.adminAccessService.getPermissions(roleId).subscribe({
      next: (permissions) => this.permissions.set(permissions),
      error: () => this.errorMessage.set('No se pudieron cargar los permisos.'),
    });
  }

  setTab(tab: AdminTab): void {
    this.activeTab.set(tab);
  }

  selectRole(roleId: string): void {
    this.selectedRoleId.set(Number(roleId));
    this.loadPermissions();
  }

  updateUserRole(user: AdminUser, roleId: string): void {
    this.saveUser(user, { role_id: Number(roleId) });
  }

  updateUserStatus(user: AdminUser, isActive: boolean): void {
    this.saveUser(user, { is_active: isActive });
  }

  openCreateUser(): void {
    this.editingUserId.set(null);
    this.userFullName.set('');
    this.userEmail.set('');
    this.userDni.set('');
    this.userRoleId.set(this.roles().find((role) => role.name === 'docente')?.id ?? this.roles()[0]?.id ?? null);
    this.showTemporaryPassword.set(false);
    this.userFormOpen.set(true);
  }

  openEditUser(user: AdminUser): void {
    this.editingUserId.set(user.id);
    this.userFullName.set(user.full_name);
    this.userEmail.set(user.email);
    this.userDni.set(user.dni ?? '');
    this.userRoleId.set(user.role?.id ?? this.roles()[0]?.id ?? null);
    this.showTemporaryPassword.set(false);
    this.userFormOpen.set(true);
  }

  closeUserForm(): void {
    this.userFormOpen.set(false);
  }

  saveUserForm(): void {
    const roleId = this.userRoleId();
    const fullName = this.userFullName().trim();
    const email = this.userEmail().trim().toLowerCase();
    const dni = this.userDni().replace(/\D/g, '').slice(0, 8);

    if (!fullName || !email || !roleId || !/^\d{8}$/.test(dni)) {
      this.errorMessage.set('Completa nombre, correo, DNI de 8 digitos y rol.');
      return;
    }

    this.isSaving.set(true);
    const editingUserId = this.editingUserId();
    const request = editingUserId
      ? this.adminAccessService.updateUser(editingUserId, {
          full_name: fullName,
          email,
          dni,
          role_id: roleId,
        })
      : this.adminAccessService.createUser({
          full_name: fullName,
          email,
          dni,
          role_id: roleId,
        });

    request.subscribe({
      next: (savedUser) => {
        this.users.update((users) => {
          const exists = users.some((user) => user.id === savedUser.id);
          return exists
            ? users.map((user) => (user.id === savedUser.id ? savedUser : user))
            : [savedUser, ...users];
        });
        this.notificationService.showSuccess(editingUserId ? 'Usuario actualizado.' : 'Usuario creado.');
        this.userFormOpen.set(false);
        this.isSaving.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo guardar el usuario.');
        this.isSaving.set(false);
      },
    });
  }

  onUserDniInput(value: string): void {
    this.userDni.set(value.replace(/\D/g, '').slice(0, 8));
  }

  toggleTemporaryPassword(): void {
    this.showTemporaryPassword.update((value) => !value);
  }

  saveRole(): void {
    const payload = {
      name: this.roleName().trim(),
      description: this.roleDescription().trim() || null,
    };

    if (!payload.name) {
      this.errorMessage.set('Ingresa un nombre para el rol.');
      return;
    }

    this.isSaving.set(true);
    const roleId = this.editingRoleId();
    const request = roleId
      ? this.adminAccessService.updateRole(roleId, payload)
      : this.adminAccessService.createRole(payload);

    request.subscribe({
      next: () => {
        this.resetRoleForm();
        this.notificationService.showSuccess('Rol guardado.');
        this.isSaving.set(false);
        this.loadAccessData();
      },
      error: () => {
        this.errorMessage.set('No se pudo guardar el rol.');
        this.isSaving.set(false);
      },
    });
  }

  editRole(role: Role): void {
    this.editingRoleId.set(role.id);
    this.roleName.set(role.name);
    this.roleDescription.set(role.description ?? '');
    this.activeTab.set('roles');
  }

  deleteRole(role: Role): void {
    if (role.is_system) {
      return;
    }

    this.isSaving.set(true);
    this.adminAccessService.deleteRole(role.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Rol eliminado.');
        this.isSaving.set(false);
        this.loadAccessData();
      },
      error: () => {
        this.errorMessage.set('No se pudo eliminar el rol.');
        this.isSaving.set(false);
      },
    });
  }

  resetRoleForm(): void {
    this.editingRoleId.set(null);
    this.roleName.set('');
    this.roleDescription.set('');
  }

  togglePermission(permission: RolePermission, key: keyof RolePermission, value: boolean): void {
    this.permissions.update((permissions) =>
      permissions.map((item) =>
        item.view_id === permission.view_id ? { ...item, [key]: value } : item,
      ),
    );
  }

  savePermissions(): void {
    const roleId = this.selectedRoleId();
    if (!roleId) {
      return;
    }

    this.isSaving.set(true);
    this.adminAccessService.savePermissions(roleId, this.permissions()).subscribe({
      next: (permissions) => {
        this.permissions.set(permissions);
        this.notificationService.showSuccess('Permisos guardados.');
        this.isSaving.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron guardar los permisos.');
        this.isSaving.set(false);
      },
    });
  }

  roleLabel(role: Role | null | undefined): string {
    return role?.name ?? 'Sin rol';
  }

  roleDescriptionText(role: Role): string {
    return role.description || 'Sin descripcion';
  }

  private saveUser(user: AdminUser, payload: { role_id?: number; is_active?: boolean }): void {
    this.isSaving.set(true);
    this.adminAccessService.updateUser(user.id, payload).subscribe({
      next: (updatedUser) => {
        this.users.update((users) =>
          users.map((item) => (item.id === updatedUser.id ? updatedUser : item)),
        );
        this.notificationService.showSuccess('Usuario actualizado.');
        this.isSaving.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo actualizar el usuario.');
        this.isSaving.set(false);
      },
    });
  }
}
