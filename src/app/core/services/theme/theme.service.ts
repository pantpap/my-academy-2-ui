import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { THEME } from '../../../common/constants/local-storage-constants';
import { LocalStorage } from '../localStorage/local-storage';

export type Theme = 'light' | 'dark';

/**
 * Application-wide theme service.
 *
 * Toggles Angular Material 3 between light and dark mode by setting the
 * CSS `color-scheme` property on `<body>`. M3's generated CSS variables
 * respond to this property automatically — no extra Sass mixins needed.
 *
 * The user's preference is persisted to `localStorage`.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {

  private readonly localStorageService = inject(LocalStorage)

  /** Current theme signal. */
  readonly theme = signal<Theme>(this.storedTheme());

  /** Convenience boolean — `true` when dark mode is active. */
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => {
      const value = this.theme();
      document.body.style.colorScheme = value;
      this.localStorageService.setItem(THEME, value);
    });
  }

  /** Switch between light ↔ dark. */
  toggle(): void {
    this.theme.update((current) => (current === 'light' ? 'dark' : 'light'));
  }

  /** Set a specific theme. */
  set(theme: Theme): void {
    this.theme.set(theme);
  }

  private storedTheme(): Theme {
    const stored = this.localStorageService.getItem(THEME);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return 'light';
  }
}

