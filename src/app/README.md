# Angular Directory Guides

This package contains detailed guides for the main directories of a typical Angular app:

- `CORE.md`
- `SHARED.md`
- `COMMON.md`
- `FEATURES.md`

## What you will find inside

For each directory, the guide explains:

- its main role
- what files usually belong there
- what should **not** go there
- best practices
- suggested structure
- practical examples

## Suggested high-level structure

```text
app/
  core/
  shared/
  common/
  features/
```

## Quick rule

- `core` → global infrastructure / singletons
- `shared` → reusable UI / presentation
- `common` → generic utilities / types / validators / constants
- `features` → business / domain functionality
