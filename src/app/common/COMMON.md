# COMMON Directory Guide

## Role of the `common` directory

The `common` directory contains **general-purpose code** that is neither global infrastructure (`core`) nor reusable UI (`shared`).

It is the place for:

- utilities
- validators
- constants
- types / interfaces
- tokens
- mappers
- helper functions

In simple terms, `common` holds the **agnostic, generic code layer** of the app.

---

## What usually goes inside `common`

### 1. Utility functions
Examples:

- `normalizeToUtc()`
- `safeJsonParse()`
- `downloadFile()`
- `groupBy()`
- `formatCurrencyValue()`
- `buildQueryParams()`

These functions are not UI-related and do not belong to a feature.

---

### 2. Validators
Examples:

- `duplicateDomainValidator`
- `dateRangeValidator`
- `requiredIfValidator`
- `ibanValidator`

If validators are reusable and not tied to one feature, `common/validators` is a very good place for them.

---

### 3. Constants
Examples:

- app constants
- regex constants
- storage keys
- default page sizes
- date format strings

---

### 4. General-purpose types / interfaces / models
Examples:

- `ApiResponse<T>`
- `SelectOption`
- `LookupItem`
- `PaginationState`
- `Nullable<T>`
- common union types

If they are used by multiple features or layers, they fit well in `common/types`.

---

### 5. Injection tokens
Examples:

- `APP_ENV`
- `API_BASE_URL`
- `FEATURE_FLAGS`
- `WINDOW` token

---

### 6. Mappers / adapters
Examples:

- data normalization helpers
- DTO → UI model mappers
- shared transformation functions

If a mapper is generic or reused in multiple places, `common` is the right choice.

---

## What should **not** go into `common`

### Avoid putting:
- components, pipes, or directives with a UI role
- app-wide singleton services
- auth, session, or interceptor logic
- domain-specific code for a single feature

Examples:
- `PageHeaderComponent` → `shared`
- `AuthService` → `core`
- `InvoicesStateService` used only for invoices → feature folder

---

## How to think about `common`

Ask:

**“Is this generic code with no UI responsibility?”**  
**“Can it be used by multiple features or layers?”**  
**“Is it not app infrastructure and not presentation either?”**

If yes, then `common` is likely the right place.

---

## Suggested structure

```text
common/
  utils/
  validators/
  constants/
  types/
  tokens/
  mappers/
```

---

## Example real structure

```text
common/
  utils/
    normalize-to-utc.ts
    safe-json-parse.ts
    array.utils.ts

  validators/
    duplicate-domain.validator.ts
    date-range.validator.ts

  constants/
    storage-keys.ts
    app.constants.ts

  types/
    api-response.ts
    lookup-item.ts
    pagination-state.ts

  tokens/
    api-base-url.token.ts

  mappers/
    lookup.mapper.ts
```

---

## Best practices

- Prefer pure functions
- Avoid side effects in utilities
- Do not mix domain models with common models
- Organize code into small, clear files
- Put things here only when they have real reusability

---

## Short rule

`common` is the **toolbox of the app**.  
If something is generic, reusable, and neither UI nor app infrastructure, it usually belongs here.
