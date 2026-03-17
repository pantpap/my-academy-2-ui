# SHARED Directory Guide

## Role of the `shared` directory

The `shared` directory contains **reusable building blocks**, mostly for UI and presentation.  
This is where you put things that can be reused across multiple features without belonging exclusively to one of them.

In simple terms:

- reusable components
- reusable directives
- reusable pipes
- common form and presentation pieces
- UI building blocks

---

## What usually goes inside `shared`

### 1. Reusable UI components
Examples:

- `PageHeaderComponent`
- `EmptyStateComponent`
- `LoaderComponent`
- `ConfirmDialogWrapperComponent`
- `CardSectionComponent`
- `StatusBadgeComponent`

These are components that can be used in multiple different features.

---

### 2. Directives
Examples:

- `click-outside.directive.ts`
- `autofocus.directive.ts`
- `trim-input.directive.ts`
- `debounce-click.directive.ts`

Directives in `shared` should be generic and not tied to a specific feature.

---

### 3. Pipes
Examples:

- `safe-html.pipe.ts`
- `date-from-now.pipe.ts`
- `lookup-by-id.pipe.ts`
- `truncate.pipe.ts`

If a pipe is reusable in many places, it fits well in `shared`.

---

### 4. Reusable form pieces
Examples:

- custom input wrappers
- dropdown wrappers
- field error display components
- common filter bar components

---

### 5. Shared UI composition
This may include:

- reusable table toolbars
- pagination wrappers
- filter panels
- action menus
- generic modal content sections

---

## What should **not** go into `shared`

### Avoid putting:
- global infrastructure services
- app initialization logic
- auth or session internals
- generic utility functions with no UI role
- feature-specific business logic

Examples:
- `AuthInterceptor` → `core`
- `normalizeToUtc()` → `common`
- `ReportsFacadeService` used only by reports → inside the feature

---

## How to think about `shared`

Ask:

**“Is this a reusable presentation or UI piece?”**  
**“Could two or three different features use this?”**

If yes, `shared` is likely a good fit.

---

## Suggested structure

```text
shared/
  components/
  directives/
  pipes/
  forms/
  ui/
```

---

## Example real structure

```text
shared/
  components/
    page-header/
    empty-state/
    loader/
    status-badge/

  directives/
    click-outside.directive.ts
    autofocus.directive.ts

  pipes/
    safe-html.pipe.ts
    date-from-now.pipe.ts
    lookup-by-id.pipe.ts

  forms/
    form-error-message.component.ts
    search-input.component.ts
```

---

## Best practices

- Keep shared components as dumb or presentational as possible
- Avoid heavy business logic inside shared UI
- Design APIs that are clean and easy to use
- Do not turn `shared` into a dumping ground
- Everything here should have proven reusability

---

## Short rule

`shared` is the **box of reusable UI pieces** in the app.  
If something is presentation-oriented and needed by many features, it usually belongs here.
