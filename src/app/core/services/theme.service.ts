import { computed, effect, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme-preference';

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
  /** Current theme signal. */
  readonly theme = signal<Theme>(this.storedTheme());

  /** Convenience boolean — `true` when dark mode is active. */
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => {
      const value = this.theme();
      document.body.style.colorScheme = value;
      localStorage.setItem(STORAGE_KEY, value);
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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return 'light';
  }
}

