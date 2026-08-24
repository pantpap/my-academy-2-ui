# TODO: Customer Form Dialog

Plan: [`tasks/plan.md`](./plan.md). Do not start until the plan is approved.

---

## Phase 1: Foundation

## Task 1: Create the `CustomerFormDialog` component with the form markup ✅ done

**Description:** Add a standalone Material dialog component under
`src/app/features/customers/customer-form-dialog/` containing the customer form's HTML — the
five fields, a title that switches on create/edit, and Cancel/Save actions. The component class
stays minimal: read the optional injected customer from `MAT_DIALOG_DATA` and derive
`isEditMode`. **No `form()`, no validators, no bindings, no submit handler** — that layer is the
human's.

**Acceptance criteria:**
- [x] `CustomerFormDialog` is a standalone `OnPush` component, selector `app-customer-form-dialog`, following the repo's no-`.component`-infix filename convention (`customer-form-dialog.ts` / `.html` / `.scss` / `.spec.ts`).
- [x] Template uses `mat-dialog-title`, `<mat-dialog-content>`, `<mat-dialog-actions>`, with `*transloco="let translate"` at the root; title reads `customerDetails.editTitle` when a customer was passed and `customerDetails.createTitle` otherwise.
- [x] Content renders exactly five `<mat-form-field>` blocks — `firstName`, `lastName`, `birthDate` (`matDatepicker` + `mat-datepicker-toggle` in `matSuffix`), `gender` (text `matInput`), `phone` — labelled from the existing `customerDetails.*Label` keys, in that order. Inputs carry **no value bindings**.
- [x] Actions row has Cancel (`mat-button`, `mat-dialog-close`, `common.cancel`) and Save (`mat-flat-button`, `common.save`); Save has **no** `(click)` handler yet.
- [x] `data` is read with `inject(MAT_DIALOG_DATA, { optional: true })` and typed by an exported `CustomerFormDialogData { customer?: Customer }` interface, so opening with no data does not throw.
- [x] Material symbols are imported individually (`MatDialogTitle`, `MatDialogContent`, …), not as modules — per `AGENTS.md`.
- [x] **No translation files are modified** — every key already exists in `en.json` and `el.json`.

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Lint clean, including template accessibility rules: `npm run lint`
- [x] Spec passes: `npm test` — 6 specs covering create/edit mode, title switching, five rendered fields, and Cancel/Save actions.
- [x] Manual check: none yet — nothing opens it until Task 2.

**Dependencies:** None

**Files likely touched:**
- `src/app/features/customers/customer-form-dialog/customer-form-dialog.ts` (new)
- `src/app/features/customers/customer-form-dialog/customer-form-dialog.html` (new)
- `src/app/features/customers/customer-form-dialog/customer-form-dialog.scss` (new)
- `src/app/features/customers/customer-form-dialog/customer-form-dialog.spec.ts` (new)

**Estimated scope:** Small (4 new files, no existing file modified)

---

## Checkpoint: Foundation

- [x] `npm run build` succeeds
- [x] `npm run lint` reports no new errors (one pre-existing lint error, in `customer-form-dialog.spec.ts`'s own `MatDialogRef` stub, was fixed before commit)
- [x] `npm test` passes (7 pre-existing failing test files, unrelated to this change and not touched by it, remain unchanged — see `git log` on `dev`)
- [x] No existing file was modified by Task 1
- [ ] Review the rendered field markup with the human before wiring entry points

---

## Phase 2: Entry Points

> Tasks 2 and 3 are independent. Either order; parallelizable.

## Task 2: Plus button opens the dialog in create mode ✅ done

**Description:** Change `CustomerContainer.addNewCustomer()` from navigating to
`/app/customers/new` to opening `CustomerFormDialog` with no data. The template's button is
already correct and does not change.

**Acceptance criteria:**
- [x] `addNewCustomer()` calls `MatDialog.open(CustomerFormDialog)` — no `data`, so the dialog titles itself `customerDetails.createTitle`.
- [x] The `inject(Router)` field and the `@angular/router` import are removed from `customer-container.ts` if nothing else uses them.
- [x] `customer-container.html` is unchanged.
- [x] `afterClosed()` is left unhandled — the list is not refreshed (form logic is the human's).

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Lint clean — in particular no unused `Router` import: `npm run lint`
- [x] Existing spec still passes, plus a new spec for the dialog-opening behavior — both needed `TranslocoTestingModule` and seeded `localStorage` added to the spec's `beforeEach` (pre-existing gaps, not previously exercised; see commit).
- [x] Manual check: verified live via the running dev server at `/app/customers`. Dialog opens over the table titled "New Customer" with five empty fields and Cancel/Save; URL stays `/app/customers` (confirmed via `location.pathname`); Cancel closes it; toggling to Greek and reopening shows "Νέος Πελάτης" with Greek labels and "Ακύρωση"/"Αποθήκευση". Note: an `NG0203` console error fires on the *first* lazy-route navigation per page load — reproduces identically on the pre-existing, untouched pencil-icon → `CustomerDetails` navigation, so it's a dev-server artifact unrelated to this change; not something this task should fix.

**Dependencies:** Task 1

**Files likely touched:**
- `src/app/features/customers/customer-container/customer-container.ts`

**Estimated scope:** Small (1 file)

---

## Task 3: Details-page edit button opens the dialog in edit mode ✅ done

**Description:** Wire the currently dead edit button on the customer details page
(`customer-details.html:24`) to open the same `CustomerFormDialog`, passing the loaded customer
as dialog data so the dialog renders its edit title.

**Acceptance criteria:**
- [x] The button gets a `(click)` handler calling a new `openEditDialog()` on `CustomerDetails`.
- [x] `openEditDialog()` opens `CustomerFormDialog` with `data: { customer: this.customerDetailsResource.value() }`, so the title reads `customerDetails.editTitle`.
- [x] The button is a no-op while the customer is still loading — the existing `@if (isLoading()) { ... } @else { ... }` gate already keeps the whole card (and button) out of the DOM during load; added `[disabled]="customerDetailsResource.isLoading()"` as a second guard for the case where the resource re-fetches (e.g. navigating between two `:id` routes) while the previous customer's card is still showing.
- [x] The page's existing inline signal form, resource, and save flow are **not** touched or removed.
- [x] `afterClosed()` is left unhandled — the detail resource is not refreshed.

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Lint clean: `npm run lint`
- [x] Existing spec still passes, plus 2 new specs added: one flushes a mocked HTTP GET (via `HttpTestingController`) and asserts `dialog.open` was called with `{ data: { customer } }`; the other confirms the edit button doesn't render at all while `isLoading()` is true.
- [x] Manual check: verified live via the running dev server. Navigated `/app/customers` → pencil icon → details page → **Επεξεργασία** (Edit, UI was in Greek). Dialog opened titled **"Επεξεργασία Πελάτη"** (Edit Customer) — visibly the same dialog component as Task 2's "Νέος Πελάτης", differing only in title — confirming `MAT_DIALOG_DATA` correctly carried the loaded customer through. Closed via Escape/backdrop click; details page underneath was undisturbed.

**Dependencies:** Task 1

**Files likely touched:**
- `src/app/features/customers/customer-details/customer-details.ts`
- `src/app/features/customers/customer-details/customer-details.html`

**Estimated scope:** Small (2 files)

---

## Checkpoint: Complete

- [x] `npm run build`, `npm run lint`, `npm test` all pass (6 pre-existing, unrelated failures remain — see git history on `dev`; none introduced by this work)
- [x] Both entry points open the identical dialog; only the title differs — confirmed live (Task 2: "New Customer"/"Νέος Πελάτης", Task 3: "Edit Customer"/"Επεξεργασία Πελάτη")
- [x] `en.json` and `el.json` are untouched, and both languages render correctly in the dialog — verified live in both English and Greek
- [x] `customer-routes.ts` and `customer-list.ts` are untouched
- [x] Open Questions 1–3 in `tasks/plan.md`: #3 (row pencil icon) confirmed unchanged, matches the interview answer; #1 (`/new` route) and #2 (`afterClosed()` refresh) remain explicitly deferred to the human, as planned
- [x] Handed to the human to implement the form logic
