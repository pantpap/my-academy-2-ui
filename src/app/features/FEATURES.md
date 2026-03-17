# FEATURES Directory Guide

## Role of the `features` directory

The `features` directory contains the **business or domain functionality** of the application.  
This is where you organize the app based on the capabilities it provides to users, not just by technical file type.

Examples of features:

- users
- reports
- dashboard
- organizations
- reconciliation
- settings
- travelers
- offers

In simple terms:

- each feature has its own logic
- each feature has its own components, services, and models
- each feature implements a business area

---

## What usually goes inside `features`

Each feature may contain:

- pages / smart components
- feature-specific components
- services / facades
- models
- routes
- state
- resolvers
- local mappers
- API integration logic that only concerns that feature

---

## Example

```text
features/
  reports/
    pages/
    components/
    services/
    models/
    routes/
    state/

  users/
    pages/
    components/
    services/
    models/

  dashboard/
    pages/
    widgets/
    services/
```

---

## What goes inside each feature

### 1. Feature pages
Examples:

- `reports-list-page.component.ts`
- `report-details-page.component.ts`
- `organization-details-page.component.ts`

These are the main containers or smart components of the feature.

---

### 2. Feature-specific components
Examples:

- `report-filters.component.ts`
- `organization-members-table.component.ts`
- `traveler-chip-list.component.ts`

If a component only exists for that feature, it should usually stay there.

---

### 3. Feature services / facades
Examples:

- `reports.service.ts`
- `organizations.facade.ts`
- `travelers-data.service.ts`

If a service only concerns one feature, there is no reason to move it into `core`.

---

### 4. Feature models
Examples:

- `report.model.ts`
- `organization-details.model.ts`
- `traveler-filter.model.ts`

If models are domain-specific, keep them inside the feature.

---

### 5. Feature state
Examples:

- signals state
- component store
- ngrx slices
- local cache or derived state logic

---

### 6. Feature routes
Examples:

- `reports.routes.ts`
- `organizations.routes.ts`

---

## What should **not** go into `features`

### Avoid putting:
- app-wide auth infrastructure
- global interceptors or guards unrelated to the feature
- generic UI components reused everywhere
- common utilities and validators for broad reuse

Examples:
- `AuthInterceptor` → `core`
- `PageHeaderComponent` → `shared`
- `safeJsonParse()` → `common`

---

## How to think about `features`

Ask:

**“Does this belong to a specific business area?”**  
**“If I removed this feature tomorrow, should this file disappear with it?”**

If yes, then it should stay inside the feature.

---

## Why `features` matters

This structure:

- improves maintainability
- helps scalability
- reduces coupling
- makes ownership by domain easier
- supports lazy loading and modular architecture

---

## Best practices

- Organize by business feature, not only by file type
- Keep feature logic as close to the feature as possible
- Move things to `shared` or `common` only when they are truly reusable
- Do not promote things to global level too early
- Clearly separate pages, UI parts, services, and models

---

## Short rule

`features` is where the **real functionality of the app** lives.  
If something belongs to a specific domain and is not broadly reusable, it should stay here.
