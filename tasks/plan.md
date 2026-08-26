# Implementation Plan: Customer Form Dialog

**Repo:** `FE/my-academy-2-UI` (Angular 21 + Material 21 + Transloco)
**Status:** Phases 1–2 (below) shipped and are marked done. Phase 3 is new — awaiting human
review, do not implement until approved. It covers the `dialog-core` module from
[`CAPABILITY-MAP.md`](../CAPABILITY-MAP.md) / [`SPEC-dialog-core.md`](../SPEC-dialog-core.md):
the form logic that Phases 1–2 explicitly deferred to a human (see "Explicitly out of scope"
below) is now in scope.

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

### Phase 3 (`dialog-core`) additions

7. **Port, don't reinvent.** `customer-details.ts` already contains a working `form()` —
   validators, `toFormModel`/`toCustomerPayload`/`formatDateForApi`/`PHONE_PATTERN`, a
   `submission.action` calling `createCustomer`/`updateCustomer` — that is built but **never
   rendered** in its template (dead code from before the dialog approach was adopted). Phase 3
   ports this logic into `CustomerFormDialog` verbatim (same validators, same limits, same
   payload shape) rather than re-deriving new rules. `dialog-consolidation` (a later module,
   not this plan) deletes the original.
8. **Model is a plain `signal`, not `linkedSignal`.** Unlike `customer-details.ts`, the dialog's
   customer is fixed for the dialog's lifetime (`MAT_DIALOG_DATA` is read once, at construction)
   — there is no resource to stay linked to. `protected readonly model =
   signal<CustomerFormModel>(toFormModel(this.data?.customer));` is sufficient.
9. **Close with the saved `Customer` via a typed `MatDialogRef`.** Inject
   `MatDialogRef<CustomerFormDialog, Customer>` and call `dialogRef.close(saved)` at the end of
   `submission.action`, after `firstValueFrom(...)` resolves. Cancel already closes with no data
   via `mat-dialog-close` — unchanged. This is what lets a later module (`dialog-consolidation`)
   read `afterClosed()` and refresh the page; Phase 3 does not add that caller-side code itself.
10. **A minimal inline error banner, since the app has no toast/snackbar service.** A repo-wide
    grep confirms there is no `MatSnackBar`/notification service anywhere. On a failed save,
    show a `saveError` signal as inline text in `mat-dialog-content` (mirroring how
    `customer-details.ts`'s dead code tracked `saveError` as a signal, just rendered this time),
    not a new bespoke component. The dialog stays open so the user can retry.
11.5. **`birthDate` binds manually, not via `[formField]`.** Verified against the installed
    `@angular/material` types before implementing: `MatDatepickerInput` implements only
    `ControlValueAccessor`, not the `FormValueControl` interface `[formField]` requires (no
    example anywhere — including Angular's own signal-forms docs — pairs `matDatepicker` with
    `[formField]`; the docs cover `Date` support only for native `<input type="date">`). Task 4
    binds `birthDate` via `MatDatepickerInput`'s own `[value]`/`(dateChange)` API directly
    against the `model` signal instead. This still fully participates in `customerForm`'s
    validation, since `form()`'s model is its single source of truth regardless of which code
    path writes to it.
12. **`paidUntil` renders as plain read-only text, not a form field.** It has no `[field]`
    binding and is excluded from `CustomerFormModel`/`toCustomerPayload` entirely — it is
    display-only per `SPEC-dialog-core.md`, and editing it is out of scope for the whole
    capability map (payment recording is a separate, future module).

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
                                    │
                                    ▼
                    customer-details.ts's dead form() (source to port from)
                                    │
                                    ▼
                    Task 4: bind, validate, populate, save — EDIT mode
                                    │
                                    ▼
                    Task 5: extend to CREATE mode
```

Task 1 is the only blocking dependency for Tasks 2–3. Tasks 2 and 3 are independent of each
other and can be done in either order or in parallel once Task 1 lands. Task 4 depends on
Task 1 (needs the rendered fields to bind to) and Task 3 (needs the edit entry point to exercise
it against). Task 5 depends on Task 4 (reuses its `form()`/model/save infrastructure) and Task 2
(needs the create entry point).

## Task List

### Phase 1: Foundation
- [x] Task 1: Create the `CustomerFormDialog` component with the form markup

### Checkpoint: Foundation

### Phase 2: Entry Points (independent vertical slices)
- [x] Task 2: Plus button opens the dialog in create mode
- [x] Task 3: Details-page edit button opens the dialog in edit mode

### Checkpoint: Complete (Phases 1–2)

### Phase 3: Bind, Validate, Save (`dialog-core` — implemented, live-verification pending)
- [x] Task 4: Edit mode — bind, populate, validate, and save via `updateCustomer`
- [x] Task 5: Create mode — extend the same form to `createCustomer` (required no production
      code — Task 4's `isEditMode` branch already handled it generically; test coverage only)

### Checkpoint: dialog-core Complete

Automated verification (build/lint/test) is done. Live browser verification of both flows is
still outstanding — no browser-automation tool was available in this session. See
`tasks/todo.md`'s checkpoint for what to check.

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
| The existing `customer-form-dialog.spec.ts` stubs `MatDialogRef` as `{ close: (): void => undefined }` | Low | Task 4 must replace this with a spy (`vi.fn()`) so tests can assert what `close` was called with — a mechanical update, not a design risk. |
| `field().value()` inside an async `submission.action`, then `dialogRef.close()` after `firstValueFrom(...)` resolves | Low | Same pattern already proven working in `customer-details.ts`'s dead code and in `login.ts`'s live `submission.action` — porting it, not inventing it. |
| Save-error UX has no existing pattern to match (no snackbar/toast service in the app) | Medium | Architecture Decision 10 above: minimal inline `saveError` text in `mat-dialog-content`. Flag to the human in review — if a toast/snackbar service gets added to the app later, this becomes a follow-up to migrate. |
| `paidUntil` display styling has no dialog precedent (only exists read-only in `customer-details.html`'s Membership card, a full `<mat-card>` section) | Low | Task 4 renders it as a single labeled line near the other fields, not a full card section — the dialog is a compact form, not a details page. Confirm the rendering reads acceptably at runtime during the checkpoint. |

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
4. **`/app/customers/new` still exists and still renders `CustomerDetails` with no `id`** —
   unchanged by Phase 3. Today that shows an empty read-only card whose Edit button opens the
   dialog in create mode (a redundant path, not a broken one). Left as-is, per Open Question 1 —
   resolving it is `dialog-consolidation`'s job (a later module), not this phase's.
5. **`afterClosed()` is still not read anywhere** after Phase 3 — Task 4/5 make the dialog close
   *with* the saved `Customer`, but no caller (`CustomerContainer`, `CustomerDetails`) subscribes
   to `afterClosed()` yet. That wiring is `dialog-consolidation`'s job (see
   `SPEC-dialog-consolidation.md`), deliberately out of scope here so Phase 3 stays testable in
   isolation.

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
