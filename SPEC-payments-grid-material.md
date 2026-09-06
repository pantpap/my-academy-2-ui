# Spec: Payments Grid — Material Table + Pagination + Name Search

Proposed 2026-09-06. Single-module change to an existing, already-shipped component
(`features/payments/payments-grid`) and its container (`features/payments/payments-container`).
No backend changes. Builds on [`CAPABILITY-MAP-payments.md`](./CAPABILITY-MAP-payments.md), which
does not need a new module added — this is a refinement of the existing `payments-grid` module's
UI, not a new capability.

## 1. Objective

The payments grid (athletes × 12 months, year view) currently renders as a hand-rolled
`<table>` with every athlete in the org visible at once and no way to find one athlete quickly.
For organizations with more than a handful of athletes, this is slow to scan and doesn't match
the Angular Material look used elsewhere in the app (`customer-list` already uses `MatTable`).

**Goal:** rebuild the grid on Angular Material's `MatTable` + `MatPaginator`, and add a name
search field above it. Both pagination and search operate **client-side** over the roster array
already fetched by `GET /payments/roster-year` (no backend changes — that endpoint keeps
returning the full roster for the selected year in one call).

**Target users:** organization staff recording/reviewing payments, same audience as today.

**Out of scope:** any backend change, server-side pagination/search, changing what a cell click
does (still opens the record-payment or payment-detail dialog), changing the year selector,
changing cell visuals (paid/due/future icons stay as-is), sorting by column.

## 2. Behavior / Acceptance Criteria

### 2.1 Material table
- The roster renders via `MatTable` (`mat-table`, `matColumnDef` per column) instead of the
  current plain `<table>`, following the pattern already used in `customer-list.html`.
- Columns: `name` (sticky first column, `lastName firstName`, matches current display) followed
  by one column per month (`Jan`…`Dec`, localized via the existing `monthLabels()` /
  `TranslocoService`/`LanguageService` machinery — unchanged).
- Each month cell keeps its current three states (`paid` / `due` / `future`) with the same
  icons, `data-cell-state` attribute, `aria-label` via `cellAriaLabel()`, and click →
  `cellActivated` output — **only the table scaffolding changes, not cell behavior.**
- The sticky-name-column behavior (horizontal scroll with name pinned) is preserved.
- The paid/total summary line (`payments.summary`) stays, computed over the **full unfiltered
  roster for the year** — it must not change as the user paginates or searches (it answers "how
  much of this year is paid overall", not "how much of this page is paid").

### 2.2 Pagination
- A `MatPaginator` below the table paginates the **filtered** athlete list (see 2.3) — i.e.,
  pagination applies after search narrows the rows.
- `pageSizeOptions`: `[10, 25, 50]`, default `pageSize` = `10` (matches `customer-list`'s
  existing default `take=10`).
- Paginator shows `length` = filtered row count, and resets to page 0 whenever the search term
  changes (so a new search never lands on an empty page from a stale page index).
- Changing the year (existing `payments-container` year `<mat-select>`) also resets the
  paginator to page 0.
- No page-size persistence across navigation is required (resets to default on reload).

### 2.3 Search by name
- A `MatFormField` + text input (labelled via a new i18n key, e.g. `payments.searchLabel`) sits
  above the table, consistent placement with the year selector already in
  `payments-container.html`.
- Filtering matches case-insensitively against `firstName + ' ' + lastName` (and the reverse
  `lastName + ' ' + firstName`, so "Georgiou Kostas" and "Kostas Georgiou" both match), substring
  match — not prefix-only.
- Empty/whitespace-only search shows the full (unfiltered) roster.
- No matches shows the existing table shell with a "no results" empty state row (new copy key,
  e.g. `payments.noSearchResults`), distinct from the current "no athletes at all" empty state if
  one exists — check `payments-container` for how it currently handles an empty roster and reuse
  that pattern rather than inventing a second one.
- Search is debounce-free (client-side filter over already-loaded data, no network call) but
  must not cause a full-grid flicker on each keystroke — filtering recomputes via a `computed()`
  signal off a `signal<string>` search term, consistent with the existing signal-based style in
  `PaymentsGrid`/`PaymentsContainer`.

### 2.4 Ownership split
- `PaymentsGrid` (`payments-grid.ts`/`.html`): owns the `MatTable` markup, columns, cell
  rendering, and the `MatPaginator` UI + pagination slicing. Takes the **full roster** as input
  (as today) plus the search term (new `input<string>()`, default `''`), and internally derives
  the filtered + paginated slice for `MatTable`'s `dataSource`.
- `PaymentsContainer` (`payments-container.ts`/`.html`): owns the search `<input>` and its
  `signal<string>`, passed down to `PaymentsGrid` as an input. This mirrors the existing split
  where the container owns the year `<mat-select>` and passes `year`/`roster` down.

## 3. Tech Stack / Constraints

- Angular 21, standalone components, `ChangeDetectionStrategy.OnPush` — unchanged project
  conventions.
- Angular Material 21 (`@angular/material/table`, `@angular/material/paginator`,
  `@angular/material/form-field`, `@angular/material/input`) — all already dependencies.
- Signals-based state (`signal`, `computed`, `input`) — no `RxJS` operators introduced for the
  search filtering itself (the roster fetch stays on `rxResource` as today).
- Transloco for i18n — add new keys to both `en` and `el` translation files (find them via the
  existing `payments.*` keys used in `payments-grid.spec.ts` / the app's assets).
- Tailwind utility classes for any new layout, matching existing sibling markup style (see
  `payments-container.html`, `payments-grid.html`).
- No new npm dependencies.

## 4. Project Structure (files touched)

```
src/app/features/payments/
  payments-grid/
    payments-grid.ts        # + searchTerm input, filtered/paginated computed, MatPaginator wiring
    payments-grid.html      # <table> → mat-table/matColumnDef; add <mat-paginator>
    payments-grid.scss      # adjust sticky-column / paginator styles as needed
    payments-grid.spec.ts   # extend with pagination + search tests
  payments-container/
    payments-container.ts   # + searchTerm signal
    payments-container.html # + search <mat-form-field><input> above the grid
    payments-container.spec.ts
```

No changes to `payment.ts` (service), `payment.ts` interfaces, or any backend file.

## 5. Testing Strategy

Run via `ng test` (Angular's built-in unit-test builder). Extend the existing spec files rather
than adding new ones, following the existing `TestBed` + `TranslocoTestingModule` +
`fixture.componentRef.setInput(...)` pattern already in `payments-grid.spec.ts`.

Acceptance criteria to cover:
- Table renders via `mat-table`/`mat-row` structure (update the existing row/cell queries from
  `tbody tr` to Material's row selectors as needed) — all existing cell-state tests
  (`paid`/`due`/`future`, `cellActivated` emission, aria-labels, sticky name column) continue to
  pass against the new markup.
- Given a roster of >10 athletes, only `pageSize` rows render; the `MatPaginator` reports the
  correct `length`.
- Changing to page 2 renders the next slice of (filtered) athletes.
- Typing a search term that matches one athlete's name narrows the rendered rows to just that
  athlete, on any page.
- Search term matching in both name-order permutations (`"kostas geo"` and `"geo kostas"`-style
  partials — at minimum, confirm substring match against both concatenation orders).
- Search term matching nothing renders zero data rows plus the empty-state row/message.
- Changing the search term resets the paginator back to page 0 (test: go to page 2, search,
  assert page index is 0 / first-page rows are shown).
- The paid/total summary count is unaffected by an active search term or pagination (still
  reflects the full roster).
- `payments-container.spec.ts`: typing into the new search input updates the signal passed to
  `PaymentsGrid` (or however the existing container tests assert prop wiring to the grid, e.g.
  via a stub/fake).

Definition of Done (per `../../references/definition-of-done.md` convention used elsewhere in
this repo): `ng test` passes, no regressions in existing payments-grid/container specs, verified
in the running app (start dev server, open `/app/payments`, confirm pagination and search both
work against real data) before marking this done.

## 6. Boundaries

**Always do:**
- Preserve existing cell click behavior, aria-labels, and `data-cell-state` attributes exactly —
  `payment-entry`/`payment-delete` dialogs depend on the `cellActivated` output contract.
- Keep the paid/total summary computed over the full roster, not the filtered/paginated view.
- Add i18n keys to both locales (`en`/`el`) — this app is bilingual throughout.
- Reset the paginator to page 0 on search-term change and on year change.

**Ask first about:**
- Any change to `GET /payments/roster-year`'s contract or introducing a `search`/`page`/`take`
  query param on it (this spec deliberately keeps that endpoint untouched — flagged in the
  clarifying question as the rejected alternative).
- Adding column sorting, since it wasn't requested and touches the same `MatTable` scaffolding.
- Changing the default page size away from 10 or the `[10, 25, 50]` options.

**Never do:**
- Don't change the record-payment / payment-detail dialog flows (`payment-form-dialog`,
  `payment-detail-dialog`) — out of scope.
- Don't touch the backend (`BE/my-academy-2-be`) for this change.
- Don't remove or rename the existing `RosterYearEntry`/`RosterYearMonth` interfaces or the
  `Payments` service methods.
