import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { waitForAuthSessionReady } from '../mtx-firebase';
import { AccountService } from '../services/account.service';
import { AuthSessionService } from '../services/auth-session.service';

export const writerGuard: CanActivateFn = async () => {
  const authSession = inject(AuthSessionService);
  const accountService = inject(AccountService);
  const router = inject(Router);

  const user = authSession.currentUser() || (await waitForAuthSessionReady());
  if (!user) {
    return router.createUrlTree(['/auth']);
  }

  if (!accountService.ownProfile() || accountService.ownProfile()?.uid !== user.uid) {
    await accountService.loadOwnerAccount(user.uid);
  }

  const status = accountService.ownWriterStatus();
  if (status.canPublish || status.isAdmin) {
    return true;
  }

  return router.createUrlTree(['/']);
};
