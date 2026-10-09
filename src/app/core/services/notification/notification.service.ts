import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

const DURATION_MS = 5000;

/**
 * Application-wide transient messages (SPEC-organizations-admin.md).
 *
 * Thin wrapper over Angular Material's `MatSnackBar`, so the rest of the app
 * does not depend on how messages are shown.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, undefined, {
      duration: DURATION_MS,
      panelClass: ['notification-success'],
    });
  }

  error(message: string): void {
    this.snackBar.open(message, undefined, {
      duration: DURATION_MS,
      panelClass: ['notification-error'],
    });
  }
}
