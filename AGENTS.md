# AGENTS.md

## Project Overview

Angular 21 standalone application using **Angular Material 3** (M3) for UI components and **Tailwind CSS v4** for utility styling. Built with the Angular CLI (`@angular/build`), tested with **Vitest** (not Karma/Jasmine).

## Architecture

- **Standalone components** — no `NgModule`s. Components declare their dependencies via `imports` array in `@Component()` (see `src/app/app.ts`).
- **Signal-based state** — use Angular signals (`signal()`, `computed()`, `effect()`) for reactive state, not `BehaviorSubject` (see `App.title` in `src/app/app.ts`).
- **Functional providers** — app config uses `provideRouter()`, `provideBrowserGlobalErrorListeners()`, and other `provide*()` functions in `src/app/app.config.ts`. No `@NgModule`-style `imports`.
- **Routing** — defined in `src/app/app.routes.ts` as a flat `Routes` array. Add new routes there; use lazy loading with `loadComponent`.
- **Entry point** — `src/main.ts` bootstraps with `bootstrapApplication(App, appConfig)`.
- **Dependency injection** — use the `inject()` function, not constructor injection (see `Header` in `src/app/shared/components/header/header.ts`).
- **Change detection** — prefer `ChangeDetectionStrategy.OnPush` on all components (enforced by ESLint).
- **Material imports** — import individual M3 symbols, not full modules (e.g., `import { MatToolbar } from '@angular/material/toolbar'`; see `src/app/shared/components/header/header.ts`).
- **Material Icons** — loaded via Google Fonts CDN in `src/index.html`, not via npm. Use `<mat-icon>icon_name</mat-icon>` in templates.

### Directory Structure

```text
src/app/
  core/         → global singletons: services, guards, interceptors, layout, config
  shared/       → reusable UI: components, directives, pipes
  common/       → generic utilities, interfaces, constants, validators
  features/     → business/domain feature modules (lazy-loaded)
```

Each directory contains a guide file (`CORE.md`, `SHARED.md`, `COMMON.md`, `FEATURES.md`) describing what belongs there. Consult them before adding new files.

> **Note:** `core/interceptros/` is a known typo in the filesystem (should be `interceptors`). Use that path as-is until renamed.

## Styling

- **Material theme**: `src/material-theme.scss` — M3 theme via `@use '@angular/material' as mat` with `mat.theme()`. Primary = `$azure-palette`, tertiary = `$blue-palette`. Color scheme is `light` by default.
- **Tailwind CSS v4**: imported in `src/styles.css` via `@import "tailwindcss"`. Use Tailwind utility classes freely in templates.
- **Global styles** load order in `angular.json`: `material-theme.scss` first, then `styles.css`.
- Component-scoped styles go in `<component>.css` co-located with the component.
- **Dark mode**: `ThemeService` (`src/app/core/services/theme.service.ts`) toggles light/dark by setting `document.body.style.colorScheme`. M3 CSS variables respond automatically — no extra Sass mixins needed. See `THEMING.md` for full details.

## Component File Conventions

Components use **shortened filenames** without `.component` infix:

| Purpose    | Filename pattern        |
|------------|-------------------------|
| Class      | `feature.ts`            |
| Template   | `feature.html`          |
| Styles     | `feature.css`           |
| Tests      | `feature.spec.ts`       |

Selector prefix: `app-` (configured in `angular.json` under `prefix`).

- **Component selectors**: `element` type, `kebab-case` → `app-feature-name`
- **Directive selectors**: `attribute` type, `camelCase` → `appFeatureName`

Both conventions are enforced by ESLint (see `eslint.config.js`).

## Commands

| Task       | Command      | Notes                                |
|------------|-------------|--------------------------------------|
| Dev server | `npm start`  | Serves at `http://localhost:4200`    |
| Build      | `npm run build` | Production build to `dist/`       |
| Watch      | `npm run watch` | Dev build in watch mode           |
| Tests      | `npm test`   | Runs Vitest via `@angular/build:unit-test` |
| Lint       | `npm run lint` | ESLint + Prettier on `src/**/*.{ts,html}` |
| Scaffold   | `ng generate component <name>` | Generates standalone component |

## Testing

- **Runner**: Vitest (not Jasmine/Karma). Global types from `vitest/globals` are available in spec files (`tsconfig.spec.json`).
- **Test style**: Uses Angular `TestBed` with `configureTestingModule({ imports: [Component] })` for standalone components (see `src/app/app.spec.ts`).
- **Assertions**: Use `expect()` from Vitest globals. Async rendering uses `await fixture.whenStable()`.
- **Testing effects**: Use `TestBed.flushEffects()` to synchronously execute pending signal effects in tests (see `src/app/core/services/theme.service.spec.ts`).

## Code Quality

- **TypeScript strict mode** enabled with `noImplicitOverride`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `noFallthroughCasesInSwitch`, `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers`.
- **ESLint** flat config (`eslint.config.js`) using `angular-eslint` + `typescript-eslint`. Uses ESLint v10 `defineConfig` with CommonJS `require()`. Notable rules enforced as warnings: `prefer-on-push-component-change-detection`, `prefer-signals`, `prefer-standalone`, `no-empty-lifecycle-method`, `prefer-output-readonly`. Also extends `tseslint.configs.stylistic` for TypeScript style conventions. HTML templates are linted with `angular.configs.templateAccessibility` — accessibility violations will be flagged.
- **Prettier** configured in `package.json`: `printWidth: 100`, `singleQuote: true`, HTML uses the `angular` parser. Integrated with ESLint via `eslint-plugin-prettier`.

## Key Dependencies

| Package             | Purpose                        |
|---------------------|--------------------------------|
| `@angular/material` | M3 UI components               |
| `@angular/cdk`      | Component Dev Kit (overlays, a11y, etc.) |
| `@angular/forms`    | Reactive and template-driven forms |
| `tailwindcss` v4    | Utility-first CSS (via `@tailwindcss/postcss`) |
| `vitest`            | Unit test runner (`jsdom` environment) |
| `angular-eslint`    | Angular-specific lint rules + template processing |
| `typescript-eslint`  | TypeScript-aware ESLint rules   |

