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

Same as `dialog-core` — Angular 21, `@angular/forms/signals`, Angular Material 3 (`mat-select`
with `multiple`, or `mat-selection-list` — pick whichever the existing form already uses
elsewhere in the app for a multi-select field; there is no precedent yet, so this decision is
this module's to make and should follow the simplest Material pattern that fits the signal-forms
`FormField` binding).

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

New service follows `Customer`'s existing service pattern exactly (`src/app/shared/services/customer/customer.ts`):

```ts
@Injectable({ providedIn: 'root' })
export class Sports {
  private readonly httpService = inject(Http);
  private readonly localStorageService = inject(LocalStorage);

  readonly organizationId = signal(this.localStorageService.getItem(ORGANIZATION).id);

  getSports() {
    return this.httpService.get<Sport[]>(SPORTS_API, { organizationId: this.organizationId() });
  }
}
```

Fetch the sports list with an `rxResource` in the dialog component (same pattern as
`customer-details.ts`'s `customerDetailsResource`), not a manual subscription. Extend
`CustomerFormModel`/`toFormModel`/`toCustomerPayload` from `dialog-core` with `sportIds:
number[]`, sourced from `customer?.sports.map(s => s.id) ?? []`.

## Testing Strategy

- New `sports.spec.ts` for the service, mirroring `customer.spec.ts`'s HTTP-mocking pattern
  (`HttpTestingController`).
- Extend `customer-form-dialog.spec.ts`: the multi-select is pre-checked with the customer's
  current `sports` in edit mode; empty in create mode; saving includes `sportIds` in the payload;
  the available-sports list comes from the mocked `GET /sports` response.

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
- Saving sends `sportIds` in the payload; the backend's existing enrollment logic applies it
  (verified via a real save in the running dev server, confirming the details page's Membership
  card reflects the change after `dialog-consolidation` wires up the refresh).
- `npm run build`, `npm run lint`, `npm test` all pass.

## Open Questions

- Exact Material multi-select component (`mat-select multiple` vs. `mat-selection-list`) is left
  to implementation-time judgment — no existing precedent in this codebase to match, so pick the
  one that binds most simply to `@angular/forms/signals`' `FormField`, and note the choice in the
  PR for the human to review.
