# Spec: `payments-season-grid`

Part of the [Payments Season View capability map](./CAPABILITY-MAP-payments-season.md). Depends on
`payments-season-api` (BE) — needs `GET /payments/roster-season?startYear=` and its per-month
`year` field to exist before this can be built end-to-end (can be developed against a stub/mock
response in parallel, but not verified live until the BE endpoint ships).

## 1. Objective

Retype and rewire the existing payments screen (`payments-container` + `payments-grid` +
`payment-form-dialog` + `payment-detail-dialog`, all shipped by the prior
[Payments Screen capability map](./CAPABILITY-MAP-payments.md)) from a calendar-year view
(Jan–Dec, one dropdown of plain years) to a season view (Sep→Jun, one dropdown of season labels
like `"2026-27"`), and retire the `future` cell state — every month in the shown season becomes
payable, not just ones up to today's date.

**Target users:** organization staff recording/reviewing payments, same audience as today.

**Out of scope:** deleting the old calendar-year code path from the BE (see capability map); a
configurable season-start-month; the record/delete dialog's amount-prefill or validation logic;
`customer-list`'s payment column; sorting, search, or pagination behavior added by
`SPEC-payments-grid-material.md` (all three carry over unchanged, just operating over season data
instead of calendar-year data).

## 2. Behavior / Acceptance Criteria

### 2.1 Season selector (replaces the year `<mat-select>`)

- `payments-container.ts`: replace `selectedYear: signal<number>` + `years: number[]` with
  `selectedSeasonStartYear: signal<number>` + a list of season options, each
  `{ startYear: number; label: string }` where `label` is `` `${startYear}-${String(startYear + 1).slice(-2)}` ``
  (e.g. `startYear: 2026` → `"2026-27"`).
- Option range: 5 seasons centered on the default (current ± 2 seasons), mirroring the current
  `YEAR_RANGE = 2` breadth.
- Default `selectedSeasonStartYear` on load, from `today`:
  - Today's month ∈ Sep–Dec (9–12) → `startYear = today.getFullYear()`.
  - Today's month ∈ Jan–Jun (1–6) → `startYear = today.getFullYear() - 1`.
  - Today's month ∈ Jul–Aug (7–8, no season in progress) → `startYear = today.getFullYear()`
    (defaults to the *upcoming* season — flagged as an assumption in the capability map, confirm
    if the opposite, i.e. defaulting to the season that just ended, is wanted instead).
- `payments-container.html`: same `<mat-form-field>` slot as today's year selector, just bound to
  the new signal/options; repurpose the existing `payments.yearLabel` i18n key's *text* to mean
  "Season" (`en`: `"Season"`, `el`: `"Σεζόν"`) rather than adding a new key, since it's the same
  form field.
- `rosterYearResource` (rxResource) → renamed `rosterSeasonResource`, `stream` calls
  `paymentsService.getRosterSeason(startYear)` instead of `getRosterYear(year)`.

### 2.2 New service method

`shared/services/payment/payment.ts` (`Payments`): add

```ts
getRosterSeason(startYear: number) {
  return this.httpService.get<RosterSeasonEntry[]>(`${PAYMENTS_API}/roster-season`, {
    organizationId: this.organizationId(),
    startYear,
  });
}
```

Leave `getRosterYear` in place, unused by this screen after this change but not deleted (matches
the capability map's "don't delete the old endpoint/types" boundary).

### 2.3 New interfaces

`common/interfaces/payment.ts`: add (don't modify or remove `RosterYearEntry`/`RosterYearMonth`)

```ts
export interface RosterSeasonMonth {
  month: number;
  year: number;
  paid: boolean;
  paymentId: number | null;
  amount: number | null;
  paymentDate: string | null;
}

export interface RosterSeasonEntry {
  athleteId: number;
  firstName: string;
  lastName: string;
  months: RosterSeasonMonth[];
}
```

### 2.4 Grid: 10 columns, season order, no `future` state

- `payments-grid.ts`: `roster` input becomes `input.required<RosterSeasonEntry[]>()`. Replace the
  `year: input.required<number>()` + `today: input<Date>()` inputs with a single
  `startYear: input.required<number>()` — the grid derives its own 10 `(month, year)` season
  slots from `startYear` (Sep `startYear` → Jun `startYear + 1`), independent of the roster data
  shape, same way `monthLabels()` derives 12 slots from nothing today.
- `monthLabels()`: returns the 10 season slots in order, each `{ month, year, label }` (label via
  the existing `Intl.DateTimeFormat(locale, { month: 'short' })` pattern, unchanged formatting —
  just a different 10-month set in a different order).
- `displayedColumns()`: unchanged shape (`'name'` + `` `m${month}` `` per slot) — column ids stay
  unique because no calendar month repeats within one season.
- `cell-state.ts`: collapse to

  ```ts
  export type CellState = 'paid' | 'due';

  export function cellState(paid: boolean): CellState {
    return paid ? 'paid' : 'due';
  }
  ```

  Every unpaid month in the shown season is `due` and clickable, regardless of whether it's
  chronologically past or future relative to today — this was an explicit decision (see capability
  map), not an oversight. `payments-grid.html`'s `@default` branch (the non-clickable `<span>` for
  `future`) is removed; `@case ('due')`'s clickable `<button>` becomes the only non-paid branch
  (a plain `@if (stateFor(month) === 'paid') { … } @else { … due button … }` is fine, or keep the
  `@switch` with just two cases — either way, no unclickable cell state should remain in the
  template).
- `cellAriaLabel()`: uses `month.year` (the month's own year) instead of `this.year()` — needed
  since a season spans two calendar years and each cell must announce its actual year, not the
  season's start year.
- `stateFor()`: `cellState(month.paid)` — drops the `selectedYear`/`today` args entirely.
- Sticky name column, `data-cell-state` attribute, `cellActivated` output contract, paid/total
  summary (still computed over the **full unfiltered season roster**, unaffected by search/page) —
  all unchanged from `SPEC-payments-grid-material.md`.

### 2.5 Dialogs: per-month `year`, not one shared `year`

This is the one genuinely new wrinkle a season view introduces: the record-payment dialog lets
staff select **multiple months in one sitting**, and those months can now span two different
calendar years (e.g. selecting both November and the following January). Today's
`PaymentFormDialogData.year: number` (one shared year for every selected month) can no longer be
correct.

- `PaymentFormDialogData`: replace `year: number; months: RosterYearMonth[]` with
  `initialYear: number; months: RosterSeasonMonth[]` (keep `initialMonth: number` as-is — still
  which month the clicked cell was).
- `MonthToggle` interface: add `year: number`.
- `buildMonthToggles()`: carry `year: month.year` per toggle from `this.data.months`; the
  `selected` initializer becomes
  `month.paid || (month.month === this.data.initialMonth && month.year === this.data.initialYear)`
  (matching on both month *and* year, since month numbers alone are no longer unique-enough — two
  different toggles could theoretically share a month number across... actually within one season
  each month number is unique, but matching both is more correct and costs nothing).
- `monthsToSubmit` / `selectedMonths`: change from `number[]` to `{ month: number; year: number }[]`.
- `save()`: for each entry in `monthsToSubmit()`, use `coveredMonth: entry.month, coveredYear: entry.year`
  in the `createPayment()` call — **not** a single `this.data.year` shared across the loop.
- `duplicateError`/`savedMonthLabels` messaging: already interpolates `{{month}} {{year}}` per
  failure — just source `year` from the specific failed month's `year`, not a container-wide
  value.
- `payments-container.ts` `openRecordDialog()`: pass `initialYear: month.year` (from the clicked
  `RosterSeasonMonth`) instead of `year: this.selectedYear()`.
- `PaymentDetailDialogData.payment: RosterYearMonth` → `RosterSeasonMonth`. No behavioral change —
  detail/delete only ever needs `paymentId`/`amount`/`paymentDate`, never `year`.
- `payment-form-dialog.html` / `payment-detail-dialog.html`: no template changes are expected
  (verified: neither currently references `year` in the template) — confirm this still holds once
  the `.ts` changes above land, since a compile error would surface immediately if not.

### 2.6 i18n

- `en.json` / `el.json`, both under `payments.*`:
  - `yearLabel` text → `"Season"` / `"Σεζόν"` (key name unchanged, see 2.1).
  - `stateLabels.future` → remove (no longer emitted by `cell-state.ts`).
  - No other key changes — `cellAriaLabel`, `duplicateError` etc. already parameterize `{{year}}`
    generically and don't need new keys, just a different source value per 2.4/2.5 above.

## 3. Tech Stack / Constraints

Angular 21, standalone components, `ChangeDetectionStrategy.OnPush`, signals-based state
(`signal`/`computed`/`input`), Transloco, Angular Material — all unchanged project conventions,
matching `SPEC-payments-grid-material.md` and the original `payments-grid` spec content in
`tasks/plan.md`. No new npm dependencies.

## 4. Project Structure (files touched)

```
src/app/common/interfaces/payment.ts             # + RosterSeasonMonth, RosterSeasonEntry
src/app/shared/services/payment/payment.ts       # + getRosterSeason()
src/app/features/payments/
  payments-container/
    payments-container.ts      # season signal/options/default, rosterSeasonResource
    payments-container.html    # season select bound to new signal/options
    payments-container.spec.ts
  payments-grid/
    payments-grid.ts           # startYear input replaces year+today; season month derivation
    payments-grid.html         # drop the non-clickable `future` branch
    payments-grid.spec.ts
    cell-state.ts              # collapse to paid|due, drop year/today params
  payment-form-dialog/
    payment-form-dialog.ts     # per-month year throughout (data, toggles, save())
    payment-form-dialog.spec.ts
  payment-detail-dialog/
    payment-detail-dialog.ts   # RosterSeasonMonth type only
    payment-detail-dialog.spec.ts
public/i18n/en.json
public/i18n/el.json
```

No changes to `payment-routes.ts` or the sidebar nav entry.

## 5. Testing Strategy

Run via `ng test`. Extend existing spec files rather than adding new ones (matching
`SPEC-payments-grid-material.md`'s convention).

Acceptance criteria to cover:
- `cell-state.ts`: `cellState(true)` → `'paid'`; `cellState(false)` → `'due'` — no third case
  reachable, no `today`/`year` params accepted (a type-level check, not just a runtime one).
- `payments-grid`: given a `startYear`, `monthLabels()`/`displayedColumns()` produce exactly the
  10 slots in Sep→Jun order (assert both the `month` and `year` of each slot, especially across
  the Dec→Jan boundary).
- `payments-grid`: a month with `paid: false` always renders as a clickable `due` button — assert
  no cell ever renders the old non-clickable `future` markup, including for a month later than
  `today`.
- `payments-grid`: `cellAriaLabel()` reports the month's own `year` (test with one Sep-side and
  one Jun-side month in the same roster entry, confirm the year differs correctly).
- `payments-container`: default `selectedSeasonStartYear` is computed correctly for a mocked
  `today` in each of the three ranges (Sep–Dec, Jan–Jun, Jul–Aug) — three separate test cases.
- `payments-container`: season option `label`s render as `"YYYY-YY"` (e.g. `"2026-27"`).
- `payment-form-dialog`: selecting a November toggle and a January toggle from a `months` array
  where they carry different `year`s, then saving, calls `createPayment` twice with the correct
  `coveredYear` **per call** (not the same year both times) — this is the single most important
  new test in this module, since it's the exact bug this spec exists to prevent.
- `payment-form-dialog`: a 409 (duplicate) failure on the second of two cross-year months reports
  the correct month **and year** in the error message.
- Existing pagination/search tests from `SPEC-payments-grid-material.md` continue to pass
  unmodified in spirit (same behavior, now over `RosterSeasonEntry[]`/10 columns instead of
  `RosterYearEntry[]`/12) — update their fixtures' shape, not their assertions' intent.

Definition of Done (per `references/definition-of-done.md`): `ng test` passes, no regressions in
payments-related specs, verified in the running app (start dev server, open `/app/payments`,
confirm the season selector, all 10 columns are clickable including future-dated ones, and a
cross-year multi-month payment save posts the correct year for each month) before marking done —
depends on `payments-season-api` being live (see capability map's build order).

## 6. Boundaries

**Always do:**
- Preserve `cellActivated`'s output contract, `data-cell-state` attribute, and aria-label pattern
  — unchanged from the prior spec, only the state vocabulary shrinks (no more `future`).
- Source each `createPayment()` call's `coveredYear` from that specific month's own `year`, never
  from a single dialog-wide value — this is the change this whole module exists to make correctly.
- Update both `en`/`el` i18n files together.

**Ask first about:**
- Whether Jul/Aug should default to the *previous* season instead of the upcoming one (flagged
  assumption, capability map §Background).
- Any change to `payment-entry`'s amount-prefill logic (`prefillAmount()`) — untouched by this
  spec, don't fold in unrelated changes while touching this file.

**Never do:**
- Don't delete `RosterYearEntry`/`RosterYearMonth`/`getRosterYear` (capability map: explicit
  out-of-scope).
- Don't change `POST /payments`/`DELETE /payments/:id` semantics.
- Don't reintroduce a non-clickable cell state for any month within the shown season.
