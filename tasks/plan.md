# Implementation Plan: Customer Form Dialog

**Repo:** `FE/my-academy-2-UI` (Angular 21 + Material 21 + Transloco)
**Status:** awaiting human review — do not implement until approved.

## Overview

Introduce a single reusable Material dialog, `CustomerFormDialog`, that hosts the customer
form markup. Two existing buttons open it:

| Entry point | File | Today | After |
|---|---|---|---|
| Edit button on the customer details page | `customer-details.html:24` | dead button, no `(click)` | opens the dialog in **edit** mode, prefilled customer passed as dialog data |
| Plus / Add button above the customer table | `customer-container.html:3` | `router.navigate(['/app/customers', 'new'])` | opens the **same** dialog in **create** mode, no data |

**Explicitly out of scope (the human is implementing it):** the form logic — `form()` from
`@angular/forms/signals`, validators, field bindings, submission/`action`, `afterClosed()`
handling, and refreshing the customer list after a save. This plan delivers the dialog's
**HTML with the fields** plus the wiring that makes both buttons open it.

> Confirm before implementing: the interview answer selected the **details-page** edit button
> (`customer-details.html:24`), not the pencil icon in the table row
> (`customer-list.html:39`, which keeps navigating to `/app/customers/:id`). If that reading is
> wrong, Task 3 moves to `customer-list.ts` and this plan needs a revision, not a patch.

## Architecture Decisions

1. **Location: `src/app/features/customers/customer-form-dialog/`.** It is consumed by two
   components inside the `customers` feature and by nothing outside it, so per `SHARED.md`
   ("everything here should have proven reusability") it does not belong in `shared/`.
   `FEATURES.md` puts feature-specific components inside the feature.

2. **One dialog, two modes, driven by `MAT_DIALOG_DATA`.** The dialog is opened with
   `{ customer }` for edit and with no data for create. The component reads it via
   `inject(MAT_DIALOG_DATA, { optional: true })` and derives a single `isEditMode` flag that
   only switches the title. No second component, no mode enum.

3. **Fields stay unbound.** The template renders `<mat-form-field>` / `<input matInput>` with
   labels and no `[field]` / `[(value)]` bindings. This is the seam the human fills in. Adding
   speculative bindings now would have to be torn out.

4. **Zero new translation keys.** `customerDetails.*` already contains `createTitle`,
   `editTitle`, and every field label (`firstNameLabel`, `lastNameLabel`, `birthDateLabel`,
   `genderLabel`, `phoneLabel`) in both `en.json` and `el.json`; `common.save` / `common.cancel`
   exist too. The dialog reuses that namespace. **No i18n files are touched.**

5. **Fields mirror `CustomerDetails` exactly** — `firstName`, `lastName`, `birthDate`
   (`matDatepicker`), `gender` (text input), `phone`. Same five fields, same controls, same
   order. `gender` stays a free-text input; turning it into a `mat-select` is a separate
   decision, not this task.

6. **Routes untouched.** `customer-routes.ts` keeps `''`, `'new'`, and `':id'`. The `'new'`
   route simply stops being reachable from the plus button. Deleting it is a follow-up once
   the dialog's form logic actually works — see Open Questions.

## Dependency Graph

```
Customer interface (exists, no change)
        │
        ▼
CustomerFormDialog  ── Task 1 ── (component + template + spec)
        │
        ├──────────────► CustomerContainer.addNewCustomer()   ── Task 2 (create mode)
        │
        └──────────────► CustomerDetails edit button          ── Task 3 (edit mode)
```

Task 1 is the only blocking dependency. Tasks 2 and 3 are independent of each other and
**can be done in either order or in parallel** once Task 1 lands.

## Task List

### Phase 1: Foundation
- [ ] Task 1: Create the `CustomerFormDialog` component with the form markup

### Checkpoint: Foundation

### Phase 2: Entry Points (independent vertical slices)
- [ ] Task 2: Plus button opens the dialog in create mode
- [ ] Task 3: Details-page edit button opens the dialog in edit mode

### Checkpoint: Complete

Full task detail — acceptance criteria, verification, files touched — lives in
[`tasks/todo.md`](./todo.md).

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| No `provideAnimations()` in `app.config.ts` | Low | Material 21 uses CSS-based animations; `MatDatepicker`, `MatTooltip` and other overlay components already work in this app without it. Verify the open/close transition at runtime in the Foundation checkpoint. If broken, add `provideAnimationsAsync()` — one line. |
| `Router` becomes unused in `CustomerContainer` after Task 2 | Low | ESLint/TS will flag the unused import. Remove the `inject(Router)` line and the `@angular/router` import in the same task. |
| Unbound inputs look "broken" during review | Low | Intentional and documented here. The human owns the binding layer. |
| Dialog and `CustomerDetails` drift into two divergent copies of the same form | Medium | Accepted for now — routes are untouched, so both exist. Resolve via the follow-up in Open Questions once the dialog's form logic is done. |
| a11y lint (`templateAccessibility`) on dialog markup | Low | Use `mat-dialog-title` (provides the labelled title), real `<label>` via `<mat-label>`, and a `type="button"` on Cancel. Verified by `npm run lint`. |

## Open Questions

1. **`/app/customers/new` route** — the plus button stops using it, but the route and
   `CustomerDetails`'s create branch remain. Delete both once the dialog's form logic works, or
   keep the page as a deep-linkable alternative? *(Not answered in the interview; this plan
   assumes "leave it, decide later" — the safest default.)*
2. **After a successful save**, should the dialog result refresh
   `CustomerContainer.dataSourceResource` / `CustomerDetails.customerDetailsResource`? This is
   `afterClosed()` handling, which sits in the form-logic layer the human is implementing.
   Tasks 2 and 3 deliberately leave the `afterClosed()` seam empty.
3. **Table row pencil icon** (`customer-list.html:39`) is unchanged and still navigates to
   `/app/customers/:id`. Confirm that is intended — see the note in the Overview.

## Verification Commands

```bash
cd /Users/pantpap/dev/clientside/products/my-academy-2/FE/my-academy-2-UI && npm run lint
```

```bash
cd /Users/pantpap/dev/clientside/products/my-academy-2/FE/my-academy-2-UI && npm run build
```

```bash
cd /Users/pantpap/dev/clientside/products/my-academy-2/FE/my-academy-2-UI && npm test
```

Runtime check: `npm start` → `http://localhost:4200/app/customers`.
