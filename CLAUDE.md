# CLAUDE.md — Frontend Website Rules

## 🧠 Project Overview

**Trelio** is a mobile-first digital loyalty platform that replaces traditional paper stamp cards used by physical merchants (cafés, restaurants, barbershops, etc.).

Customers scan a QR code displayed by the merchant, earn points instantly, and track their progress toward rewards — without needing to install an app or create an account.

The product prioritizes:
- **simplicity**
- **speed**
- **frictionless UX**
- **real-world usability (in-store)**

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Documentation
Always use /context7-mcp when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

## README.md
ALWAYS update the documentation if necessary, so that it's always aligned with codebase.

Whenever a change on code impacts database, update the supabase/schema.sql file and write the migration file if necessary