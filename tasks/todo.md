# TODO: Payments Screen

Plan: [`plan.md`](./plan.md) · Capability map: [`../CAPABILITY-MAP-payments.md`](../CAPABILITY-MAP-payments.md)

**Do not start until the plan is approved.**

Paths are written relative to each repo root: `BE/` = `BE/my-academy-2-be`,
`FE/` = `FE/my-academy-2-UI`.

Both suites have **pre-existing failures unrelated to this work** (FE ~6, BE ~9 per the archived
todo). Record the exact baseline before the first task of each phase and compare against *that*,
never against zero.

---

## Phase 1: `payments-api` (BE)

### Task 1: `GET /payments/roster-year?year=` — whole-year grid in one query — ✅ DONE

**Description:** Add a roster-wide, twelve-month read endpoint so the grid loads in one request
instead of one per athlete. Model the SQL on the existing `getRosterStatus()` (same joins, same
`ORDER BY a."lastName", a."firstName"`), widened from a single month to a whole year, then group
the flat rows into exactly 12 month slots per athlete in the service.

**Acceptance criteria:**
- [ ] `GET /payments/roster-year?year=2026` returns one entry per athlete linked to the token's
      organization, each with a `months` array of **exactly 12** entries ordered 1→12, shaped as in
      plan.md §1 — unpaid months present with `paid: false` and nulls, not omitted
- [ ] `amount` is a **JS number**, not the string the `pg` driver returns for `decimal`; `paymentId`
      is populated for every paid month
- [ ] `organizationId` comes from the JWT (`organizationIdFrom(req)`), never from a query param;
      missing/non-integer `year` → 400, matching how `roster-status` validates `month`
- [ ] An athlete with no payments in that year yields 12 unpaid slots (not an absent row)

**Verification:**
- [ ] `npm test -- payments` in BE — new integration spec passes
- [ ] `npm run build` clean
- [ ] Manual: curl with a real JWT against the dev DB; confirm `typeof months[0].amount === 'number'`
      for a paid month

**Dependencies:** None
**Files likely touched:** `BE/src/payments/payments.controller.ts`,
`BE/src/payments/payments.service.ts`,
`BE/src/payments/payments.service.roster-year.integration.spec.ts` (new)
**Estimated scope:** M

---

### Task 2: `DELETE /payments/:id` — org-scoped, transactional, recomputes `paidUntil` — ✅ DONE

**Description:** Deleting a payment must walk `paidUntil` **backwards**, which no existing code path
does (`create` only ever advances it). In one transaction: verify ownership, delete the row, then
recompute `paidUntil` from the highest remaining `(coveredYear, coveredMonth)` for that
`(athleteId, organizationId)` — last day of that month, built with `Date.UTC(y, m, 0)` to match the
existing idiom in `create()`. No payments left → `paidUntil = null`.

**Acceptance criteria:**
- [ ] `DELETE /payments/:id` deletes the row and returns 204 (or the deleted payment — pick one and
      make the spec assert it)
- [ ] A payment belonging to **another organization returns 404, not 403** (a 403 confirms the row
      exists); a non-existent id returns 404
- [ ] `paidUntil` after deletion equals the last day of the highest remaining covered month, and
      becomes `null` when the athlete's last payment is deleted
- [ ] Delete + recompute happen in **one transaction** — a failure mid-way leaves neither applied

**Verification:**
- [ ] `npm test -- payments` in BE, with explicit cases for: deleting the newest payment (walks
      back), deleting an older out-of-order payment (`paidUntil` unchanged), deleting the only
      payment (→ `null`), and cross-org access (→ 404)
- [ ] `npm run build` clean
- [ ] Manual: record two payments, delete the newer, confirm `paidUntil` moved back in the DB

**Dependencies:** None (independent of Task 1, but same files — run after it, not concurrently)
**Files likely touched:** `BE/src/payments/payments.controller.ts`,
`BE/src/payments/payments.service.ts`,
`BE/src/payments/payments.service.delete.integration.spec.ts` (new)
**Estimated scope:** M

---

### Task 3: Duplicate payment → `409 Conflict`

**Description:** The composite unique constraint on
`(athleteId, organizationId, coveredMonth, coveredYear)` is the real guard against paying a month
twice, but an unhandled `QueryFailedError` currently surfaces as a 500. Catch the unique-violation
(Postgres `23505`) in `PaymentsService.create` and rethrow as `ConflictException`.

**Acceptance criteria:**
- [ ] Posting a payment for an already-covered `(athlete, month, year)` returns **409** with a
      message naming the month and year — not 500
- [ ] Every other `QueryFailedError` still propagates unchanged (no blanket catch)
- [ ] `paidUntil` is untouched when the insert is rejected (the existing transaction already
      guarantees this — assert it)

**Verification:**
- [ ] `npm test -- payments` in BE — duplicate-post spec asserts 409
- [ ] Manual: post the same payment twice via curl, observe 409 on the second

**Dependencies:** None
**Files likely touched:** `BE/src/payments/payments.service.ts`,
`BE/src/payments/payments.service.spec.ts`
**Estimated scope:** S

---

## Checkpoint A: backend contract firm

- [ ] BE `npm test` — new specs pass; failure count matches the recorded baseline (no new failures)
- [ ] BE `npm run build` clean
- [ ] All three behaviours exercised against the dev DB with a real JWT
- [ ] **Review with human.** The contract in plan.md §1 is frozen from here — the three FE modules
      consume it as given.

---

## Phase 2: `payments-grid` (FE) — read-only screen

### Task 4: FE contract layer

**Description:** Add the `roster-year` types and service method. Types go in the existing
`common/interfaces/payment.ts` next to `RosterStatusEntry`; the method goes on the existing
`Payments` service, following its established shape (org id from the signal, never a parameter).

**Acceptance criteria:**
- [ ] `RosterYearMonth` and `RosterYearEntry` exported from `common/interfaces/payment.ts`, matching
      plan.md §1 exactly
- [ ] `Payments.getRosterYear(year: number)` calls `GET payments/roster-year` with `organizationId`
      from `this.organizationId()` and the given `year` — same pattern as `getRosterStatus`
- [ ] No change to any existing interface or method (the customer list keeps working untouched)

**Verification:**
- [ ] `npm test -- payment` in FE — service spec asserts URL and params
- [ ] `npm run build` and `npm run lint` clean

**Dependencies:** Task 1
**Files likely touched:** `FE/src/app/common/interfaces/payment.ts`,
`FE/src/app/shared/services/payment/payment.ts`, `FE/src/app/shared/services/payment/payment.spec.ts`
**Estimated scope:** S

---

### Task 5: Route `/app/payments` + container shell + year selector

**Description:** Create the `payments` feature and wire up the sidebar link that has been dead since
it was added. Container owns the selected-year signal and an `rxResource` keyed on it, mirroring
`customer-container.ts`. No grid yet — render a placeholder so the route is verifiable on its own.

**Acceptance criteria:**
- [ ] Clicking "Πληρωμές" in the sidebar navigates to `/app/payments` and renders the screen
      (lazy-loaded via `loadChildren`, matching how `customers` is registered)
- [ ] Year selector defaults to the current year; changing it refetches (resource keyed on the year
      signal), range per plan.md Open Question 2
- [ ] Component is standalone, `OnPush`, uses `inject()` — per `AGENTS.md`
- [ ] Route is behind the existing `authGuard` (inherited from the `app` parent route)

**Verification:**
- [ ] `npm test`, `npm run build`, `npm run lint` clean
- [ ] Manual: sidebar link works; changing the year issues a new request (Network tab)

**Dependencies:** Task 4
**Files likely touched:** `FE/src/app/core/layout/layout-routes.ts`,
`FE/src/app/features/payments/payment-routes.ts` (new),
`FE/src/app/features/payments/payments-container/payments-container.{ts,html,scss}` (new)
**Estimated scope:** M *(3 of the 4 paths are the co-located parts of one component)*

---

### Task 6: The grid — cell states, sticky axes, a11y, summary

**Description:** The screen itself. Rows = athletes, columns = the 12 months, cells in one of three
states. Extract the state derivation as a **pure function in its own file** (same spirit as the
existing `paid-status.ts` helper) so it is unit-testable without rendering. Apply `frontend-design`
and `ui-ux-pro-max` for density, affordance and the visual language — within Material 3 tokens and
Tailwind only, per plan.md §7.

**Acceptance criteria:**
- [ ] Pure `cellState(month, paid, selectedYear, today)` → `'paid' | 'due' | 'future'`, matching the
      table in plan.md §6, unit-tested including the past-year and future-year edges
- [ ] Athlete column and month header stay visible while the month area scrolls horizontally;
      usable at 360px width
- [ ] State is **never conveyed by colour alone** — each cell has a glyph and an `aria-label`
      naming athlete, month and state; `npm run lint` passes the template a11y rules
- [ ] Summary line shows paid/total for the selected year
- [ ] Light and dark both correct via existing `--mat-sys-*` tokens — no new Sass mixins

**Verification:**
- [ ] `npm test` — `cellState` unit tests plus a component spec asserting rendered states
- [ ] `npm run lint` clean (a11y rules are the point here)
- [ ] Manual: 360px and desktop widths; toggle dark mode; tab through and confirm focus is visible

**Dependencies:** Task 5
**Files likely touched:** `FE/src/app/features/payments/payments-grid/payments-grid.{ts,html,scss}` (new),
`FE/src/app/features/payments/payments-grid/cell-state.ts` (new),
`FE/src/app/features/payments/payments-grid/cell-state.spec.ts` (new)
**Estimated scope:** M

---

### Task 7: Copy (en/el) + loading, empty and error states

**Description:** Every string through Transloco in both languages — no hardcoded copy. Add the three
non-happy states the grid can be in.

**Acceptance criteria:**
- [ ] All new strings under a `payments.*` prefix in **both** `en.json` and `el.json`; the two files
      have identical key sets
- [ ] Loading, error (with retry) and empty-roster states render distinctly — following the
      `@if (resource.isLoading()) … @else if (resource.error()) …` pattern already in
      `customer-details.html`
- [ ] No literal user-facing text left in the payments templates

**Verification:**
- [ ] `npm test`, `npm run build`, `npm run lint` clean
- [ ] Manual: switch language via the header, confirm the whole screen translates; stop the backend
      and confirm the error state (not a blank screen)

**Dependencies:** Task 6
**Files likely touched:** `FE/public/i18n/en.json`, `FE/public/i18n/el.json`,
`FE/src/app/features/payments/payments-grid/payments-grid.html`,
`FE/src/app/features/payments/payments-container/payments-container.html`
**Estimated scope:** S

---

## Checkpoint B: the screen answers the question

- [ ] FE `npm run build`, `npm run lint`, `npm test` clean vs. the recorded baseline
- [ ] **Live browser check** — log in, click "Πληρωμές", grid renders real data, year selector
      refetches, dark mode and 360px hold. If no browser automation is available, hand this to the
      human and record it as **not done** rather than skipping it silently.
- [ ] Review with human before building the write paths

---

## Phase 3: write paths

> Task 10 is independent of Tasks 8–9 and can run in a parallel session.
> Tasks 8 → 9 are strictly sequential (same component).

### Task 8: Record dialog — multi-month selection, amount prefill, running total

**Description:** A Material dialog opened from a **due** cell, prefilled with that athlete and that
month. Follow `CustomerFormDialog` as the house pattern: `MAT_DIALOG_DATA` in, signal-forms
(`@angular/forms/signals` — **not** `ReactiveFormsModule`), `MatDialogRef` closed with the result.
This task is the form only; submission is Task 9.

**Acceptance criteria:**
- [ ] Opens with the clicked athlete and month preselected; further months of the selected year can
      be toggled; already-paid months are disabled and visibly so
- [ ] Amount prefills from the athlete's most recent payment via `GET /payments?athleteId=`, and is
      empty when there is none
- [ ] Running total = amount × selected month count, computed from the **typed input**, never from
      an API string (see the decimal risk in plan.md)
- [ ] Validation: amount required and > 0, date required, at least one month selected; Save disabled
      until valid
- [ ] All copy in en/el

**Verification:**
- [ ] `npm test` — dialog spec covers prefill, disabled paid months, total, validation gating
- [ ] `npm run lint` clean
- [ ] Manual: open from a due cell, tick three months, confirm the total

**Dependencies:** Task 7
**Files likely touched:**
`FE/src/app/features/payments/payment-form-dialog/payment-form-dialog.{ts,html,scss}` (new),
`FE/src/app/features/payments/payment-form-dialog/payment-form-dialog.spec.ts` (new),
`FE/public/i18n/{en,el}.json`
**Estimated scope:** M

---

### Task 9: Submission — N sequential POSTs with partial-failure reporting

**Description:** Save posts one `POST /payments` per selected month, **sequentially**, so a failure
leaves an unambiguous prefix. The hard requirement is honest reporting: never a bare "save failed"
when some months were in fact saved.

**Acceptance criteria:**
- [ ] One POST per selected month, sequential, each with that month's `coveredMonth`/`coveredYear`
- [ ] All succeed → dialog closes, grid refreshes, cells now paid
- [ ] Partial failure → **stop at the first failure**; dialog stays open naming exactly which months
      were saved and which were not; the grid still refreshes so the saved ones show as paid
- [ ] A 409 from Task 3 renders as "already paid for that month", distinct from a generic error
- [ ] Save cannot be double-submitted while in flight

**Verification:**
- [ ] `npm test` — specs for all-succeed, first-fails, third-of-three-fails (asserting the message
      names months 1 and 2 as saved), and the 409 path
- [ ] Manual: record 3 months at once; then attempt a duplicate and confirm the 409 message

**Dependencies:** Task 8
**Files likely touched:**
`FE/src/app/features/payments/payment-form-dialog/payment-form-dialog.{ts,html}`,
`FE/src/app/features/payments/payment-form-dialog/payment-form-dialog.spec.ts`,
`FE/src/app/features/payments/payments-container/payments-container.ts`
**Estimated scope:** M

---

### Task 10: Delete flow — paid-cell detail + confirmed delete

**Description:** Clicking a **paid** cell shows that payment (amount, date, notes) with a confirmed
delete. Note `Http` currently has **no `delete()` method** — only get/post/put — so this task adds
it, following the existing method signatures exactly.

**Acceptance criteria:**
- [ ] `Http.delete<T>(url)` added, matching the existing get/post/put shape
- [ ] `Payments.deletePayment(id: number)` calls `DELETE payments/:id`
- [ ] Clicking a paid cell shows amount, payment date and notes for that payment
- [ ] Delete requires an explicit confirmation step; on success the grid refreshes and the cell
      returns to **due**
- [ ] Failure surfaces a translated error and leaves the cell as-is
- [ ] Copy in en/el

**Verification:**
- [ ] `npm test` — `Http.delete` spec, service spec, and a component spec for confirm-then-refresh
- [ ] `npm run lint` clean
- [ ] Manual: record two payments for one athlete, delete the newer, confirm the cell flips to due
      **and** that the customer's `paidUntil` walked back (Task 2's recompute, verified end to end)

**Dependencies:** Task 7 (and Task 2 for the endpoint). Independent of Tasks 8–9.
**Files likely touched:** `FE/src/app/core/services/http/http.ts`,
`FE/src/app/shared/services/payment/payment.ts`,
`FE/src/app/features/payments/payments-grid/payments-grid.ts`,
`FE/public/i18n/{en,el}.json`
**Estimated scope:** M

---

## Checkpoint C: Complete

- [ ] All acceptance criteria met across all 10 tasks
- [ ] `npm run build`, `npm run lint`, `npm test` clean in **both** repos vs. recorded baselines
- [ ] **Live end-to-end**: record a single month; record three at once; attempt a duplicate (409
      message); delete a payment and confirm `paidUntil` walked back correctly
- [ ] `CAPABILITY-MAP-payments.md` updated from "awaiting approval" to shipped
- [ ] Review with human
