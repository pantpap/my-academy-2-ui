# Capability Map: Payments Screen

Proposed 2026-09-05. **Status: all four modules built and automated-verified; live browser
end-to-end still outstanding (Checkpoint C in `tasks/todo.md`) — not yet marked shipped.**

Placed alongside the existing [CAPABILITY-MAP.md](./CAPABILITY-MAP.md) (Customer Edit Dialog Fix,
approved 2026-08-26), following its precedent of living in the FE repo and linking out to the BE
spec. That map explicitly deferred this work: *"Recording payments is an explicitly separate,
future capability — out of scope for this map."* This is that capability.

## Background

The user needs a screen to record customer payments, where each payment is unambiguously tied to
the month it covers (every customer owes a subscription every month).

**What already exists — this is not greenfield.** Reuse it rather than re-deriving it:

Backend (`BE/my-academy-2-be`, `src/payments/`) is largely built:
- `POST /payments` — transactional, advances `OrganizationAthlete.paidUntil` **only forwards**
  (an out-of-order payment for an earlier month cannot move it backwards).
- `GET /payments/status?athleteId=&year=` — 12-month paid/unpaid breakdown for **one** athlete.
- `GET /payments/roster-status?year=&month=` — whole roster for **one** month.
- `GET /payments?athleteId=` — raw payment rows, `paymentDate DESC`.
- `payments` table has a composite unique constraint on
  `(athleteId, organizationId, coveredMonth, coveredYear)` — the DB itself forbids double-paying
  a month. Migrations exist (`AddCompositeUniqueConstraints`, `AddLookupIndexes`).
- All routes are `@UseGuards(AuthGuard('jwt'))` and take `organizationId` **from the token**, never
  from the client.

Frontend (`FE/my-academy-2-UI`):
- `common/interfaces/payment.ts` — `Payment`, `PaymentStatus`, `PaymentStatusMonth`,
  `RosterStatusEntry`. Already correct.
- `shared/services/payment/payment.ts` (`Payments`) — `createPayment`, `getPaymentStatus`,
  `getRosterStatus` all wired. **Already complete for what it covers.**
- `customer-list` already renders a "this month" paid/unpaid column via `buildPaidStatusMap`.
- `shared/components/sidebar` already has a **"Πληρωμές"** nav item pointing at route `payments`
  — **a route that does not exist.** Clicking it today navigates nowhere.

**The gap is UI to record a payment. There is none — zero components.**

## Approved decisions (2026-09-05)

| Decision | Choice |
|---|---|
| Screen shape | Year grid — athletes (rows) × 12 months (columns); click a cell to record |
| Multi-month | Yes — pick a set of months in one dialog; FE posts one payment per month |
| Corrections | Add `DELETE /payments/:id` (org-scoped, recomputes `paidUntil`) + UI to use it |
| Amount | Typed each time, prefilled from that athlete's most recent payment |

Explicitly **not** in scope: `PATCH /payments/:id` (editing an existing payment), a per-organization
default monthly fee (`Organization.monthlyFee`), the dashboard "who hasn't paid" widget, and any
change to the existing customer-list payment column.

## Module Map

| Module id | Responsibility | Depends on | Repo |
|---|---|---|---|
| `payments-api` | Two new endpoints: `GET /payments/roster-year?year=` returning every athlete in the org with a 12-slot month array (incl. `paymentId` and `amount` per paid month) in **one** query; and `DELETE /payments/:id`, org-scoped and transactional, recomputing `paidUntil` from the surviving payments. | — | BE (`my-academy-2-be`) |
| `payments-grid` | The screen itself, read-only: route `/app/payments` (wiring up the already-present sidebar link), year selector, athletes × months grid with paid / due / future cell states, roster-wide summary, loading + empty + error states, en/el copy. Responsive and keyboard-navigable. | `payments-api` | FE |
| `payment-entry` | The record-payment dialog: opens prefilled from a clicked cell, multi-month selection within the chosen year, amount prefilled from the athlete's last payment, running total, posts one `POST /payments` per selected month, refreshes the grid. | `payments-grid` | FE |
| `payment-delete` | Clicking an already-paid cell surfaces that payment's details (amount, date, notes) with a confirmed delete calling `DELETE /payments/:id`, then refreshes the grid. | `payments-grid`, `payments-api` | FE |

**Build order:** `payments-api` → `payments-grid` → `payment-entry` and `payment-delete` in parallel

### Why these boundaries

- **`payments-api` is separate** because it is a different repository, a different test runner, and
  it carries a migration-adjacent concern (the `paidUntil` recompute) that must be correct before
  any UI leans on it. It is verifiable entirely with backend integration tests, no UI.
- **`payments-grid` is separate from `payment-entry`** because reading and writing fail differently
  and ship separately. A correct read-only grid is already useful (it answers "who owes what for
  which month" — the stated need) and is the entry point every write flow hangs off. Building the
  write path first would have nowhere to live.
- **`payment-delete` is separate from `payment-entry`** because they are opposite cell states
  (a due cell vs. a paid cell), share no form logic, and each is independently shippable. Either
  can be cut without rewriting the other's requirements.
- No cycles: `payments-api` provides, everything else consumes.

### Interfaces at the boundary

The `roster-year` response shape and the `DELETE` semantics (what happens to `paidUntil`) are the
contract between BE and FE. Both are defined in **`SPEC-payments-api.md`** (the provider), and
consumed as given by the three FE modules.

## Module Specs

Folded into [`tasks/plan.md`](./tasks/plan.md) rather than written as four standalone `SPEC-*.md`
files, to avoid three-way duplication between spec, plan and todo:

| Module | Where its spec content lives |
|---|---|
| `payments-api` | plan.md §1 (the `roster-year` contract), §2 (`DELETE` semantics), §5 (409); todo.md Tasks 1–3 |
| `payments-grid` | plan.md §3, §6 (cell states), §7 (design approach); todo.md Tasks 4–7 |
| `payment-entry` | plan.md §4 (N sequential POSTs); todo.md Tasks 8–9 |
| `payment-delete` | plan.md §2; todo.md Task 10 |

Each module's acceptance criteria and verification steps are the corresponding tasks in
[`tasks/todo.md`](./tasks/todo.md). Ask if you'd rather have them broken out as separate spec files.
