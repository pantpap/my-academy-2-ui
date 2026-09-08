# Capability Map: Payments Season View (Sep→Jun)

Proposed 2026-09-08. Placed alongside
[CAPABILITY-MAP-payments.md](./CAPABILITY-MAP-payments.md) (Payments Screen, approved 2026-09-05,
status: all four modules built) and [CAPABILITY-MAP.md](./CAPABILITY-MAP.md) (Customer Edit
Dialog Fix). Refines the payments grid built by that prior map — same screen, same components,
not a rebuild.

## Background

The payments grid (`/app/payments`) currently shows a calendar year (Jan–Dec) selected from a
year dropdown. The org's actual billing cycle is an academic season, September through June —
July/August have no fees and clutter the grid, and the calendar-year framing doesn't match how
staff think about "this year's" payments.

Trigger: user request — *"months should start in September and end in June; every month shown
should be payable."*

**What already exists — reuse it:**
- `GET /payments/roster-year?year=` and `RosterYearEntry`/`RosterYearMonth` (FE) stay as-is —
  nothing currently depends only on them outside `payments-grid`/`payments-container`/the two
  payment dialogs, all four of which this map changes anyway. Left in place rather than deleted,
  since deleting live backend code/routes is a separate, explicit decision (see Boundaries).
- `POST /payments` / `DELETE /payments/:id` — unchanged. A season month posts/deletes exactly
  like a calendar month does today; `coveredMonth`/`coveredYear` on `Payment` already support any
  month/year pair, including ones that don't match the "selected year".
- The paid/due cell-click → dialog wiring in `payments-container.ts` — unchanged shape, just
  retyped.

**Decisions approved 2026-09-08 (via clarifying questions):**

| Decision | Choice |
|---|---|
| Season crossing the calendar-year boundary | New backend endpoint/param for "season" (not a two-call FE stitch) |
| Year selector display | Season label, e.g. `"2026-27"` |
| Future months (after today) within the shown season | All clickable/payable as `due` — the `future` cell state is retired entirely for this grid |

**Assumption flagged for confirmation, not yet approved — default season shown on load:**
Sep–Dec → that calendar year is the current season's start year. Jan–Jun → current year minus 1.
**Jul/Aug (no season in progress)** → defaults to the *upcoming* season (current calendar year),
on the theory that staff opening the grid over summer are prepping for the season about to start,
not closing out the one that just ended. Flag if the opposite is wanted.

**Explicitly out of scope:** deleting/deprecating `GET /payments/roster-year` and the calendar-year
`RosterYearEntry`/`RosterYearMonth` types (left in place, just unused by this screen after this
change); changing `POST /payments`/`DELETE /payments/:id`; a per-organization configurable season
start month (hardcoded Sep→Jun); the `customer-list` "this month" payment column; the
`payments.status`/`roster-status` endpoints (single-month/single-athlete, unrelated to this grid).

## Module Map

| Module id | Responsibility | Depends on | Repo |
|---|---|---|---|
| `payments-season-api` | New `GET /payments/roster-season?startYear=` endpoint returning every athlete with a 10-slot month array (Sep `startYear` → Jun `startYear+1`, each slot carrying its own `month` **and** `year`) in one query. No schema/migration change — `Payment.coveredMonth`/`coveredYear` already support arbitrary pairs. | — | BE (`my-academy-2-be`) |
| `payments-season-grid` | Retype and rewire `payments-grid`, `payments-container`, `payment-form-dialog`, `payment-detail-dialog` from calendar-year to season: season-label selector, 10 Sep→Jun columns, `future` cell state retired (all unpaid season months render/behave as `due`), multi-month record dialog carries a `year` per selected month (needed since a season spans two calendar years) instead of one shared `year`. | `payments-season-api` | FE (`my-academy-2-UI`) |

**Build order:** `payments-season-api` → `payments-season-grid` (hard dependency: the FE module
calls the new endpoint and consumes its per-month `year` field, which doesn't exist on the old
`roster-year` response).

### Why these boundaries

- **Same split as the original payments capability map** (`payments-api` → `payments-grid`):
  different repo, different test runner, and the API shape (which month/year pairs a season
  spans) is a contract the FE must consume as given, not derive independently — verifiable purely
  with a BE integration test, no UI needed.
- **Not split further on the FE side** (e.g. grid vs. dialogs as separate modules) because the
  `year`-per-month change is a single coupled contract change: `RosterSeasonMonth.year` is
  produced by the grid's data (from the container) and consumed by both dialogs in the same
  save/delete flow. Splitting them would leave an unbuildable intermediate state.

### Interfaces at the boundary

The `roster-season` response shape (`RosterSeasonEntry[]`, each `months[]` entry carrying its own
`year`) is the contract between BE and FE, defined in **`SPEC-payments-season-api.md`** (the
provider) and consumed as given by `payments-season-grid`.

## Module Specs

- [SPEC-payments-season-api.md](../BE/my-academy-2-be/SPEC-payments-season-api.md) *(lives in the BE repo, per precedent set by `SPEC-backend-address.md`)*
- [SPEC-payments-season-grid.md](./SPEC-payments-season-grid.md)
