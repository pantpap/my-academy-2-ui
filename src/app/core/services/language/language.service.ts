import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type Language = 'en' | 'el';

const STORAGE_KEY = 'language-preference';

/**
 * Application-wide language service.
 *
 * Manages the active locale and keeps Transloco in sync.
 * The user's preference is persisted to `localStorage` and
 * the `<html lang>` attribute is updated for accessibility.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly transloco = inject(TranslocoService);

  /** Current language signal. */
  readonly language = signal<Language>(this.storedLanguage());

  /** Convenience boolean — `true` when Greek is active. */
  readonly isGreek = computed(() => this.language() === 'el');

  constructor() {
    this.transloco.setActiveLang(this.language());

    effect(() => {
      const lang = this.language();
      this.transloco.setActiveLang(lang);
      document.documentElement.lang = lang;
      localStorage.setItem(STORAGE_KEY, lang);
    });
  }

  /** Switch between en ↔ el. */
  toggle(): void {
    this.language.update((current) => (current === 'en' ? 'el' : 'en'));
  }

  /** Set a specific language. */
  set(language: Language): void {
    this.language.set(language);
  }

  private storedLanguage(): Language {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'el') {
      return stored;
    }
    return 'en';
  }
}

