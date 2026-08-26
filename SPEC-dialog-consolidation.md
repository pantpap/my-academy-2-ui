# Spec: `dialog-consolidation`

Part of the [Customer Edit Dialog Fix capability map](./CAPABILITY-MAP.md). Depends on
`dialog-core`, `dialog-address`, `dialog-sports` — the dialog must fully work before this module
retires the old code path and wires the details page to it.

## Objective

Two things currently coexist in `customer-details.ts` and should not: a dead, never-rendered
`form()` (built with `@angular/forms/signals`, complete with validators and a working
`submission.action`) sitting alongside the working `openEditDialog()` that opens
`CustomerFormDialog`. Once the dialog does everything that dead form was meant to do, delete the
dead code and make the details page actually refresh when the dialog reports a save.

**User:** internal staff who just edited or created a customer via the dialog.
**Success looks like:** closing the dialog after a successful edit immediately updates the
details page in place, and closing it after a successful create immediately refreshes the
customer list — no manual refresh needed either way — and there is exactly one form
implementation for editing a customer, not two.

## Tech Stack

Same as the other FE modules — Angular 21 signals, `rxResource`/`linkedSignal`.

## Commands

```
Dev server: npm start
Build:      npm run build
Tests:      npm test
Lint:       npm run lint
```

## Project Structure

```
src/app/features/customers/customer-details/
  customer-details.ts       → delete dead form()/model/toFormModel/toCustomerPayload/PHONE_PATTERN/
                               hasError/saveSuccess/saveError; update openEditDialog() to read afterClosed()
  customer-details.html     → remove now-unused FormField/FormRoot/MatError bindings if any relied
                               on the deleted code (current template already doesn't render the form
                               — confirm nothing breaks by deleting it)
src/app/features/customers/customer-container/
  customer-container.ts     → addNewCustomer() reads afterClosed() and reloads dataSourceResource
```

## Code Style

```ts
protected openEditDialog() {
  const dialogRef = this.dialog.open(CustomerFormDialog, {
    data: { customer: this.customerDetailsResource.value() },
  });

  dialogRef.afterClosed().subscribe((saved?: CustomerModel) => {
    if (saved) {
      this.activeId.set(saved.id);
      this.customerDetailsResource.reload();
    }
  });
}
```

(Adjust to whatever exact refresh mechanism `rxResource` exposes in the Angular version pinned in
this repo — `reload()` if available, otherwise re-set `activeId` to force a re-fetch, matching
how `routeId`/`activeId` already interact.) Remove the now-dead imports (`form`, `required`,
`minLength`, `maxLength`, `pattern`, `FormField`, `FormRoot`, `ValidationError`, `MatError`,
`firstValueFrom`) from `customer-details.ts` if nothing else in the file uses them after deletion.

`customer-container.ts`'s `addNewCustomer()` gets the same `afterClosed()` treatment, reloading
the list instead of a single detail record:

```ts
addNewCustomer() {
  const dialogRef = this.dialog.open(CustomerFormDialog, { width: '800px', height: '500px' });

  dialogRef.afterClosed().subscribe((saved?: CustomerModel) => {
    if (saved) {
      this.dataSourceResource.reload();
    }
  });
}
```

## Testing Strategy

- Update `customer-details.spec.ts`: after `dialog.open()` returns and `afterClosed()` emits a
  saved customer, assert `customerDetailsResource` reflects the new values (e.g. via the mocked
  `GET /athletes/:id` firing again, or the resource's value updating directly).
- Confirm no spec still exercises the deleted `customerForm`/`hasError`/`saveSuccess`/`saveError`
  — remove or rewrite any that do.
- Full regression: `npm test` — the existing 6 pre-existing unrelated failures (noted in
  `tasks/todo.md`'s checkpoints) should remain the only failures; no new ones introduced.

## Boundaries

- **Always:** verify manually in the dev server that editing a customer and saving updates the
  details page without a manual navigation/refresh, in both the "same page" case (edit,
  no id change) — `activeId` only changes on create, not edit.
- **Ask first:** if deleting the dead code surfaces that some other part of the app actually
  depends on `customer-details.ts`'s exported form/model shape (unlikely, but verify with a
  repo-wide reference search before deleting).
- **Never:** remove `customerDetailsResource`, `routeId`, `activeId`, or the read-only display
  card/Membership card markup — those stay exactly as they are, only the dead form-building code
  goes.

## Success Criteria

- `customer-details.ts` no longer contains `form()`, `model`, `toFormModel`, `toCustomerPayload`,
  `formatDateForApi`, `PHONE_PATTERN`, `hasError`, `saveSuccess`, `saveError`, or their now-unused
  imports.
- `openEditDialog()` subscribes to `afterClosed()` and refreshes the displayed customer when a
  save occurred; does nothing when the dialog was cancelled (`saved` is `undefined`).
- `customer-container.ts`'s `addNewCustomer()` subscribes to `afterClosed()` and reloads
  `dataSourceResource` when a customer was created; does nothing when cancelled.
- `npm run build`, `npm run lint`, `npm test` all pass, with no new test failures beyond the
  documented pre-existing ones.
- Manual check: edit a customer's phone number via the dialog, save, confirm the details page
  shows the new number immediately with no manual reload. Create a new customer via the list
  page's "+ New" button, confirm it appears in the list immediately with no manual reload.

## Open Questions

None — resolved during spec review: creating a customer refreshes the list (see Success
Criteria above).
