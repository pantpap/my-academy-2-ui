# AGENTS.md

## Project Overview

Angular 21 standalone application using **Angular Material 3** (M3) for UI components and **Tailwind CSS v4** for utility styling. Built with the Angular CLI (`@angular/build`), tested with **Vitest** (not Karma/Jasmine).

## Architecture

- **Standalone components** — no `NgModule`s. Components declare their dependencies via `imports` array in `@Component()` (see `src/app/app.ts`).
- **Signal-based state** — use Angular signals (`signal()`, `computed()`, `effect()`) for reactive state, not `BehaviorSubject` (see `App.title` in `src/app/app.ts`).
- **Functional providers** — app config uses `provideRouter()` and other `provide*()` functions in `src/app/app.config.ts`. No `@NgModule`-style `imports`.
- **Routing** — defined in `src/app/app.routes.ts` as a flat `Routes` array. Add new routes there; use lazy loading with `loadComponent`.
- **Entry point** — `src/main.ts` bootstraps with `bootstrapApplication(App, appConfig)`.

## Styling

- **Material theme**: `src/material-theme.scss` — M3 theme via `@use '@angular/material' as mat` with `mat.theme()`. Primary = `$azure-palette`, tertiary = `$blue-palette`. Color scheme is `light` by default.
- **Tailwind CSS v4**: imported in `src/styles.css` via `@import "tailwindcss"`. Use Tailwind utility classes freely in templates.
- **Global styles** load order in `angular.json`: `material-theme.scss` first, then `styles.css`.
- Component-scoped styles go in `<component>.css` co-located with the component.

## Component File Conventions

Components use **shortened filenames** without `.component` infix:

| Purpose    | Filename pattern        |
|------------|-------------------------|
| Class      | `feature.ts`            |
| Template   | `feature.html`          |
| Styles     | `feature.css`           |
| Tests      | `feature.spec.ts`       |

Selector prefix: `app-` (configured in `angular.json` under `prefix`).

## Commands

| Task       | Command      | Notes                                |
|------------|-------------|--------------------------------------|
| Dev server | `npm start`  | Serves at `http://localhost:4200`    |
| Build      | `npm run build` | Production build to `dist/`       |
| Tests      | `npm test`   | Runs Vitest via `@angular/build:unit-test` |
| Scaffold   | `ng generate component <name>` | Generates standalone component |

## Testing

- **Runner**: Vitest (not Jasmine/Karma). Global types from `vitest/globals` are available in spec files (`tsconfig.spec.json`).
- **Test style**: Uses Angular `TestBed` with `configureTestingModule({ imports: [Component] })` for standalone components (see `src/app/app.spec.ts`).
- **Assertions**: Use `expect()` from Vitest globals. Async rendering uses `await fixture.whenStable()`.

## Code Quality

- **TypeScript strict mode** enabled with `noImplicitOverride`, `noImplicitReturns`, `strictTemplates`, `strictInjectionParameters`.
- **Prettier** configured in `package.json`: `printWidth: 100`, `singleQuote: true`, HTML uses the `angular` parser.

## Key Dependencies

| Package             | Purpose                        |
|---------------------|--------------------------------|
| `@angular/material` | M3 UI components               |
| `@angular/cdk`      | Component Dev Kit (overlays, a11y, etc.) |
| `tailwindcss` v4    | Utility-first CSS              |
| `vitest`            | Unit test runner               |

