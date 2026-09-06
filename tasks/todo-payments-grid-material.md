# TODO: Payments Grid — Material Table + Pagination + Name Search

Plan: [`plan-payments-grid-material.md`](./plan-payments-grid-material.md) · Spec:
[`../SPEC-payments-grid-material.md`](../SPEC-payments-grid-material.md)

Does not touch the active [`todo.md`](./todo.md) (original payments-screen capability,
Checkpoint C still outstanding). Record the current `ng test` baseline before Task 1 and compare
against *that*, not against zero, if any pre-existing failures are found.

---

## Task 1: Swap `payments-grid` to Angular Material `MatTable` — ✅ DONE

**Description:** Replace the hand-rolled `<table>` in `payments-grid.html` with
`mat-table`/`matColumnDef` markup (pattern: `customer-list.html`). One dynamic column per month
(`[matColumnDef]="'m' + label.number"` inside the `monthLabels()` loop) + a static `name` column
made sticky via the CDK `sticky` input. Cell content (icons, `data-cell-state`, `aria-label`)
moves into `<td mat-cell>` unchanged in substance. **No pagination or search yet.**

**Acceptance criteria:**
- [x] Renders via `mat-table`/`matColumnDef`, not a plain `<table>`.
- [x] One row per athlete, 12 month cells each (unchanged from today).
- [x] Paid/due/future cell states keep their icons, `data-cell-state` attribute, and
      `cellAriaLabel()`-driven `aria-label`.
- [x] Clicking a cell still emits `cellActivated` with `{ athlete, month }`.
- [x] Name column stays sticky during horizontal scroll (Material applies class
      `mat-mdc-table-sticky`, not the plain `sticky` Tailwind class used before — test updated
      accordingly).
- [x] Paid/total summary line unchanged.

**Verification steps:**
1. `ng test` — all 9 `payments-grid.spec.ts` tests pass. One selector updated: the sticky-column
   test now checks for `mat-mdc-table-sticky` (Material's actual applied class) instead of the
   old Tailwind `sticky` class.
2. Full `ng test` run: 129 passed / 11 pre-existing failures, all in files untouched by this task
   (customer-details, customer-list, sidebar, customer service) — matches this repo's documented
   pre-existing baseline, not a regression.
3. `ng build` — compiles cleanly.
4. Dev server → `/app/payments`: **not visually confirmed in this session** (no browser-automation
   tool available); user has a dev server running locally and can check directly.

**Checkpoint:** Confirm identical rendering/behavior before starting Task 2. Do not proceed with
pagination on top of an unverified table swap.

---

## Task 2: Client-side pagination (`MatPaginator`) — ✅ DONE

**Description:** Add `pageIndex`/`pageSize` signals to `PaymentsGrid`, a `pagedRoster` computed
slicing the (still unfiltered) `roster()`, and a `<mat-paginator>` under the table wired to
`(page)`. `pageSizeOptions = [10, 25, 50]`, default `pageSize = 10`. Add an `effect()` that reads
`roster()` and resets `pageIndex` to `0` (via `untracked`) whenever the roster reference changes
(i.e., on year change).

**Acceptance criteria:**
- [x] Only `pageSize` (default 10) rows render per page.
- [x] `MatPaginator`'s `length` equals the full (unfiltered) roster count.
- [x] Navigating to another page renders the correct slice of athletes.
- [x] Changing the selected year resets pagination to page 0 (verified via a roster-input change,
      which is what a year change produces in `payments-container`).
- [x] Paid/total summary still reflects the full roster, not just the current page.

**Verification steps:**
1. New tests in `payments-grid.spec.ts` (5 added, all passing):
   - Roster of 12 athletes → exactly 10 rows render on page 0.
   - Clicking the paginator's next-page button → remaining 2 rows render.
   - Paginator's `length` reflects the full roster count (12), not the current page.
   - `paidCount()`/`totalCount()` stay correct regardless of current page (144 = 12×12).
   - Navigating to page 2 then changing the `roster` input resets rendering to page 0.
2. `ng test` full suite: 134 passed (+5 from before), same 11 pre-existing unrelated failures —
   no regressions.
3. `ng build` — compiles cleanly.
4. Dev server manual check: **not performed this session** (no browser-automation tool
   available) — user can verify at `/app/payments` with a roster >10 athletes.

**Checkpoint:** Pagination correct over the full roster before search narrows what's paginated.

---

## Task 3: Name search — ☐ TODO

**Description:** Add a `searchTerm` signal to `PaymentsContainer`, a new `<mat-form-field>` text
input next to the year `<mat-select>` in `payments-container.html`, passed to `PaymentsGrid` as
`searchTerm = input<string>('')`. Add a `filteredRoster` computed in `PaymentsGrid` (runs before
`pagedRoster`): case-insensitive substring match against `"${firstName} ${lastName}"` and
`"${lastName} ${firstName}"`. Extend the Task 2 effect to also read `searchTerm()` and reset
`pageIndex` to 0 on change. When `filteredRoster().length === 0`, show a `payments.noSearchResults`
message instead of the table (separate from the container's existing `payments.emptyRoster`
"zero athletes at all" message — leave that check alone). Add `searchLabel` and
`noSearchResults` keys to both `public/i18n/en.json` and `public/i18n/el.json`.

**Acceptance criteria:**
- [ ] Search matches case-insensitively, substring, against both name-order permutations.
- [ ] Empty/whitespace-only search shows the full roster.
- [ ] A search matching nothing shows the empty-state message, not a blank table.
- [ ] Changing the search term resets pagination to page 0 (even from page 2+).
- [ ] Paid/total summary is unaffected by an active search term.
- [ ] New i18n keys present and correct in both `en.json` and `el.json`.

**Verification steps:**
1. New tests in `payments-grid.spec.ts`:
   - Search term matching one athlete narrows to just that row, tested in both name-order forms
     (e.g. `"kostas geo"` and `"geo kostas"`-style substrings).
   - Search term matching nothing → zero data rows + empty-state message.
   - From page 2, entering a search term returns to page 0 / first-page results.
   - Summary count unchanged with an active search term.
2. New test in `payments-container.spec.ts`: typing into the search input updates the value
   passed down to `PaymentsGrid` (follow the existing dialog-stub/query pattern already used in
   that spec file).
3. `ng test` green.
4. Dev server manual check: type partial names in both orders, confirm narrowing and the
   no-results state; switch to Greek and confirm translated label/message.

**Checkpoint:** Pagination + search work together correctly (search-then-paginate ordering, page
resets on either search or year change) before final verification.

---

## Task 4: Full verification checkpoint — ☐ TODO

**Description:** No new code. Final go/no-go pass.

**Verification steps:**
1. Run the **full** `ng test` suite — confirm no regressions outside `payments-grid`/
   `payments-container` (baseline recorded at the top of this file).
2. Manual browser pass on `/app/payments`:
   - Material table + paginator render correctly.
   - Search narrows rows correctly and resets pagination.
   - Cell clicks still open the record/detail dialogs; grid still reloads after save/delete.
   - Switching year resets page/search state as expected.
   - Greek locale shows translated search label and empty-state copy.
3. Confirm no backend file, dialog file, or shared interface (`common/interfaces/payment.ts`,
   `shared/services/payment/payment.ts`) was touched.

**Checkpoint:** Mark this todo file's tasks done only after this full pass — mirrors this repo's
own precedent of not marking `payments-grid` "shipped" until its browser-verification checkpoint
(Checkpoint C in the original `todo.md`) is done.
