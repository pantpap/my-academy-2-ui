# Plan: Payments Grid — Material Table + Pagination + Name Search

Spec: [`../SPEC-payments-grid-material.md`](../SPEC-payments-grid-material.md) · Todo:
[`todo-payments-grid-material.md`](./todo-payments-grid-material.md)

**Does not touch** the active [`plan.md`](./plan.md) / [`todo.md`](./todo.md), which still track
the original payments-screen capability (Checkpoint C browser verification outstanding — see
[`../CAPABILITY-MAP-payments.md`](../CAPABILITY-MAP-payments.md)). This is a follow-on refinement
to the already-shipped `payments-grid` module, not a new capability-map module.

## Context

`payments-grid` currently renders as a hand-rolled `<table>` showing every athlete in the org at
once, with no way to page through or search a large roster. The approved spec asks for:
1. Rebuilding the table on Angular Material's `MatTable` (matching the pattern already used in
   `features/customers/customer-list`).
2. Client-side pagination via `MatPaginator` (page sizes 10/25/50, default 10) over the roster
   already fetched in one call by `GET /payments/roster-year` — no backend change.
3. Client-side name search (owned by `payments-container`, filtering `payments-grid`'s roster
   before it's paginated).

## Dependency Graph / Build Order

```
Task 1: MatTable swap (no behavior change)
   └── Task 2: Client-side pagination (MatPaginator)
          └── Task 3: Name search (container input → grid filter)
                 └── Task 4: Full verification checkpoint
```

Linear — each task's state is what the next task filters or slices, so they must land in order.

## Files Involved

- `src/app/features/payments/payments-grid/payments-grid.ts` — column defs, pagination signals,
  search filtering (computed). Existing logic (`monthLabels()`, `stateFor()`, `cellAriaLabel()`,
  `paidCount()`/`totalCount()`) is reused unchanged.
- `src/app/features/payments/payments-grid/payments-grid.html` — `<table mat-table>` /
  `matColumnDef` markup (pattern to copy:
  `src/app/features/customers/customer-list/customer-list.html`), plus `<mat-paginator>`.
- `src/app/features/payments/payments-grid/payments-grid.spec.ts` — extended, not rewritten; most
  existing queries (`tbody tr`, `[data-cell-state]`) keep working since `<table mat-table>` still
  renders real `<table>/<tr>/<td>` elements.
- `src/app/features/payments/payments-container/payments-container.ts` / `.html` / `.spec.ts` —
  new search `signal<string>` + `<mat-form-field>` input, passed to `<app-payments-grid>`.
- `public/i18n/en.json`, `public/i18n/el.json` — two new keys under `payments`: `searchLabel`,
  `noSearchResults`.

**Never touched:** any backend file, `payment-form-dialog`, `payment-detail-dialog`,
`common/interfaces/payment.ts`, the `Payments` service.

---

## Task 1 — Swap to Angular Material `MatTable` (behavior-preserving)

Replace the hand-rolled `<table>` with `mat-table`/`matColumnDef` markup: one dynamic column per
month (bind `[matColumnDef]="'m' + label.number"` inside the existing `monthLabels()` loop) plus a
static `name` column made sticky via the CDK `sticky` input on `matColumnDef` (replacing the
current Tailwind `sticky left-0` classes). Cell content, icons, `data-cell-state`, and
`aria-label` move into `<td mat-cell>` templates with no change in substance. No pagination, no
search yet — pure markup/rendering-technology swap.

**Acceptance criteria:** all current `payments-grid.spec.ts` tests pass against the new markup
(row count, per-cell `data-cell-state`, `aria-label`, `cellActivated` emission, sticky name
column, paid/total summary), with selector updates only where Material's DOM genuinely differs.
Visual output unchanged.

**Verification:** `ng test` on `payments-grid.spec.ts`; dev-server visual check at `/app/payments`.

## Task 2 — Client-side pagination (`MatPaginator`)

Add `pageIndex`/`pageSize` signals in `PaymentsGrid`, a `pagedRoster` computed slicing `roster()`
(still unfiltered), and a `<mat-paginator>` wired to `(page)`. `pageSizeOptions = [10, 25, 50]`,
default `pageSize = 10`. Reset `pageIndex` to 0 whenever `roster()` changes reference (year
change) via an `effect()` reading `roster()` and calling `pageIndex.set(0)` through `untracked`.

**Acceptance criteria:** only `pageSize` rows render per page; paginator `length` = full roster
count; changing page shows the correct slice; year change resets to page 0; summary reflects the
full roster, not the current page.

**Verification:** new tests (12-athlete roster → 10 on page 0, 2 on page 2; summary unaffected);
`ng test` green; manual paginator check in the browser.

## Task 3 — Name search

Add a `searchTerm` signal in `PaymentsContainer`, a new `<mat-form-field>` input next to the year
selector, passed to `PaymentsGrid` as `searchTerm = input<string>('')`. Add a `filteredRoster`
computed (runs before `pagedRoster`): case-insensitive substring match against both
`"${firstName} ${lastName}"` and `"${lastName} ${firstName}"`. Extend the Task 2 effect to also
read `searchTerm()` and reset `pageIndex` to 0. When `filteredRoster().length === 0`, render a
`payments.noSearchResults` message instead of the table — distinct from the container's existing
`payments.emptyRoster` ("zero athletes at all") message, which stays untouched.

**Acceptance criteria:** substring/case-insensitive, either name order; empty search shows full
roster; no matches shows the empty-state message; search change resets pagination to page 0;
summary unaffected by search; new keys in both `en.json` and `el.json`.

**Verification:** new tests (both name-order matches, no-match empty state, page reset after
search from page 2, summary unaffected); new container test (typing updates the signal passed to
the grid); `ng test` green; manual check including Greek locale copy.

## Task 4 — Full verification checkpoint

No new code. Run the full `ng test` suite (not just the two touched files) to confirm no
regressions elsewhere. Manual browser pass on `/app/payments`: table + paginator + search all
work together, cell clicks still open record/detail dialogs and reload correctly, year switching
resets page/search state, Greek locale renders correctly. Confirm no backend/dialog/interface
files were touched, per the spec's boundaries.

---

## Verification Summary (end-to-end)

1. `ng test` — full suite green, no regressions outside the touched files.
2. Dev server, `/app/payments`: Material table renders with paginator; search narrows rows in
   both name-order permutations and shows an empty state on no match; paginator resets to page 0
   on search or year change; cell clicks still open the correct dialog and refresh the grid after
   save/delete; Greek locale shows translated search label and empty-state copy.
