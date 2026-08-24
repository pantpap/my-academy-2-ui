# TODO: Customer Form Dialog

Plan: [`tasks/plan.md`](./plan.md). Do not start until the plan is approved.

---

## Phase 1: Foundation

## Task 1: Create the `CustomerFormDialog` component with the form markup

**Description:** Add a standalone Material dialog component under
`src/app/features/customers/customer-form-dialog/` containing the customer form's HTML — the
five fields, a title that switches on create/edit, and Cancel/Save actions. The component class
stays minimal: read the optional injected customer from `MAT_DIALOG_DATA` and derive
`isEditMode`. **No `form()`, no validators, no bindings, no submit handler** — that layer is the
human's.

**Acceptance criteria:**
- [ ] `CustomerFormDialog` is a standalone `OnPush` component, selector `app-customer-form-dialog`, following the repo's no-`.component`-infix filename convention (`customer-form-dialog.ts` / `.html` / `.scss` / `.spec.ts`).
- [ ] Template uses `mat-dialog-title`, `<mat-dialog-content>`, `<mat-dialog-actions>`, with `*transloco="let translate"` at the root; title reads `customerDetails.editTitle` when a customer was passed and `customerDetails.createTitle` otherwise.
- [ ] Content renders exactly five `<mat-form-field>` blocks — `firstName`, `lastName`, `birthDate` (`matDatepicker` + `mat-datepicker-toggle` in `matSuffix`), `gender` (text `matInput`), `phone` — labelled from the existing `customerDetails.*Label` keys, in that order. Inputs carry **no value bindings**.
- [ ] Actions row has Cancel (`mat-button`, `mat-dialog-close`, `common.cancel`) and Save (`mat-flat-button`, `common.save`); Save has **no** `(click)` handler yet.
- [ ] `data` is read with `inject(MAT_DIALOG_DATA, { optional: true })` and typed by an exported `CustomerFormDialogData { customer?: Customer }` interface, so opening with no data does not throw.
- [ ] Material symbols are imported individually (`MatDialogTitle`, `MatDialogContent`, …), not as modules — per `AGENTS.md`.
- [ ] **No translation files are modified** — every key already exists in `en.json` and `el.json`.

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Lint clean, including template accessibility rules: `npm run lint`
- [ ] Spec passes: `npm test` — a `should create` spec using `TestBed` with `CustomerFormDialog`, `TranslocoTestingModule`, and `{ provide: MAT_DIALOG_DATA, useValue: {} }` + a `MatDialogRef` stub, matching the style of `customer-list.spec.ts`.
- [ ] Manual check: none yet — nothing opens it until Task 2.

**Dependencies:** None

**Files likely touched:**
- `src/app/features/customers/customer-form-dialog/customer-form-dialog.ts` (new)
- `src/app/features/customers/customer-form-dialog/customer-form-dialog.html` (new)
- `src/app/features/customers/customer-form-dialog/customer-form-dialog.scss` (new)
- `src/app/features/customers/customer-form-dialog/customer-form-dialog.spec.ts` (new)

**Estimated scope:** Small (4 new files, no existing file modified)

---

## Checkpoint: Foundation

- [ ] `npm run build` succeeds
- [ ] `npm run lint` reports no new errors
- [ ] `npm test` passes
- [ ] No existing file was modified by Task 1
- [ ] Review the rendered field markup with the human before wiring entry points

---

## Phase 2: Entry Points

> Tasks 2 and 3 are independent. Either order; parallelizable.

## Task 2: Plus button opens the dialog in create mode

**Description:** Change `CustomerContainer.addNewCustomer()` from navigating to
`/app/customers/new` to opening `CustomerFormDialog` with no data. The template's button is
already correct and does not change.

**Acceptance criteria:**
- [ ] `addNewCustomer()` calls `MatDialog.open(CustomerFormDialog)` — no `data`, so the dialog titles itself `customerDetails.createTitle`.
- [ ] The `inject(Router)` field and the `@angular/router` import are removed from `customer-container.ts` if nothing else uses them.
- [ ] `customer-container.html` is unchanged.
- [ ] `afterClosed()` is left unhandled — the list is not refreshed (form logic is the human's).

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Lint clean — in particular no unused `Router` import: `npm run lint`
- [ ] Existing spec still passes: `npx vitest run src/app/features/customers/customer-container/customer-container.spec.ts` (a `MatDialog` stub may need providing)
- [ ] Manual check: `npm start` → `/app/customers` → click **Add**. The dialog opens over the table with the title "New Customer", five empty fields, Cancel + Save. The URL does **not** change to `/app/customers/new`. Cancel and the backdrop both close it. Re-run with the language toggled to `el` and confirm the Greek labels render.

**Dependencies:** Task 1

**Files likely touched:**
- `src/app/features/customers/customer-container/customer-container.ts`

**Estimated scope:** Small (1 file)

---

## Task 3: Details-page edit button opens the dialog in edit mode

**Description:** Wire the currently dead edit button on the customer details page
(`customer-details.html:24`) to open the same `CustomerFormDialog`, passing the loaded customer
as dialog data so the dialog renders its edit title.

**Acceptance criteria:**
- [ ] The button gets a `(click)` handler calling a new `openEditDialog()` on `CustomerDetails`.
- [ ] `openEditDialog()` opens `CustomerFormDialog` with `data: { customer: this.customerDetailsResource.value() }`, so the title reads `customerDetails.editTitle`.
- [ ] The button is a no-op while the customer is still loading — either guard inside the handler or `[disabled]` on the button while `customerDetailsResource.isLoading()`.
- [ ] The page's existing inline signal form, resource, and save flow are **not** touched or removed.
- [ ] `afterClosed()` is left unhandled — the detail resource is not refreshed.

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Lint clean: `npm run lint`
- [ ] Existing spec still passes: `npx vitest run src/app/features/customers/customer-details/customer-details.spec.ts` (a `MatDialog` stub may need providing)
- [ ] Manual check: `npm start` → `/app/customers` → click a row's pencil icon (still navigates to the detail page) → click **Edit**. The dialog opens with the title "Edit Customer" and the same five fields. Confirm it is visibly the *same* dialog as Task 2's, differing only in title.

**Dependencies:** Task 1

**Files likely touched:**
- `src/app/features/customers/customer-details/customer-details.ts`
- `src/app/features/customers/customer-details/customer-details.html`

**Estimated scope:** Small (2 files)

---

## Checkpoint: Complete

- [ ] `npm run build`, `npm run lint`, `npm test` all pass
- [ ] Both entry points open the identical dialog; only the title differs
- [ ] `en.json` and `el.json` are untouched, and both languages render correctly in the dialog
- [ ] `customer-routes.ts` and `customer-list.ts` are untouched
- [ ] Open Questions 1–3 in `tasks/plan.md` are answered or explicitly deferred
- [ ] Handed to the human to implement the form logic
