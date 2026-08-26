# Spec: `dialog-core`

Part of the [Customer Edit Dialog Fix capability map](./CAPABILITY-MAP.md). No dependencies —
can be built in parallel with `backend-address`.

## Objective

`CustomerFormDialog` currently renders 5 unbound `<input>` elements with no `formControlName`/
signal-forms binding, never populates them from the passed-in customer in edit mode, and its Save
button has no click handler — nothing is ever saved. This module makes the dialog a genuinely
functional form for its existing 5 fields (`firstName`, `lastName`, `birthDate`, `gender`,
`phone`), plus shows `paidUntil` as read-only.

**User:** internal staff editing or creating a customer via the admin app.
**Success looks like:** opening the dialog in edit mode shows the customer's current values;
editing and clicking Save persists the change via the API and closes the dialog with the saved
customer; opening in create mode with empty fields and clicking Save creates a new customer the
same way.

**Reuse note:** `customer-details.ts` already contains an unused `form()` built with
`@angular/forms/signals` — validators, a `submission.action` calling `createCustomer`/
`updateCustomer`, `toFormModel`/`toCustomerPayload` mapping — that is never rendered in its
template (dead code from before the dialog approach was adopted). Port this logic into the
dialog rather than re-deriving it; `dialog-consolidation` deletes the original afterward.

## Tech Stack

Angular 21 standalone components, Angular Material 3, `@angular/forms/signals` (not
`ReactiveFormsModule`), Vitest. See `AGENTS.md` at the repo root for full conventions.

## Commands

```
Dev server: npm start           # http://localhost:4200
Build:      npm run build
Tests:      npm test            # Vitest
Lint:       npm run lint        # ESLint + Prettier, incl. template a11y rules
```

## Project Structure

```
src/app/features/customers/customer-form-dialog/
  customer-form-dialog.ts        → add form(), model signal, submission.action
  customer-form-dialog.html      → bind fields via FormField/FormRoot directives
  customer-form-dialog.spec.ts   → update the existing "5 unbound fields" assertions
```

No new files. Existing entry points (`customer-container.ts`'s `addNewCustomer()`,
`customer-details.ts`'s `openEditDialog()`) are unchanged by this module — they already open the
dialog correctly; only reading the closed result is added, and only in `dialog-consolidation`.

## Code Style

Port the pattern already in `customer-details.ts` (lines 17–156) directly — same validators, same
`toFormModel`/`toCustomerPayload`/`formatDateForApi`/`PHONE_PATTERN` shape, same
`submission.action` structure:

```ts
protected readonly model = signal<CustomerFormModel>(toFormModel(this.data?.customer));

protected readonly customerForm = form(
  this.model,
  (customer) => {
    required(customer.firstName);
    minLength(customer.firstName, 2);
    maxLength(customer.firstName, 50);
    // ...lastName, birthDate, gender, phone — identical rules to customer-details.ts
  },
  {
    submission: {
      action: async (field) => {
        const value = field().value();
        const payload = toCustomerPayload(value);
        const saved = this.isEditMode
          ? await firstValueFrom(this.customerService.updateCustomer(this.data!.customer!.id, payload))
          : await firstValueFrom(this.customerService.createCustomer(payload));
        this.dialogRef.close(saved);
        return undefined;
      },
    },
  },
);
```

Template binds each field via `[field]="customerForm.firstName"` + `FormField` (see
`customer-details.html`... except that file's markup doesn't actually apply the binding either —
follow the `FormField`/`FormRoot` directive usage documented in `AGENTS.md` and
`src/app/features/auth/pages/login/login.ts`, the canonical signal-forms example). Keep the
existing `grid grid-cols-2 gap-4 pt-2` layout and the 5 fields in their current order; add a 6th,
read-only `paidUntil` display (not a form field — plain text, matching the read-only style already
used in `customer-details.html`'s Membership card).

## Testing Strategy

- Vitest + `TestBed`, following `customer-form-dialog.spec.ts`'s existing structure.
- Cover: edit mode populates all 5 inputs with the passed-in customer's values; create mode
  starts empty; Save in edit mode calls `updateCustomer(id, payload)` and closes with its result;
  Save in create mode calls `createCustomer(payload)` and closes with its result; validation
  errors (empty required field, invalid phone pattern) block submission and are displayed;
  `paidUntil` renders as read-only text, not an input.
- The dialog's own existing spec currently asserts "exactly five unbound fields" — update that
  assertion to reflect real bindings instead of removing coverage.

## Boundaries

- **Always:** keep the same 5 fields, same validation rules, and same field order as the ported
  `customer-details.ts` logic — don't invent new validation. Close the dialog with
  `MatDialogRef.close(saved)` on success so callers can read the result.
- **Ask first:** changing validation rules or limits (e.g. `minLength`/`maxLength`/phone pattern)
  from what `customer-details.ts` already enforces; changing the dialog's layout/size.
- **Never:** touch `dialog-address` or `dialog-sports` fields (add them in their own modules, not
  here); touch `customer-details.ts` (that's `dialog-consolidation`'s job — this module only adds
  code to the dialog itself); modify `en.json`/`el.json` (no new i18n keys needed — `firstName`
  through `phone` labels, `common.save`/`common.cancel`, and `paidUntilLabel`/`notPaid` all
  already exist).

## Success Criteria

- Opening the dialog in edit mode shows the customer's current `firstName`, `lastName`,
  `birthDate`, `gender`, `phone` values pre-filled, and `paidUntil` read-only.
- Opening in create mode shows all 5 fields empty.
- Editing a field and clicking Save (edit mode) calls `CustomerService.updateCustomer` with the
  mapped payload and the dialog closes, returning the saved `Customer` via `afterClosed()`.
- Filling fields and clicking Save (create mode) calls `CustomerService.createCustomer` and closes
  the same way.
- Required-field and phone-pattern validation errors are shown inline and prevent submission,
  matching `customer-details.ts`'s existing rules.
- `npm run build`, `npm run lint`, `npm test` all pass.
- Manual check in the running dev server: edit an existing customer's phone number, save, confirm
  via the network tab that `PUT /athletes/:id` fired with the new value.

## Open Questions

- None for this module's scope. `dialog-address`/`dialog-sports` extend this same `form()` and
  `toFormModel`/`toCustomerPayload` once this module lands — see their specs for how they hook in.
