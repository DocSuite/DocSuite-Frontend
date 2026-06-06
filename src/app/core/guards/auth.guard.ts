import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { TokenService } from '../auth/token.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (!tokenService.hasToken()) {
    return router.createUrlTree(['/login']);
  }

  return authService.me().pipe(
    map((user) => {
      if (user.must_change_password && state.url !== '/change-password') {
        return router.createUrlTree(['/change-password']);
      }
      if (state.url === '/change-password') {
        return true;
      }
      if (!authService.canReadPath(state.url)) {
        return router.createUrlTree([authService.firstAccessiblePath()]);
      }
      return true;
    }),
    catchError(() => {
      authService.logout();
      return of(router.createUrlTree(['/login']));
    }),
  );
};
