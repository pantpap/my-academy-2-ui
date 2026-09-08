# Plan: Payments Season View (Sep→Jun)

Capability map: [`../CAPABILITY-MAP-payments-season.md`](../CAPABILITY-MAP-payments-season.md)
Module specs: [`../../BE/my-academy-2-be/SPEC-payments-season-api.md`](../../BE/my-academy-2-be/SPEC-payments-season-api.md),
[`../SPEC-payments-season-grid.md`](../SPEC-payments-season-grid.md)
Todo: [`todo-payments-season.md`](./todo-payments-season.md)

**Does not touch** the active [`plan.md`](./plan.md) / [`todo.md`](./todo.md) (original
payments-screen capability) or `BE/my-academy-2-be/tasks/plan.md`/`todo.md` (customer-dialog
capability, complete). This is a follow-on refinement to the already-shipped `payments-grid`
module, spanning both repos, one pair of task files per the same convention the original payments
capability map used (paths below prefixed `BE/`/`FE/`).

## Context

The payments grid at `/app/payments` currently shows a calendar year (Jan–Dec) picked from a
plain year dropdown, and locks any month after today's date as a non-clickable "future" cell. The
org's actual billing cycle is an academic season (September–June); the user asked for the grid to
follow that season instead, with every visible month payable regardless of whether it's
chronologically past or future (staff can record payments ahead of time).

This was scoped in the prior spec pass into two dependent modules — a new BE read endpoint
(`GET /payments/roster-season?startYear=`) because a season spans two calendar years and the
existing `roster-year` endpoint only returns one, and a FE retrofit of the grid/container/both
payment dialogs to consume it. Full acceptance criteria live in the two `SPEC-*.md` files above;
this plan slices that into an ordered task list with per-task verification.

Both repos are on branch `dev`. BE changes are not auto-committed — the user reviews and commits
`my-academy-2-be` changes themselves.

## Dependency Graph / Build Order

```
Phase 1 (BE): Task 1 — GET /payments/roster-season?startYear=
   └── Checkpoint A: BE endpoint tested + manually verified live
          │  (FE code can be written against the typed contract without a live server,
          │   but browser verification needs the BE dev server running this endpoint)
          ▼
Phase 2 (FE): Task 2 — types + service method (RosterSeasonEntry/Month, getRosterSeason())
   └── Task 3 — season grid + selector (cell-state, payments-grid, payments-container, i18n)
          └── Task 4 — per-month year in the record dialog (payment-form-dialog, payment-detail-dialog)
                 └── Checkpoint B — full verification (automated + manual)
```

Linear. Task 2 needs Task 1's response shape (BE lands first). Tasks 3 and 4 are sequential, not
parallel, because Task 4's dialog changes consume the `RosterSeasonMonth` type Task 3 introduces
on `PaymentsGridCellActivated`.

## Files Involved

**BE (`BE/my-academy-2-be`):**
- `src/payments/payments.service.ts` — add `RosterSeasonMonth`/`RosterSeasonEntry` + `getRosterSeason()`
- `src/payments/payments.controller.ts` — add `GET /roster-season` handler
- `src/payments/payments.service.roster-season.integration.spec.ts` — new

**FE (`FE/my-academy-2-UI`):**
- `src/app/common/interfaces/payment.ts` — add `RosterSeasonMonth`/`RosterSeasonEntry` (additive; `RosterYearEntry`/`RosterYearMonth` untouched)
- `src/app/shared/services/payment/payment.ts` — add `getRosterSeason()`
- `src/app/features/payments/payments-grid/cell-state.ts` — collapse to `paid | due`
- `src/app/features/payments/payments-grid/{payments-grid.ts,.html,.spec.ts}` — `startYear` input, 10-slot season derivation, drop the non-clickable `future` branch
- `src/app/features/payments/payments-container/{payments-container.ts,.html,.spec.ts}` — season selector signal/options/default logic, `rosterSeasonResource`
- `src/app/features/payments/payment-form-dialog/{payment-form-dialog.ts,.spec.ts}` — per-month `year` throughout
- `src/app/features/payments/payment-detail-dialog/payment-detail-dialog.ts` — `RosterSeasonMonth` type swap
- `public/i18n/en.json`, `public/i18n/el.json` — `yearLabel` text → "Season"/"Σεζόν"; remove `stateLabels.future`

**Never touched:** `POST /payments`, `DELETE /payments/:id`, `GET /payments/roster-year` (left in
place per the capability map), `payment-routes.ts`, the sidebar nav entry, `customer-list`.

---

## Task 1 (BE) — `GET /payments/roster-season?startYear=`

Add `getRosterSeason(organizationId, startYear)` to `PaymentsService`, modeled directly on the
existing `getRosterYear()` (same `Map<athleteId, entry>` + slot-template shape, same raw
parameterized SQL via `DataSource.query()`), but building **10** slots — `(9, startYear)…(12,
startYear)`, `(1, startYear+1)…(6, startYear+1)` — and matching payment rows on the
`(coveredMonth, coveredYear)` **pair**, not `coveredMonth` alone (the one genuinely new piece of
logic: a January payment from the *previous* season, `coveredYear = startYear`, must not be
mistaken for this season's January, `coveredYear = startYear + 1`). Add the `GET /roster-season`
controller handler with the same required/integer validation `getRosterYear`'s `year` param
already uses, applied to `startYear`.

**Acceptance criteria:** one entry per athlete in the caller's org (JWT-derived), each with
exactly 10 `months` in fixed season order, each self-describing its own `year`; the Dec/Jan
boundary case above resolves correctly; athletes with zero season payments still get all 10 slots
`paid: false`; missing/non-integer `startYear` → 400; `GET /payments/roster-year` unchanged.

**Verification:** new `payments.service.roster-season.integration.spec.ts` (modeled on
`payments.service.roster-year.integration.spec.ts`) covering the boundary case + standard shape;
`npm test` full suite vs. recorded baseline; `npm run build` clean; manual `curl`/Postman check of
the live response shape for an athlete with payments in both halves of the season.

## Task 2 (FE) — Types + service method

Add `RosterSeasonMonth`/`RosterSeasonEntry` to `common/interfaces/payment.ts` (additive — don't
touch `RosterYearEntry`/`RosterYearMonth`) and `getRosterSeason(startYear)` to the `Payments`
service, following `getRosterYear()`'s shape exactly. Purely additive — nothing is wired to it
yet.

**Acceptance criteria:** types match `SPEC-payments-season-grid.md` §2.3; `getRosterSeason` calls
`GET /payments/roster-season` with `organizationId` + `startYear`, typed `RosterSeasonEntry[]`; no
existing behavior changes.

**Verification:** `ng test` full suite unchanged from baseline; `ng build` clean; manual sanity
call against the now-live BE endpoint (Checkpoint A) confirming deserialization (e.g. `amount` as
a number).

## Task 3 (FE) — Season grid + selector

Makes the screen season-shaped and browsable: `cell-state.ts` collapses to `paid | due`;
`payments-grid.ts`/`.html` swap `year`+`today` for `startYear`, derive 10 Sep→Jun slots, drop the
non-clickable `future` branch, retype `PaymentsGridCellActivated.month` to `RosterSeasonMonth`;
`payments-container.ts`/`.html` get a season-label selector (`"2026-27"`) with the three-range
default rule (Sep–Dec → this year; Jan–Jun → last year; Jul–Aug → this year/upcoming season —
flagged assumption, not yet user-confirmed) and swap to `rosterSeasonResource`/`getRosterSeason`;
i18n `yearLabel` text → "Season"/"Σεζόν", remove `stateLabels.future`.

**Known, documented limitation of this task's end state (fixed in Task 4, not silently shipped):**
`openRecordDialog()` still passes one container-wide `year` into `PaymentFormDialogData` — compiles
fine (TS structural typing: `RosterSeasonMonth[]` is a superset of `RosterYearMonth[]`'s fields),
correct for single-month and same-half-of-season selections, but wrong `coveredYear` for a
multi-month selection spanning the Dec/Jan boundary. Don't treat this task's dialog behavior as
fully correct in isolation.

**Acceptance criteria:** 10 columns Sep→Jun, every unpaid cell clickable regardless of date;
`cellAriaLabel()` reports each cell's own year; season selector labels/default correct for all
three today-ranges; summary unaffected by search/pagination (still full unfiltered season roster);
`stateLabels.future` removed from both locales.

**Verification:** `payments-grid.spec.ts`/`payments-container.spec.ts` updated + extended per
`SPEC-payments-season-grid.md` §5; `ng test` full suite vs. Task 2 baseline; `ng build` clean;
manual dev-server pass at `/app/payments` (needs Task 1 live) — selector default/labels, all 10
columns clickable, cell click still opens a dialog (contents may be stale-year internally, expected
per the limitation above).

**Checkpoint:** season grid fully browsable and every cell clickable before touching dialog
internals in Task 4.

## Task 4 (FE) — Per-month year in the record dialog

Fixes the cross-year multi-month save gap from Task 3: `payment-form-dialog.ts`'s
`PaymentFormDialogData` drops `year` for `initialYear` + `months: RosterSeasonMonth[]`;
`MonthToggle` gains `year`; `buildMonthToggles()`/`selected`-matching use both `month` and `year`;
`monthsToSubmit`/`selectedMonths` become `{month,year}[]`; `save()` sources `coveredMonth`/
`coveredYear` per entry, not `this.data.year`; failure messaging uses the failed month's own
`year`. `payment-detail-dialog.ts`: type swap only (`RosterSeasonMonth`), no behavior change.
`payments-container.ts`'s `openRecordDialog()`: pass `initialYear: month.year`.

**Acceptance criteria:** selecting a November + a January toggle (different years) and saving
calls `createPayment` twice with each call's own correct `coveredYear`; a 409 on the second
cross-year month reports the correct month *and* year; all Task 3 behavior still passes.

**Verification:** `payment-form-dialog.spec.ts` — cross-year two-month save test (assert both
`coveredYear` args individually) + cross-year duplicate-error test; `payment-detail-dialog.spec.ts`
fixture-type update only; `ng test` full suite vs. Task 3 baseline; `ng build` clean; manual
dev-server pass — record dialog from a November cell, add a January toggle, save, confirm January
lands under the *next* calendar year via the grid/DB.

**Checkpoint B (final):** full `ng test` (FE) + `npm test` (BE) green vs. their baselines; both
builds clean; manual pass covering selector default/labels, all-10-clickable, same-half and
cross-year multi-month saves, paid-cell detail/delete, Greek locale copy, absence of any `future`
state; confirm nothing outside "Files Involved" touched and `GET /payments/roster-year` still
works unchanged. Mark this initiative shipped only after this manual pass.

---

## Verification Summary (end-to-end)

1. BE: `npm test` + `npm run build` green; roster-season integration test covers the Dec/Jan
   boundary case.
2. FE: `ng test` + `ng build` green, no regressions outside touched files.
3. Manual, `/app/payments`: season selector (label format + three-range default), all 10 months
   clickable including future-dated ones, same-half and cross-year multi-month payment saves both
   post the correct year per month, paid-cell detail/delete flow, Greek locale, no `future` state
   anywhere.
