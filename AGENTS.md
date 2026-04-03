# Agent Instructions

## Pre-Commit Requirements

**ALWAYS run tests before committing changes:**
- Run `npm test` before any `git commit`
- Fix all test failures before committing
- If tests fail after a rename/refactor, update both source AND test assertions

## Testing Commands

```bash
npm test    # Run full test suite
```

## General Guidelines

- Make minimal changes to achieve the goal
- Follow existing code style in the project
- Do not commit files that contain secrets (.env, credentials.json, etc.)
- Prefer readability over terseness within reason

## Commit Message Guidelines

Use conventional commit prefixes:
- `feat:` — New feature or functionality
- `fix:` — Bug fix
- `docs:` — Documentation changes only
- `style:` — Code style changes (formatting, semicolons, etc.)
- `refactor:` — Code refactoring without changing functionality
- `test:` — Adding or updating tests
- `chore:` — Maintenance tasks (build, deps, etc.)
