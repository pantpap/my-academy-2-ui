# Theming Guide

## How it works

The app uses **Angular Material 3** (M3) automatic dark mode via the CSS `color-scheme` property.

M3's `mat.theme()` mixin (in `src/material-theme.scss`) generates CSS custom properties (e.g. `--mat-sys-surface`, `--mat-sys-on-surface`, `--mat-sys-primary`) that **automatically switch** between light and dark palettes based on the `color-scheme` value on the element.

The **`ThemeService`** (`src/app/core/services/theme.service.ts`) controls this at runtime:

```
document.body.style.colorScheme = 'light' | 'dark';
```

No duplicate Sass theme blocks, no extra CSS classes — just one property flip.

---

## Key files

| File | Role |
|------|------|
| `src/material-theme.scss` | M3 theme definition (palettes, typography, density). The `color-scheme` fallback is set here. |
| `src/app/core/services/theme.service.ts` | Singleton service that owns the theme signal, toggles `color-scheme`, persists to `localStorage`. |
| `src/app/shared/components/header/header.ts` | Injects `ThemeService` and exposes `isDark` / `toggleTheme()` to the template. |

---

## Using the ThemeService

### Inject it

```typescript
import { inject } from '@angular/core';
import { ThemeService } from '../core/services/theme.service';

private readonly themeService = inject(ThemeService);
```

### Read the current theme

```typescript
// Signal — use in templates or computed()
this.themeService.isDark();   // boolean
this.themeService.theme();    // 'light' | 'dark'
```

### Toggle or set

```typescript
this.themeService.toggle();       // light ↔ dark
this.themeService.set('dark');    // explicit
```

---

## Styling your own components for dark mode

Because M3 relies on CSS custom properties, **most components need zero extra work** — they inherit the correct colors from M3 system variables.

### 1. Prefer M3 system variables

Use M3's semantic variables instead of hardcoded colors:

```css
/* ✅ DO — adapts automatically */
.card {
  background-color: var(--mat-sys-surface-container);
  color: var(--mat-sys-on-surface);
  border: 1px solid var(--mat-sys-outline-variant);
}

/* ❌ DON'T — breaks in dark mode */
.card {
  background-color: #ffffff;
  color: #333333;
}
```

Common M3 system variables:

| Variable | Purpose |
|----------|---------|
| `--mat-sys-primary` | Primary brand color |
| `--mat-sys-on-primary` | Text/icon on primary |
| `--mat-sys-surface` | Default background |
| `--mat-sys-on-surface` | Default text color |
| `--mat-sys-surface-container` | Elevated surface (cards, dialogs) |
| `--mat-sys-outline` | Borders, dividers |
| `--mat-sys-outline-variant` | Subtle borders |
| `--mat-sys-error` | Error state |
| `--mat-sys-on-error` | Text on error |

Full list: [material.angular.dev/guide/system-variables](https://material.angular.dev/guide/system-variables)

### 2. Tailwind utilities

Tailwind classes that use the default palette (e.g. `bg-white`, `text-black`) will **not** adapt. Instead:

```html
<!-- ✅ DO — use M3 variables via arbitrary values -->
<div class="bg-[var(--mat-sys-surface-container)] text-[var(--mat-sys-on-surface)]">

<!-- ✅ DO — or use Tailwind's dark: variant if you have specific overrides -->
<div class="bg-white dark:bg-neutral-900">
```

### 3. Conditional logic in templates

If you need to show/hide content based on theme:

```typescript
protected readonly isDark = inject(ThemeService).isDark;
```

```html
<img [src]="isDark() ? 'logo-dark.svg' : 'logo-light.svg'" />
```

---

## Persistence

The user's preference is saved to `localStorage` under the key `theme-preference`. On app load, `ThemeService` reads this value. If no value exists, it defaults to `light`.

---

## Testing

When testing components that depend on theme:

```typescript
const themeService = TestBed.inject(ThemeService);
themeService.set('dark');
fixture.detectChanges();
// assert dark-mode behavior
```

See `src/app/shared/components/header/header.spec.ts` for a working example.

