# Implementation Plan: Payments Screen

**Capability map:** [`../CAPABILITY-MAP-payments.md`](../CAPABILITY-MAP-payments.md)
**Task list:** [`todo.md`](./todo.md)
**Status:** awaiting human approval — no code written yet.

**Repos touched:** `BE/my-academy-2-be` (NestJS 11 + TypeORM + Postgres, Jest) and
`FE/my-academy-2-UI` (Angular 21 standalone + Material 3 + Tailwind v4 + Transloco, Vitest).
Both are on branch `dev` and clean as of 2026-09-05.

> The previous initiative's plan/todo (Customer Form Dialog, complete) were moved to
> [`archive/`](./archive/) so `/build`'s default paths are free for this one.

> **Note on module specs.** The capability map lists four module specs. Their content —
> the API contract, per-module objectives, and acceptance criteria — is folded into this
> document (Architecture Decisions + the task list) rather than written as four separate
> files, to avoid three-way duplication between spec, plan and todo. Say the word if you
> want them broken out as standalone `SPEC-*.md` files.

## Overview

Build the payments screen: a year grid (athletes × 12 months) at `/app/payments` where the user
sees at a glance who has paid for which month, records payments by clicking a cell (one or several
months at once), and deletes a mistaken payment.

The backend already does most of the work — `POST /payments` is transactional and only ever
advances `paidUntil`; the `payments` table has a composite unique constraint on
`(athleteId, organizationId, coveredMonth, coveredYear)` so the database itself forbids paying the
same month twice; every route is JWT-guarded and takes `organizationId` from the token. The FE
already has the `Payment` interfaces and a `Payments` service covering the three existing
endpoints. **The sidebar already links to `payments` — a route that does not exist.** This plan
adds two backend endpoints and the entire UI.

## Architecture Decisions

### 1. One new read endpoint instead of N per-athlete calls

`GET /payments/status` is per-athlete; rendering a 60-athlete grid through it means 60 requests.
`payments-api` adds `GET /payments/roster-year?year=` — one query, modelled on the SQL already in
`getRosterStatus()`, extended from one month to twelve.

**Contract (the BE↔FE boundary — all three FE modules consume this as given):**

```jsonc
// GET /payments/roster-year?year=2026     → 200
[
  {
    "athleteId": 12,
    "firstName": "Κώστας",
    "lastName": "Γεωργίου",
    "months": [                       // always exactly 12, ordered month 1..12
      { "month": 1, "paid": true,  "paymentId": 88,   "amount": 40,   "paymentDate": "2026-01-12" },
      { "month": 2, "paid": false, "paymentId": null, "amount": null, "paymentDate": null }
      // ...
    ]
  }
]
```

- Ordered by `lastName, firstName` — same as the existing `roster-status`, so the two screens agree.
- `amount` is **cast to a JS number** in the service. Postgres `decimal` comes back from the `pg`
  driver as a *string*; the existing `getPaymentStatus` already leaks this (its
  `PaymentStatusMonth.amount` is typed `number` but is a string at runtime). The new endpoint must
  not repeat that bug. See Risks.
- `paymentId` is present so `payment-delete` can act on a cell without a second lookup.

### 2. `DELETE /payments/:id` recomputes `paidUntil` — it is not just a row delete

`POST` only ever moves `paidUntil` forward. Deleting the newest payment must therefore walk it
*back*, which no existing code path does. In one transaction: delete the row, then set `paidUntil`
from the highest remaining `(coveredYear, coveredMonth)` for that `(athleteId, organizationId)` —
last day of that month, built in UTC (matching the existing `Date.UTC(y, m, 0)` idiom in
`PaymentsService.create`, which exists to stop `toISOString()` shifting the date backwards on
servers at a positive UTC offset). If no payments remain, `paidUntil` becomes `null`.

Ownership is checked against the token's org, and a payment belonging to another organization
returns **404, not 403** — a 403 would confirm the row exists.

### 3. Read ships before write

`payments-grid` is read-only and lands first. It already satisfies the stated need ("know which
payment refers to which month") and is the entry point both write flows hang off, so there is no
throwaway scaffolding. `payment-entry` (click a due cell) and `payment-delete` (click a paid cell)
are opposite cell states sharing no form logic, so they proceed in parallel afterwards.

### 4. Multi-month = N sequential POSTs, not a new bulk endpoint

The dialog lets the user tick several months; the FE posts one `POST /payments` per month. This
keeps one row per covered month — the shape the unique constraint, `paidUntil` logic and both read
endpoints already assume. A bulk endpoint would need its own transaction semantics for no gain at
this scale (realistically ≤12 requests, normally 1–3).

Sequential, not parallel, so a mid-flight failure leaves an unambiguous prefix. Partial failure is
an explicit requirement, not an afterthought — see Task 9.

### 5. Duplicate payments must surface as 409, not 500

The DB constraint is the real guard, but an unhandled `QueryFailedError` currently becomes a 500.
The grid disables already-paid months, so this only fires on stale data (two users, two tabs) — but
that is exactly when a clear message matters. Task 3 maps it to `409 Conflict`.

### 6. Cell states are derived on the client, from three inputs

`paid` (from the API), the selected year, and today's date:

| State | Condition | Interaction |
|---|---|---|
| **paid** | `months[m].paid === true` | click → payment detail + delete |
| **due** | not paid, and the month is in the past or is the current month | click → record dialog |
| **future** | not paid, and the month is later than the current month | not clickable |

For a past year every unpaid month is **due**; for a future year every month is **future**. This is
pure derivation with no API involvement, so it is unit-testable in isolation — the same shape as the
existing `buildPaidStatusMap` helper, and it lives next to it in the same style.

### 7. Design approach

`frontend-design` and `ui-ux-pro-max` inform the grid's visual and interaction design (density,
cell affordance, sticky axes, the paid/due/future visual language, empty and loading states). They
do **not** introduce a second component kit — Angular Material 3 tokens
(`--mat-sys-*`) plus Tailwind v4 utilities remain the only styling primitives, consistent with
`THEMING.md` and every existing component. Dark mode must work via the existing `ThemeService`
with no extra Sass.

State is never signalled by **colour alone** (an accessibility requirement, and `npm run lint`
enforces `angular.configs.templateAccessibility` on templates): each cell carries a glyph and an
`aria-label` naming the athlete, the month and the state.

## Task List

Full detail — acceptance criteria, verification, files — in [`todo.md`](./todo.md).

### Phase 1: `payments-api` (BE) — foundation
- [ ] Task 1: `GET /payments/roster-year?year=` returning the 12-month grid in one query
- [ ] Task 2: `DELETE /payments/:id`, org-scoped, transactional, recomputes `paidUntil`
- [ ] Task 3: Map the duplicate-payment constraint violation to `409 Conflict`

### Checkpoint A: backend contract firm
- [ ] `npm test` in BE — new integration specs pass, no new failures vs. the recorded baseline
- [ ] `npm run build` clean
- [ ] Both endpoints exercised against the dev DB with a real JWT (curl/REST client)
- [ ] **Review with human before starting FE work** — the contract in §1 is now frozen

### Phase 2: `payments-grid` (FE) — read-only screen
- [ ] Task 4: FE contract layer — `RosterYearEntry`/`RosterYearMonth` + `Payments.getRosterYear()`
- [ ] Task 5: Route `/app/payments` + container shell + year selector (sidebar link goes live)
- [ ] Task 6: The grid — cell-state derivation, sticky axes, a11y, roster summary
- [ ] Task 7: en/el copy + loading, empty and error states

### Checkpoint B: the screen answers the question
- [ ] `npm run build`, `npm run lint`, `npm test` clean vs. the recorded FE baseline
- [ ] **Live browser check**: log in, click "Πληρωμές" in the sidebar, grid renders real data,
      year selector refetches, dark mode and mobile widths hold
- [ ] Review with human before building the write paths

### Phase 3: write paths (parallelisable — Task 10 is independent of Tasks 8–9)
- [ ] Task 8: Record dialog — multi-month selection, amount prefill, running total, validation
- [ ] Task 9: Record submission — N sequential POSTs, partial-failure reporting, grid refresh
- [ ] Task 10: Delete flow — `Http.delete()`, `Payments.deletePayment()`, paid-cell detail + confirm

### Checkpoint C: Complete
- [ ] All acceptance criteria met; build, lint, test clean in both repos
- [ ] **Live end-to-end**: record a single month; record three months at once; attempt a duplicate;
      delete a payment and confirm `paidUntil` walked back correctly
- [ ] Capability map updated to "Approved / shipped"; ready for review

## Parallelisation

- **Sequential:** Phase 1 → Phase 2 → Phase 3. The API contract gates the FE; the grid gates both
  write flows because it is their only entry point.
- **Within Phase 1:** Tasks 1, 2 and 3 touch the same two files (`payments.controller.ts`,
  `payments.service.ts`). Run them in order, not concurrently — parallel agents would collide.
- **Within Phase 3:** Task 10 (`payment-delete`) is genuinely independent of Tasks 8–9
  (`payment-entry`) — different cell state, different files, no shared logic. Safe to parallelise
  across two sessions. Tasks 8 → 9 are strictly sequential (same dialog component).

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Postgres `decimal` arrives as a **string**, not a number. `PaymentStatusMonth.amount` is already typed `number` but is a string at runtime — pre-existing, latent. Doing arithmetic on it (the dialog's running total) silently concatenates: `"40" + "40" = "4040"`. | **High** — wrong money shown to the user | Cast to `Number()` in the BE service for `roster-year`; assert numeric type in the integration spec. Task 8's total is computed from the *typed input*, never from an API string. Fixing the pre-existing `getPaymentStatus` leak is noted as out of scope — flag it if it bites. |
| `roster-year` returns **every** athlete, while `GET /athletes` (customer list) is paginated at 10. A large club renders hundreds of rows × 12 cells. | Medium | Accept for now — a club roster is realistically 50–300. Keep the cell a lightweight element, `OnPush` everywhere. If it stutters, add virtual scrolling via `@angular/cdk/scrolling` (already a dependency) — deliberately *not* built up front. |
| Multi-month POST fails halfway — e.g. months 1,2 succeed, month 3 409s. | **High** — user cannot tell what was actually saved | Explicit requirement in Task 9: sequential posting, stop at first failure, dialog stays open naming exactly which months saved and which did not, grid refreshes so the truth is visible. Never a bare "save failed". |
| 12 columns + a name column on a phone. | Medium | Sticky athlete column + horizontally scrollable month area; verified at 360px in Checkpoint B. |
| `paidUntil` recompute is subtle (out-of-order payments, delete-the-only-payment → `null`). | **High** — silent data corruption | Task 2 is integration-tested against a real DB, mirroring the existing `payments.service.roster-status.integration.spec.ts` pattern, with explicit out-of-order and last-payment-deleted cases. |
| Both suites have **pre-existing failures** (FE ~6, BE ~9 per the archived todo) unrelated to this work. | Medium — false alarms, or real regressions hidden | Task 0 of each phase: record the exact pass/fail baseline *before* touching code, and compare against it, not against zero. |
| No browser-automation tool was available in any prior session, so the last initiative shipped without live verification. | Medium | Checkpoints B and C require live checks. If no automation is available, they are handed to you as a manual pass — and reported as *not done*, not quietly skipped. |

## Open Questions

1. **Inactive members.** `organization_athletes.status` defaults to `'active'`, and the existing
   `getRosterStatus` does **not** filter on it. Should the year grid show every linked athlete
   (consistent with today's behaviour) or only `status = 'active'`? **Proceeding with: no filter**,
   matching the existing endpoint. Cheap to change in Task 1 if you'd rather hide inactive members.
2. **Year selector range.** Proceeding with current year ± 2, clamped so no year precedes the
   organization's earliest payment. Say if you want a plain free-entry year instead.
3. **Recording a payment for a future month.** The grid marks future months non-clickable, so
   paying ahead is impossible from the grid — yet the multi-month dialog would naturally allow
   ticking ahead (paying Sep–Dec in September is normal for a club). **Proceeding with: the dialog
   permits future months within the selected year even though the grid won't open on one.** This is
   the one place where the two decisions you approved pull against each other — worth a look.
