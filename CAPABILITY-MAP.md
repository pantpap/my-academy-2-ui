# Capability Map: Customer Edit Dialog Fix

Approved 2026-08-26.

## Background

`CustomerFormDialog` (`src/app/features/customers/customer-form-dialog/`) was scaffolded as a
static shell in a prior pass (see `tasks/plan.md` / `tasks/todo.md`, checkpoint "Complete"): it
renders 5 unbound `<input>` fields and opens correctly from both the customer list ("+ New") and
the customer details page ("Edit") — but nothing is bound, nothing populates on edit, and Save
does nothing. That prior plan explicitly deferred "the form logic" to a human. This capability
map covers building that logic, plus adding address and sports as genuinely new editable fields
(the trigger for this work: the user could not edit a customer's address because the field never
existed anywhere in the system).

Discovered along the way and folded into scope:
- The `Customer` model has no `address` concept at all — not FE, not BE. It needs a real
  backend change, not just a FE form field.
- `customer-details.ts` already contains an unused `form()` (signal-forms, validators, a
  `submission.action` that calls `createCustomer`/`updateCustomer`) that is never rendered in its
  template — dead code from before the dialog approach was adopted. `dialog-core` ports this
  logic into the dialog; `dialog-consolidation` deletes it from `customer-details.ts`.
- Sport assignment already works end-to-end on the backend (`sportIds?: number[]` on
  `PATCH /athletes/:id`) — no backend change needed for `dialog-sports`, only a small new FE
  service to list available sports plus UI.
- `paidUntil` is a derived side effect of recording a `Payment`, not a directly editable field.
  It stays **read-only** in the dialog. Recording payments is an explicitly separate, future
  capability — **out of scope** for this map.

## Module Map

| Module id | Responsibility | Depends on | Repo |
|---|---|---|---|
| `backend-address` | Add structured address (`street`, `city`, `postalCode`, `country`) to the `Athlete` entity, `Create`/`UpdateAthleteDto`, and `mapAthleteToResponse()` | — | BE (`my-academy-2-be`) |
| `dialog-core` | Make `CustomerFormDialog` functional: signal-form bound to the 5 existing fields, populated from `data.customer` in edit mode, working save via `CustomerService.createCustomer`/`updateCustomer`, closes with the saved `Customer`. Shows `paidUntil` read-only. | — | FE (`my-academy-2-UI`) |
| `dialog-address` | Add address fields to the FE `Customer` model, the dialog form, and the create/update payload mapping | `backend-address`, `dialog-core` | FE |
| `dialog-sports` | Add sports multi-select editing to the dialog, backed by a new minimal FE service that lists an organization's sports (`GET /sports`) | `dialog-core` | FE |
| `dialog-consolidation` | Delete the dead `form()`/`model`/`toFormModel`/`toCustomerPayload` code from `customer-details.ts`; details page refreshes from the dialog's closed result instead | `dialog-core`, `dialog-address`, `dialog-sports` | FE |

**Build order:** `backend-address` and `dialog-core` in parallel → `dialog-address` and
`dialog-sports` in parallel → `dialog-consolidation`

**Explicitly out of scope:** recording payments, directly overriding `paidUntil`.

## Module Specs

- [SPEC-backend-address.md](../BE/my-academy-2-be/SPEC-backend-address.md) *(lives in the BE repo)*
- [SPEC-dialog-core.md](./SPEC-dialog-core.md)
- [SPEC-dialog-address.md](./SPEC-dialog-address.md)
- [SPEC-dialog-sports.md](./SPEC-dialog-sports.md)
- [SPEC-dialog-consolidation.md](./SPEC-dialog-consolidation.md)
