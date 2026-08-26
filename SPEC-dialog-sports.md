# Spec: `dialog-sports`

Part of the [Customer Edit Dialog Fix capability map](./CAPABILITY-MAP.md). Depends on
`dialog-core` (needs a working form to extend). No backend change needed — the backend already
accepts `sportIds?: number[]` on `POST`/`PATCH /athletes`.

## Objective

Let staff assign which sport(s) a customer is enrolled in from the edit dialog. Today this is
only visible read-only on the customer details page's Membership card, with no edit path
anywhere.

**User:** internal staff editing a customer's sport enrollment.
**Success looks like:** the dialog shows a multi-select of the organization's available sports,
pre-checked with the customer's current sports in edit mode; saving sends `sportIds` and the
backend's existing delete-and-reinsert logic (`AthletesService.update()`) applies it.

## Tech Stack

Same as `dialog-core` — Angular 21, `@angular/forms/signals`, Angular Material 3.

**Resolved:** `<mat-select multiple>`, bound manually via its own `[value]`/`(selectionChange)`
API directly against the `model` signal — **not** `[formField]`. Verified against the installed
`@angular/forms/signals` source (not assumed): `FormField` only binds to a native form element
(`<input>`/`<select>`/`<textarea>`) or a component implementing the new `FormValueControl`
interface — its own error message says so verbatim. `MatSelect` implements neither (it implements
`ControlValueAccessor` and self-discovers `NgControl` via `inject(NgControl, { self: true })`,
which is a different, older mechanism `FormField` doesn't participate in). This is the same
finding `dialog-core` already made for `MatDatepickerInput` — `mat-select` has the identical
incompatibility, confirmed independently rather than assumed to be the same.

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
src/app/shared/services/sports/sports.ts (new)      → minimal service, GET /sports?organizationId=
src/app/common/constants/endpoints.ts                → add SPORTS_API = 'sports'
src/app/common/interfaces/sport.ts (new)             → { id: number; name: string } — matches Customer.sports' shape
src/app/features/customers/customer-form-dialog/
  customer-form-dialog.ts                            → inject SportsService, extend CustomerFormModel with sportIds
  customer-form-dialog.html                           → add sports multi-select
```

No backend changes — `GET /sports?organizationId=` and `sportIds?: number[]` on
`POST`/`PATCH /athletes` already exist (see the capability map's backend investigation).

## Code Style

New service follows `Customer`'s existing service pattern exactly (`src/app/shared/services/customer/customer.ts`) — implemented as specced, unchanged.

Fetch the sports list with an `rxResource` in the dialog component (same pattern as
`customer-details.ts`'s `customerDetailsResource`), not a manual subscription. Extend
`CustomerFormModel`/`toFormModel`/`toCustomerPayload` from `dialog-core` with `sportIds:
number[]`, sourced from `customer?.sports.map(s => s.id) ?? []` — implemented as specced.

**Discovered while implementing, not originally specced:** `CustomerService.createCustomer`/
`updateCustomer` were typed to accept exactly `Omit<CustomerModel, 'id'>`, which has no room for
`sportIds` (a request-only field — `Customer`'s `sports`/`sportNames` are the *response* shape).
Widened both methods' parameter type to a new exported `CustomerPayload = Omit<CustomerModel,
'id'> & { sportIds?: number[] }` in `customer.ts`. Small, necessary, and the natural place for
it — not scope creep.

## Testing Strategy

- New `sports.spec.ts` for the service. **Correction:** `customer.spec.ts` turned out not to
  actually mock HTTP (it's the same trivial "should be created" boilerplate as most FE service
  specs in this repo — confirmed by reading it, not assumed) — no HTTP-mocking precedent existed
  anywhere in this app. Used Angular's standard `provideHttpClient()` +
  `provideHttpClientTesting()` + `HttpTestingController` instead, which is now this repo's first
  example of that pattern.
- Extended `customer-form-dialog.spec.ts`: multi-select pre-selects the customer's current
  `sports` in edit mode (asserted via the `model` signal and the select's rendered trigger text —
  **not** via querying `mat-option` elements, which only render into a CDK overlay once the panel
  is opened, not eagerly in the DOM); empty in create mode; saving includes `sportIds` in the
  payload; the available-sports list is asserted against `sportsResource.value()` directly, for
  the same CDK-overlay reason.

## Boundaries

- **Always:** send `sportIds` as an array of numbers (matching the existing backend DTO exactly);
  reuse `dialog-core`'s form/payload functions rather than forking them.
- **Ask first:** whether to reuse `customerDetails.sportsLabel` (already exists in i18n) for this
  field's label, or add a distinct key — default to reusing it since it's the same concept.
- **Never:** add a "create new sport" flow inside this dialog (out of scope — sport management is
  a separate feature); touch `dialog-address`; add validation requiring at least one sport (a
  customer with zero sports is valid today, per the read-only "No sports enrolled" copy already
  in `customer-details.html`).

## Success Criteria

- New `Sports` service and `Sport` interface exist, following the `Customer` service's exact
  pattern.
- Dialog shows a multi-select of the organization's sports; in edit mode it's pre-checked with
  the customer's current sport IDs; in create mode, nothing is checked.
- Saving sends `sportIds` in the payload; the backend's existing enrollment logic applies it —
  **not verified live**, no browser-automation tool was available in this session (same gap as
  `dialog-core`). Someone should confirm via the running dev server that saving actually updates
  the details page's Membership card, once `dialog-consolidation` wires up the refresh.
- `npm run build`, `npm run lint`, `npm test` all pass.

## Open Questions

None outstanding. Resolved during implementation: `mat-select multiple`, bound manually (see
Tech Stack above) rather than via `[formField]`.
