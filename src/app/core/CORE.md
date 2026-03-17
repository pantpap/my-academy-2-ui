# CORE Directory Guide

## Role of the `core` directory

The `core` directory contains the **application-level infrastructure** of an Angular app.  
This is where you put things that are usually initialized once and serve the entire application.

In simple terms:

- it supports the app at a global level
- it contains singleton logic
- it does not belong to a single feature
- it is not just reusable UI

---

## What usually goes inside `core`

### 1. Services that should exist once
Examples:

- `AuthService`
- `AppConfigService`
- `UserSessionService`
- `PermissionsService`
- `ApiClientService`

These are services that make sense at application level, not inside a specific feature.

---

### 2. HTTP interceptors
Examples:

- `auth.interceptor.ts`
- `error.interceptor.ts`
- `loading.interceptor.ts`
- `logging.interceptor.ts`

Interceptors affect the entire HTTP flow of the application, so they naturally belong in `core`.

---

### 3. Route guards
Examples:

- `auth.guard.ts`
- `guest.guard.ts`
- `permissions.guard.ts`
- `can-deactivate.guard.ts`

Guards control access or navigation rules at app level.

---

### 4. App initialization logic
Examples:

- loading config before the app starts
- bootstrapping initial data
- initializing feature flags
- initializing localization settings
- restoring session state

Often this includes `app.initializer.ts` or provider logic for `APP_INITIALIZER`.

---

### 5. Global layout / shell
Examples:

- `MainLayoutComponent`
- `AuthLayoutComponent`
- topbar / sidebar shell
- app frame components

If a layout is part of the main application skeleton, it usually belongs in `core`.

---

### 6. Global state or infrastructure services
Examples:

- application store service
- global notification service
- theme service
- feature flag service

---

## What should **not** go into `core`

### Avoid putting:
- feature-specific services
- components that belong only to one module or domain
- generic utility functions
- shared pipes, directives, or presentational components

Examples:
- `ReportsService` that only concerns the reports feature → better inside the feature
- `PageHeaderComponent` → better in `shared`
- `normalizeToUtc()` → better in `common`

---

## How to think about `core`

Ask:

**“Is this part of the application’s foundation?”**  
**“Should this exist once for the whole app?”**

If the answer is yes, then it probably belongs in `core`.

---

## Suggested structure

```text
core/
  config/
  guards/
  interceptors/
  services/
  layout/
  state/
  initialization/
```

---

## Example real structure

```text
core/
  config/
    app-config.token.ts
    app-config.service.ts

  guards/
    auth.guard.ts
    permissions.guard.ts

  interceptors/
    auth.interceptor.ts
    error.interceptor.ts

  services/
    auth.service.ts
    session.service.ts
    notification.service.ts

  layout/
    main-layout.component.ts
    auth-layout.component.ts
```

---

## Best practices

- Keep `core` small and intentional
- Do not turn it into a “whatever does not fit elsewhere” folder
- Avoid putting feature-specific business logic here
- Name services and providers clearly
- Separate infrastructure from domain logic

---

## Short rule

`core` is the **foundation of the application**.  
If something is global, singleton, and app-wide, this is usually its natural place.
