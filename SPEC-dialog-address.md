# Spec: `dialog-address`

Part of the [Customer Edit Dialog Fix capability map](./CAPABILITY-MAP.md). Depends on
`backend-address` (needs the API to accept/return the fields) and `dialog-core` (needs a working
form to extend).

## Objective

Add address to the customer edit dialog — the capability the user originally asked for. Add
`street`, `city`, `postalCode`, `country` as new editable fields alongside the existing 5.

**User:** internal staff editing a customer.
**Success looks like:** the dialog has 4 new address inputs; editing them and saving persists via
the API added in `backend-address`; an existing customer with no address shows the fields empty
without error.

## Tech Stack

Same as `dialog-core` — Angular 21, `@angular/forms/signals`, Angular Material 3.

## Commands

Same as `dialog-core`:
```
Dev server: npm start
Build:      npm run build
Tests:      npm test
Lint:       npm run lint
```

## Project Structure

```
src/app/common/interfaces/customer.ts             → add street?, city?, postalCode?, country? to Customer
src/app/features/customers/customer-form-dialog/
  customer-form-dialog.ts                          → extend CustomerFormModel, toFormModel, toCustomerPayload
  customer-form-dialog.html                         → add 4 mat-form-field inputs
public/i18n/en.json, public/i18n/el.json           → new customerDetails.* label keys (see below)
```

## Code Style

Extend the existing model/mapping functions from `dialog-core`, don't create parallel ones:

```ts
interface CustomerFormModel {
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  gender: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

function toFormModel(customer?: Customer): CustomerFormModel {
  return {
    // ...existing fields
    street: customer?.street ?? '',
    city: customer?.city ?? '',
    postalCode: customer?.postalCode ?? '',
    country: customer?.country ?? '',
  };
}
```

No validators required on these 4 fields (backend treats them as fully optional — see
`backend-address`). Template fields follow the existing `mat-form-field` pattern:

```html
<mat-form-field>
  <mat-label>{{ translate('customerDetails.streetLabel') }}</mat-label>
  <input matInput [field]="customerForm.street" />
</mat-form-field>
```

New i18n keys needed under `customerDetails` in both `en.json` and `el.json`: `streetLabel`,
`cityLabel`, `postalCodeLabel`, `countryLabel`. Follow the existing flat-key, per-feature-prefix
convention (`AGENTS.md` → i18n section).

## Testing Strategy

- Extend `customer-form-dialog.spec.ts`: edit mode populates the 4 address inputs from
  `data.customer`; an edit-mode customer with no address data shows them empty (no `undefined` in
  the DOM); Save includes the 4 fields in the `updateCustomer`/`createCustomer` payload.
- No new validation to test — confirm submission succeeds with all 4 fields blank.

## Boundaries

- **Always:** keep the 4 fields optional/unvalidated in the FE form, matching the backend's
  optional columns. Reuse `dialog-core`'s `form()`/`toFormModel`/`toCustomerPayload` — extend them
  in place, don't fork a second form.
- **Ask first:** changing the field grouping/layout (e.g. a separate "Address" section vs. inline
  in the existing grid) if it meaningfully changes the dialog's visual structure.
- **Never:** add validation/required rules to address fields without confirming with the user
  first (existing customers have none — a required rule would block saving them); modify the
  `Customer` interface's non-address fields; touch `dialog-sports`.

## Success Criteria

- `Customer` interface has `street?`, `city?`, `postalCode?`, `country?: string | null`.
- Dialog shows 4 new address inputs, populated from `data.customer` in edit mode, empty in create
  mode.
- Saving includes whichever address fields were filled in the payload sent to
  `createCustomer`/`updateCustomer`.
- `en.json`/`el.json` have the 4 new label keys in both languages.
- `npm run build`, `npm run lint`, `npm test` all pass.
- Manual check: edit a customer, fill in an address, save, reopen the dialog — the address
  persists and re-populates.

## Open Questions

- None — depends only on `backend-address` landing first with the field names/shape as specced
  there (`street`, `city`, `postalCode`, `country`, all optional strings).
