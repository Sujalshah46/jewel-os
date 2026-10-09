# Data migration and rollback notes

The first operational schema intentionally starts empty. Existing browser `localStorage` values are not imported, reassigned, or used to create user grants. Customer KYC, role labels, provider settings, stock, invoices, payment assertions, journals, and backups remain local synthetic-demo data.

The browser demo's JSON snapshot is versioned separately from the operational PostgreSQL schema. Version 1 includes the receipt, stock movement, general ledger, karigar voucher, and scheme enrollment histories; checks collection types, unique IDs, selected stable references, and active firm/client/branch links before state setters run; and redacts named customer KYC, firm bank/e-invoice, and provider key fields. The known pre-versioned `2.7.364 Pro` shape is upgraded deterministically; histories that the old export omitted become empty and the first firm/client/branch become active. Restore and demo reset offer a redacted pre-change snapshot first. These browser files are not complete database backups and do not establish durable or failure-atomic recovery.

Before any future import, build a separately reviewed reconciliation tool that:

1. Reads an exported copy without modifying browser storage.
2. Preserves an untouched archive and records a content hash.
3. Quarantines rows whose tenant/firm ownership is missing, conflicting, duplicated, or not independently verified.
4. Excludes KYC, role grants, and provider credentials until an approved privacy/identity/secret migration exists.
5. Reconciles customer links and balances against independently verified source records; the current local records are not authoritative.
6. Produces a dry-run report and requires explicit review before importing synthetic or verified customer records.

Migrations in `db/migrations` are additive after the initial schema. Apply with `npm run db:migrate`; back up PostgreSQL first. A rollback should restore a verified database backup or use a reviewed forward migration. Do not drop tables or attempt to reverse identity/customer foreign keys during a live rollback. The initial migration is the first operational schema, not a conversion of local browser data.
