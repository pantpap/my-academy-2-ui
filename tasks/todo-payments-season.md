# TODO: Payments Season View (Sep→Jun)

Plan: [`plan-payments-season.md`](./plan-payments-season.md) · Capability map:
[`../CAPABILITY-MAP-payments-season.md`](../CAPABILITY-MAP-payments-season.md)

Does not touch the active [`todo.md`](./todo.md) (original payments-screen capability) or
`BE/my-academy-2-be/tasks/todo.md` (customer-dialog capability, complete). Paths below are
relative to each repo root: `BE/` = `BE/my-academy-2-be`, `FE/` = `FE/my-academy-2-UI`.

Record the exact `ng test` (FE) and `npm test` (BE) baselines before Task 1, and compare every
later run against *that*, never against zero — both repos have pre-existing unrelated failures
(see `SPEC-backend-address.md` for BE, `todo-payments-grid-material.md` for FE).

**Do not start until the plan is approved.** *(Approved 2026-09-08.)*

---

## Phase 1: `payments-season-api` (BE)

### Task 1: `GET /payments/roster-season?startYear=` — whole-season grid in one query — ✅ DONE

**Description:** Add `getRosterSeason(organizationId, startYear)` to `PaymentsService`, modeled
on the existing `getRosterYear()` (same `Map<athleteId, entry>` + slot-template shape, same raw
parameterized SQL via `DataSource.query()`), building **10** slots — `(9, startYear)…(12,
startYear)`, `(1, startYear+1)…(6, startYear+1)` — and matching payment rows on the
`(coveredMonth, coveredYear)` **pair**, not `coveredMonth` alone. Add the `GET /roster-season`
controller handler with the same required/integer validation `getRosterYear`'s `year` already
uses, applied to `startYear`.

**Acceptance criteria:**
- [x] `GET /payments/roster-season?startYear=2026` returns one entry per athlete linked to the
      caller's org (JWT-derived `organizationId`, never from a query param), each with a `months`
      array of **exactly 10** entries in fixed season order (Sep `startYear` → Jun `startYear+1`)
- [x] Each month entry self-describes its own `year` (not just `month`)
- [x] A payment for `coveredMonth: 1, coveredYear: startYear` (the *previous* season's January)
      does **not** appear as paid in this season's January slot (`coveredYear: startYear + 1`) —
      the Dec/Jan boundary case
- [x] Athletes with zero payments in the season still get all 10 slots, `paid: false`, nulls
- [x] `amount` is a JS number, not a string; `paymentId` populated for every paid month
- [x] Missing `startYear` → 400; non-integer `startYear` → 400 (validation mirrors `getRosterYear`'s
      `year` check exactly — no dedicated spec test, matching that method's own precedent of no
      controller-level test for this validation)
- [x] `GET /payments/roster-year` behavior is byte-for-byte unchanged by this task (untouched file
      region, confirmed by reading the diff)

**Verification steps:**
1. ✅ New `payments.service.roster-season.integration.spec.ts` (modeled on
   `payments.service.roster-year.integration.spec.ts`): 8 tests, including the Dec/Jan boundary
   case as an explicit test (a decoy payment for `coveredMonth:1, coveredYear:2026` — the previous
   season's January — correctly excluded from this season's `coveredYear:2027` January slot).
2. ✅ `npm test` (BE) full suite: baseline was 8 failed / 47 passed (55 total, 8 suites failing —
   pre-existing, unrelated `TestingModule` DI breakage in `auth`/`sports`/`athletes`/
   `organizations` controller/service specs, confirmed present before this task). After this task:
   8 failed / 55 passed (63 total) — same 8 pre-existing failures, +1 new suite / +8 new tests, no
   regressions.
3. ✅ `npm run build` (BE) — compiles cleanly.
4. ⚠️ Manual live `curl`/Postman check: **not performed this session** (no authenticated JWT
   available in this shell environment to hit the running dev server). The integration test runs
   the exact same SQL against the real Postgres database via `AppDataSource`, so the query logic
   itself is verified against real data — only the HTTP/auth-guard wiring is unverified. Flagged,
   not silently skipped; a quick `curl` with a real session token would close this out.

**Checkpoint A:** ⚠️ Partially met — query logic is tested and correct (integration test against a
real database), but not yet manually verified over live HTTP with a JWT (see step 4 above). FE
Task 2 (types + service method) can proceed — it's purely additive and needs no live server. Do
not attempt FE Task 3's manual/browser verification step until someone has actually hit
`GET /payments/roster-season` over HTTP at least once.

**Not committed** — BE changes in this repo are reviewed and committed by the user themselves, not
auto-committed. Files awaiting review: `src/payments/payments.service.ts`,
`src/payments/payments.controller.ts`, `src/payments/payments.service.roster-season.integration.spec.ts`.

---

## Phase 2: `payments-season-grid` (FE)

### Task 2: Types + service method — ✅ DONE

**Description:** Add `RosterSeasonMonth`/`RosterSeasonEntry` to `common/interfaces/payment.ts`
(additive — `RosterYearEntry`/`RosterYearMonth` untouched) and `getRosterSeason(startYear)` to
`shared/services/payment/payment.ts`'s `Payments` service, following `getRosterYear()`'s shape
exactly. Nothing else is wired to it yet.

**Acceptance criteria:**
- [x] `RosterSeasonMonth { month, year, paid, paymentId, amount, paymentDate }` and
      `RosterSeasonEntry { athleteId, firstName, lastName, months: RosterSeasonMonth[] }` added
- [x] `getRosterSeason(startYear)` calls `GET /payments/roster-season` with `organizationId` +
      `startYear`, typed to return `RosterSeasonEntry[]`
- [x] No existing component's behavior changes — this task is purely additive

**Verification steps:**
1. ✅ New test in `payment.spec.ts`: `getRosterSeason()` gets `/payments/roster-season` scoped to
   `organizationId` + `startYear`, following the existing `getRosterYear()` test's exact pattern.
   RED confirmed first (compile errors — missing type export, missing method), then GREEN (7/7 in
   `payment.spec.ts`).
2. ✅ `ng test` full suite: baseline was 11 failed / 143 passed (154 total, 8 files failing —
   pre-existing `TRANSLOCO_TRANSPILER`/DI setup breakage, unrelated to payments, confirmed present
   before this task). After this task: 11 failed / 144 passed (155 total) — same 8 pre-existing
   failing files, +1 new test, no regressions.
3. ✅ `ng build` — compiles cleanly.
4. ⚠️ Manual sanity check against the live BE endpoint: **not performed** — same reason as Task 1's
   Checkpoint A gap (no authenticated session in this shell). The `HttpTestingController`-based
   spec test above verifies the request shape (method, URL, `organizationId`/`startYear` params)
   precisely, but not a real round-trip against the running BE.

---

### Task 3: Season grid + selector — ✅ DONE

**Description:** Makes the screen itself season-shaped and browsable.
- `cell-state.ts`: collapse to `export type CellState = 'paid' | 'due'` and
  `cellState(paid: boolean): CellState` — drop `month`/`selectedYear`/`today` params.
- `payments-grid.ts`: `roster` input → `RosterSeasonEntry[]`; `year`+`today` inputs → single
  `startYear: input.required<number>()`; `monthLabels()` derives the 10 Sep→Jun slots from
  `startYear()`; `stateFor()` → `cellState(month.paid)`; `cellAriaLabel()` uses the month's own
  `year`; `PaymentsGridCellActivated.month` → `RosterSeasonMonth`.
- `payments-grid.html`: remove the `@default` (non-clickable `future`) branch.
- `payments-container.ts`: `selectedYear`/`years` → `selectedSeasonStartYear` + season-label
  options (`"2026-27"`); default from `today` (Sep–Dec → this year; Jan–Jun → last year; Jul–Aug →
  this year/upcoming season); `rosterYearResource`/`getRosterYear` → `rosterSeasonResource`/
  `getRosterSeason`.
- `payments-container.html`: season `<mat-select>` bound to the new signal/options.
- i18n: `payments.yearLabel` text → `"Season"`/`"Σεζόν"`; remove `payments.stateLabels.future`
  from both `en.json`/`el.json`.

**Known, documented limitation of this task's end state (fixed in Task 4):**
`openRecordDialog()` still passes one container-wide `year` into `PaymentFormDialogData` — this
compiles (TS structural typing accepts `RosterSeasonMonth[]` where `RosterYearMonth[]` was
expected) and works for single-month/same-half-of-season saves, but posts the wrong `coveredYear`
for a multi-month selection spanning the Dec/Jan boundary. Not a regression to chase in this task.

**Acceptance criteria:**
- [x] Grid renders 10 columns in Sep→Jun order for the selected season
- [x] Every unpaid cell (including ones dated after today) renders as a clickable `due` button —
      no non-clickable cell remains
- [x] `cellAriaLabel()` reports each cell's own calendar year correctly across the Dec/Jan
      boundary
- [x] Season selector shows labels like `"2026-27"` (via a new `season.ts` helper —
      `seasonLabel`/`defaultSeasonStartYear`/`seasonOptions`, unit-tested directly rather than
      through component/DOM tests, since `mat-select` options render in a CDK overlay outside the
      fixture DOM)
- [x] Default season on load is correct for all three today-ranges (Sep–Dec, Jan–Jun, Jul–Aug) —
      covered directly in `season.spec.ts` with synthetic dates for full branch coverage; the
      container's own "defaults to the season in progress" test uses the real `new Date()`
      against the same `defaultSeasonStartYear()` function (matching this file's existing
      `currentYear = new Date().getFullYear()` precedent), since only one branch is exercisable at
      real test-run time
- [x] Paid/total summary still reflects the full unfiltered season roster
- [x] Existing pagination/search still work over `RosterSeasonEntry[]`/10 columns
- [x] `payments.stateLabels.future` removed from both `en.json`/`el.json`, no longer referenced
      anywhere (confirmed via repo-wide grep)

**Verification steps:**
1. ✅ `payments-grid.spec.ts`: fixtures rewritten to `RosterSeasonEntry[]`/`startYear`; new cases
   for season-order columns (with per-month year), "no non-clickable cell state" (replaces the old
   "future is non-interactive" test), and per-month aria-label year across the Dec/Jan boundary.
   `cell-state.spec.ts` collapsed to the new 2-case signature. New `season.spec.ts` (13 tests) for
   the extracted pure helpers.
2. ✅ `payments-container.spec.ts`: rewritten for `selectedSeasonStartYear`/`seasons`/
   `getRosterSeason`; the DOM-based "renders season option labels in the select" test was written
   then deleted after confirming `mat-select` options don't exist in the fixture DOM until opened
   (Material CDK overlay) — the component-level `seasons`/`seasonLabel` test already covers this
   correctly.
3. ✅ `ng test` full suite: same 8 pre-existing failing files / 11 pre-existing failing tests as
   the Task 2 baseline (155 total) — no regressions. Net test count moved from 155 to 156 (cell-
   state's suite shrank from 8→2 tests as it collapsed to a trivial pure function, offset by new
   coverage in `payments-grid.spec.ts`/`season.spec.ts`).
4. ✅ `ng build` — compiles cleanly. Confirmed via structural typing (not an accident): the
   still-old-typed `payment-form-dialog.ts`/`payment-detail-dialog.ts` accept the new
   `RosterSeasonMonth`/`RosterSeasonEntry` values passed into them because `RosterSeasonMonth` is
   a strict superset of `RosterYearMonth`'s fields.
5. ⚠️ Manual dev-server pass: **not performed** — both dev servers are running locally
   (`:4200` FE, `:3000` BE), but no login credentials were available in this session to
   authenticate into `/app/payments`. Flagged, not silently skipped — the user can verify visually
   with a real login: season selector default/label, all 10 columns clickable including
   future-dated ones, cell click still opens a dialog.

**Checkpoint:** season grid fully browsable, every cell clickable, before touching dialog
internals in Task 4.

---

### Task 4: Per-month year in the record dialog

**Description:** Fixes the cross-year multi-month save gap from Task 3.
- `payment-form-dialog.ts`: `PaymentFormDialogData` drops `year: number` for `initialYear: number`
  + `months: RosterSeasonMonth[]`; `MonthToggle` gains `year: number`; `buildMonthToggles()` /
  `selected`-matching use both `month` and `year`; `monthsToSubmit`/`selectedMonths` →
  `{month, year}[]`; `save()` sources `coveredMonth`/`coveredYear` per entry, not
  `this.data.year`; failure messaging uses the failed month's own `year`.
- `payment-detail-dialog.ts`: `PaymentDetailDialogData.payment` → `RosterSeasonMonth` (type swap
  only, no behavior change).
- `payments-container.ts`'s `openRecordDialog()`: pass `initialYear: month.year` instead of
  `year: this.selectedSeasonStartYear()`.

**Acceptance criteria:**
- [ ] Selecting a November toggle **and** a January toggle (different `year`s) and saving calls
      `createPayment` twice, each with its own correct `coveredYear`
- [ ] A 409 (duplicate) failure on the second of two cross-year months reports the correct month
      *and* year in the error message
- [ ] All Task 3 grid/container behavior still passes unchanged

**Verification steps:**
1. `payment-form-dialog.spec.ts`: cross-year two-month save test (assert both `createPayment`
   calls' `coveredYear` arguments individually) + cross-year duplicate-error-message test.
2. `payment-detail-dialog.spec.ts`: fixture type update only, existing assertions unchanged.
3. `ng test` full suite — compare against Task 3 baseline, no regressions expected.
4. `ng build` — compiles cleanly.
5. Manual: dev server, `/app/payments` — record dialog from a November cell, also select a
   January toggle, save, confirm January lands under the *next* calendar year (via the grid
   refreshing or the DB), not the season's start year.

**Checkpoint B (final):** Full go/no-go —
1. Full `ng test` (FE) + `npm test` (BE) green against their recorded baselines.
2. `ng build` + `npm run build` (BE) both compile cleanly.
3. Manual browser pass: season selector default/labels, all 10 months clickable, a
   same-half-of-season multi-month save, a cross-year multi-month save (Task 4's fix), a paid
   cell's detail/delete flow, Greek locale copy for the season label, confirmed absence of any
   `future` state.
4. Confirm nothing outside the plan's "Files Involved" list was touched, and `GET
   /payments/roster-year` still works unchanged.

Mark this initiative shipped only after Checkpoint B's manual pass.
