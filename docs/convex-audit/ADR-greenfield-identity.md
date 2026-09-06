# ADR: Existing-user continuity after Convex Auth cutover

**Status:** Accepted  
**Date:** 2026-09-06

## Context

Authentication moved from Supabase Auth to Convex Auth Password. ETL scripts and Supabase runtime were removed. Dev tables were observed empty.

## Decision

Treat the product as a **greenfield identity baseline**:

- Users create new Convex Auth accounts (sign up).
- No unverified email-merge of legacy Supabase users.
- Claim/reset of historical records is out of scope until an approved source snapshot exists.

## Consequences

- WZ-07 historical continuity checks are **NOT_APPLICABLE** for this release.
- If a Supabase snapshot is later restored, a separate ADR must define verified claim/reset before binding credentials to migrated `users` rows.
