# TODO: Customer Form Dialog

Plan: [`tasks/plan.md`](./plan.md). Do not start until the plan is approved.

Phases 1–2 below are done. Phase 3 (Tasks 4–5) is new — the `dialog-core` module from
[`../CAPABILITY-MAP.md`](../CAPABILITY-MAP.md) / [`../SPEC-dialog-core.md`](../SPEC-dialog-core.md).
It is awaiting human review; do not start until approved.

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

---

## Phase 3: Bind, Validate, Save

## Task 4: Edit mode — bind, populate, validate, and save via `updateCustomer`

**Description:** Make `CustomerFormDialog` a real signal-form for its 5 existing fields plus a
read-only `paidUntil` display, ported from the dead `form()` already sitting unused in
`customer-details.ts` (see Plan §Phase 3 Architecture Decisions 7–11). This task's scope is
**edit mode only** — the dialog is always opened with `data.customer` set in every case this
task verifies. Create mode (`data.customer` undefined) is Task 5.

**Acceptance criteria:**
- [x] `customer-form-dialog.ts` defines `CustomerFormModel` (`firstName`, `lastName`,
      `birthDate: Date | null`, `gender`, `phone`), `toFormModel`, `formatDateForApi`, and
      `toCustomerPayload` — same shape and rules as `customer-details.ts`'s dead versions, not
      new ones.
- [x] `protected readonly model = signal<CustomerFormModel>(toFormModel(this.data?.customer));`
      and `protected readonly customerForm = form(this.model, (customer) => { ... }, { submission: { action: ... } })`
      with the same validators as `customer-details.ts`: `required`/`minLength(2)`/`maxLength(50)`
      on `firstName`/`lastName`, `required` on `birthDate`, `required`/`maxLength(30)` on
      `gender`, `required`/`pattern(PHONE_PATTERN)` on `phone`.
- [x] `customer-form-dialog.html`'s `<form>` gets `[formRoot]="customerForm"`. `firstName`,
      `lastName`, `gender`, `phone` bind via `[formField]="customerForm.<name>"` (confirmed
      correct directive name — `login.html` uses this, singular). **`birthDate` is the
      exception:** `MatDatepickerInput` implements only the old `ControlValueAccessor`, not the
      new `FormValueControl` interface `[formField]` requires (confirmed against the installed
      `@angular/material` types — no datepicker+signal-forms example exists anywhere, including
      in Angular's own docs, which document `Date` support only for native `<input type="date">`).
      Bind `birthDate` manually instead, using `MatDatepickerInput`'s own plain `[value]`/
      `(dateChange)` API (confirmed present on `MatDatepickerInputBase`) directly against the
      `model` signal: `[value]="model().birthDate"` and
      `(dateChange)="model.update(m => ({ ...m, birthDate: $event.value }))"`. This still
      participates in `customerForm`'s validation (`required(customer.birthDate)`,
      `customerForm.birthDate().errors()`) because `form()` treats `model` as its single source
      of truth regardless of which code path writes to it — confirmed via the signals-forms docs
      ("form uses the given model as the source of truth ... updating the value on a FieldState
      updates the originally passed-in model as well", i.e. the reverse is equally true and is
      the mechanism `[formField]` itself relies on). Each `mat-form-field` gets a `mat-error`
      block per validation kind, following `login.html`'s `hasError(...)` pattern (the dialog
      needs its own `hasError` method, copied from `login.ts`/`customer-details.ts`). **One more
      discovery while implementing:** the Angular compiler rejects a plain `name` attribute on
      any element carrying `[formField]` (`NG8022`) — the 4 `[formField]`-bound inputs lost their
      `name` attrs; `customer-form-dialog.spec.ts` locates them by rendered order instead
      (`birthDate` keeps its `name` attr, since it isn't `[formField]`-bound).
- [x] Opening the dialog with `data: { customer }` populates all 5 inputs with that customer's
      current values (including `birthDate` as a real `Date`, not the raw ISO string).
- [x] A read-only `paidUntil` line renders near the fields (plain text, not a form control),
      reading `data.customer.paidUntil` — per Plan Architecture Decision 11, not part of
      `CustomerFormModel`/`toCustomerPayload`.
- [x] The Save button becomes `type="submit"` (inside the `[formRoot]` form), replacing its
      current no-op `type="button"`; it is `[disabled]="customerForm().invalid()"`.
- [x] Submitting a valid edit calls `this.customerService.updateCustomer(this.data.customer.id, payload)`
      via `firstValueFrom`, then `this.dialogRef.close(saved)` — inject
      `MatDialogRef<CustomerFormDialog, Customer>` for this.
- [x] A failed `updateCustomer` call (e.g. mocked HTTP error) sets a `saveError` signal, rendered
      as inline text in `mat-dialog-content`; the dialog does **not** close, so the user can
      retry.
- [x] Required-field validation errors block submission and render inline (`mat-error`, matching
      `login.html`'s conditional-error pattern) — tested directly. The phone-pattern validator
      and its `mat-error` branch are implemented identically (same `hasError(...)` mechanism) but
      have no dedicated test of their own; only the required-field path is test-covered.

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Lint clean: `npm run lint`
- [x] `customer-form-dialog.spec.ts` updated: the `MatDialogRef` test stub becomes a spy
      (`{ provide: MatDialogRef, useValue: { close: vi.fn() } }`) so tests can assert what it was
      called with; the existing "should render exactly five form fields" assertion still passes
      (field count is unchanged, only bindings are added); new specs cover — edit mode populates
      all 5 inputs + `paidUntil` from `data.customer`; submitting a valid edit calls
      `updateCustomer` with the customer's `id` and the mapped payload, then `dialogRef.close`
      with the resolved value; a required-field error blocks submission and shows a `mat-error`;
      a mocked `updateCustomer` failure sets the inline error text and does not call `close`.
- [x] `npm test` — 55 passed (up from 47 on the pre-Task-4 baseline, confirmed by stashing and
      re-running), same 7 pre-existing failing files on both baseline and after, none newly
      introduced.
- [ ] **Manual check: NOT performed.** No browser-automation tool (Chrome DevTools MCP,
      claude-in-chrome) was available in this session to drive the running dev server
      (`localhost:4200`, already up) and inspect the Network tab. Someone should verify live:
      edit a real customer's phone number via the dialog, save, confirm `PUT /athletes/:id`
      fires with the new value and the dialog closes.

**Dependencies:** Task 1 (dialog shell), Task 3 (edit entry point to exercise this against)

**Files likely touched:**
- `src/app/features/customers/customer-form-dialog/customer-form-dialog.ts`
- `src/app/features/customers/customer-form-dialog/customer-form-dialog.html`
- `src/app/features/customers/customer-form-dialog/customer-form-dialog.spec.ts`

**Estimated scope:** Medium (3 files, porting existing logic — not new design)

---

## Task 5: Create mode — extend the same form to `createCustomer`

**Description:** Extend Task 4's form to also work when the dialog is opened with no
`data.customer` (create mode) — `toFormModel(undefined)` already returns an empty model per its
Task-4 signature, so this task is mostly about verifying and locking in behavior that likely
already falls out of Task 4's code, not writing new binding logic.

**Acceptance criteria:**
- [ ] Opening the dialog with no `data` (or `data: {}`) shows all 5 inputs empty and shows no
      `paidUntil` line (or shows it blank/omitted — pick whichever reads cleaner and confirm
      with the human in review; `data.customer` is `undefined` so there is no value to show).
- [ ] Submitting a valid create calls `this.customerService.createCustomer(payload)` (not
      `updateCustomer`) via `firstValueFrom`, then `this.dialogRef.close(saved)` with the created
      `Customer` (including its server-assigned `id`).
- [ ] The same validation rules from Task 4 apply unchanged in create mode.
- [ ] A failed `createCustomer` call sets the same inline `saveError` text as Task 4's failure
      path; the dialog does not close.

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Lint clean: `npm run lint`
- [ ] `customer-form-dialog.spec.ts`: new specs cover — create mode starts with all 5 inputs
      empty; submitting valid input calls `createCustomer` (and asserts `updateCustomer` was
      **not** called) then closes with the created customer; a mocked `createCustomer` failure
      sets the inline error and does not close.
- [ ] `npm test` — no new failures beyond the pre-existing, documented ones.
- [ ] Manual check: run `npm start`, navigate to `/app/customers`, click the "+ New" button, fill
      in all 5 fields, click Save, confirm via the Network tab that `POST /athletes` fired with
      the entered values and the dialog closed.

**Dependencies:** Task 4 (reuses its `form()`/model/save infrastructure), Task 2 (create entry
point to exercise this against)

**Files likely touched:**
- `src/app/features/customers/customer-form-dialog/customer-form-dialog.ts`
- `src/app/features/customers/customer-form-dialog/customer-form-dialog.spec.ts`

**Estimated scope:** Small (mostly test coverage + the `isEditMode` branch in the submission
action; the binding/validation layer is already in place from Task 4)

---

## Checkpoint: dialog-core Complete

- [ ] `npm run build`, `npm run lint`, `npm test` all pass (only the pre-existing, documented
      failures remain; none newly introduced)
- [ ] Both edit and create flows verified live against the running dev server and a real backend
      save (Network tab confirms the correct HTTP method/body in each case)
- [ ] `customer-form-dialog.spec.ts` has no remaining assertions describing the old unbound-input
      behavior (e.g. the five-fields count assertion still holds, but nothing asserts fields lack
      bindings)
- [ ] Neither `customer-details.ts`'s dead `form()` nor `customer-container.ts`'s
      `addNewCustomer()` was touched — both callers still don't read `afterClosed()`; that is
      explicitly `dialog-consolidation`'s job, not this checkpoint's
- [ ] Review with the human before starting `dialog-address` / `dialog-sports` (both extend this
      same `form()`/`toFormModel`/`toCustomerPayload`) or `dialog-consolidation`
