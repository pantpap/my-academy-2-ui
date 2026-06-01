import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { form, required, email, FormField, FormRoot, ValidationError } from '@angular/forms/signals';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel, MatError, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslocoDirective } from '@jsverse/transloco';
import { Auth } from '../../services/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AUTH_TOKEN, ORGANIZATION } from '../../../../common/constants/local-storage-constants';
import { LocalStorage } from '../../../../core/services/localStorage/local-storage';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [
    FormField,
    FormRoot,
    MatCard,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatError,
    MatPrefix,
    MatSuffix,
    MatInput,
    MatButton,
    MatIconButton,
    MatIcon,
    TranslocoDirective,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  protected readonly model = signal<LoginModel>({ email: '', password: '' });

  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(Auth);
  private readonly localStorageService = inject(LocalStorage);

  protected readonly loginForm = form(
    this.model,
    (login) => {
      required(login.email);
      email(login.email);
      required(login.password);
    },
    {
      submission: {
        action: async (field) => {
          const value = field().value();
          this.authService
            .login(value)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              this.localStorageService.setItem(AUTH_TOKEN, res.accessToken);
              this.localStorageService.setItem(ORGANIZATION, res.organization);
            });
          return undefined;
        },
      },
    },
  );

  protected readonly passwordVisible = signal(false);

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected hasError(errors: readonly ValidationError.WithFieldTree[], kind: string): boolean {
    return errors.some((e) => e.kind === kind);
  }
}

