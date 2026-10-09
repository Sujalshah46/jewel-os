# Operational customer slice: local development

This is an isolated local workflow. Use synthetic users and customer records only. The API refuses to start without PostgreSQL, `BETTER_AUTH_SECRET`, matching `BETTER_AUTH_URL`/`APP_ORIGIN`, and applied tenant/customer tables. In production the app origin must use HTTPS. Do not use production records or credentials in this setup.

## Install and database

Install packages with the lockfile using `npm ci`. Start an isolated PostgreSQL 16 database, then set a private `.env.operational` file based on `.env.operational.example`. Keep the real file untracked and limit its permissions. `APP_ORIGIN` and `BETTER_AUTH_URL` must match; for the local Vite proxy both are `http://localhost:3000`, while the API listens on port 4000. Use a random `BETTER_AUTH_SECRET` with at least 32 characters. `DATABASE_URL` must point to the local database.

Apply schema versions with:

```bash
npm run db:migrate
```

Provision an initial tenant owner from environment variables (`OPERATOR_EMAIL`, `OPERATOR_NAME`, `OPERATOR_PASSWORD`, and `TENANT_NAME`) with:

```bash
npm run operator:provision
```

The command does not start a web server. Public sign-up stays disabled in `server:operational`.

## Run

In one terminal, start the API:

```bash
npm run server:operational
```

In another terminal, start the operational UI:

```bash
npm run dev:operational -- --host 0.0.0.0
```

Open the environment's supported preview for port 3000. The UI only contains authenticated tenant membership selection and server-backed customer list/read/create/update/archive actions. The API also provides tenant-scoped branch/stock endpoints and provisional sale/receipt/report operations, but no inventory or billing screen is exposed in the UI. Transfers, supplier purchases, returns, repayments, tag/RFID tools, schemes, Girvi, karigar, integrations, and the legacy admin console remain unavailable in this mode. Unsupported operational API paths return `FEATURE_UNAVAILABLE` across reads and mutations. Stop only processes started for this local session when finished.

## Inventory API foundation

An owner-provisioned tenant receives a `Main` branch. Owners/managers may create branches and stock records using the authenticated session, selected `X-Tenant-Id`, and session CSRF token. `POST /api/stock` requires a branch, stable item code, quantity, weights in integer milligrams, purity in basis points, catalog quote in integer paise, and a reason. Initial receipt and every quantity adjustment append an attributed `stock_movement` row in the same database transaction as the quantity change. Adjustments require an expected current quantity and reject stale or negative outcomes. Stock branch/item relationships use composite tenant foreign keys; list/history queries are bounded and tenant-scoped.

`catalogPricePaise` is only the current catalog quote. The sale endpoint recalculates amounts from persisted pricing inputs and transactionally records an invoice snapshot, stock decrement/movement, tender records, and balanced ledger entries. `POST /api/invoices/:id/cash-settlements` accepts a positive cash amount only; it locks the invoice, rejects overpayment, creates an idempotent numbered receipt, updates the outstanding balance from received cash/old-metal history, and posts matching cash/receivable journal entries. These posting rules use the current demo assumptions provisionally; bank transfers remain pending, not received. No accountant has approved the tax/settlement contract, and the PostgreSQL integration suite is exercised locally by npm run test:all; external CI and production configuration still need verification. Do not record real inventory or use these endpoints for business operations until those checks and approvals pass.

`GET /api/reports/trial-balance` returns exact-paise posted ledger movements for the selected tenant, with optional inclusive `from` and `to` dates interpreted in `Asia/Kolkata`. It refuses invalid entries or periods whose debit and credit totals differ. It is a trial balance of recorded movements, not a complete P&L, balance sheet, or stock valuation report; opening balances and other accounting lifecycles are not implemented.

## Checks

The original synthetic-demo checks remain:

```bash
npm test
npm run build:demo
```

Operational tests require three disposable loopback PostgreSQL databases named with `_test`, `_upgrade_test` and `_restore_test` suffixes. Create those databases before running the command and export `TEST_DATABASE_URL`, `UPGRADE_DATABASE_URL` and `RESTORE_DATABASE_URL` to them. The preparation script refuses to reset non-loopback hosts or names without the test suffix. It runs Drizzle migrations in the fresh database, applies initial and follow-up migrations over a populated upgrade fixture, then exercises HTTP sessions, authorization, tenant isolation, strict schemas, inventory concurrency, sale finalization/replay, ledger balance, pagination, CSRF, logout, and session expiry.

`.github/workflows/verify.yml` provisions disposable PostgreSQL 16 databases and runs `npm run test:all`, then builds both demo and operational modes on pull requests targeting `main`. The first remote run and any repository branch-protection requirement must still be verified in GitHub.

```bash
npm run test:operational
```

A browser flow can be checked with Python Playwright using the operational UI/API running and a synthetic owner provisioned for two synthetic tenants. Set `OPERATIONAL_TEST_URL`, `OPERATIONAL_TEST_EMAIL`, `OPERATIONAL_TEST_PASSWORD`, `OPERATIONAL_TEST_TENANT_A_LABEL`, `OPERATIONAL_TEST_TENANT_B_LABEL`, and `OPERATIONAL_TEST_TENANT_B_CUSTOMER`. If Chromium is installed outside Playwright's default browser cache, also set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, then run:

```bash
python tests/operational-ui-smoke.py
```

It checks customer creation, tenant switch cleanup, draft discard, that no legacy demo module or local ERP storage is loaded, and a direct request with a random unauthorized tenant ID returning 403.

## Operational hardening and local verification

The initial SQL migration now creates referenced unique indexes before foreign keys; this changes ordering, not the intended schema. New migrations add database-backed authentication throttling and disabled identities. Apply all migrations before starting; readiness checks required operational tables/columns. The SQL/HTTP suite includes transaction rollback, duplicate invoice keys, simultaneous sale/receipt contention, tenant and role denials, expiry/revocation, disabled identities and forged-IP throttle attempts. The expanded recovery drill uses PostgreSQL 16 pg_dump/pg_restore; install those client tools for `test:all`. No migration downgrade is supplied.

Stock pricing uses integer paise/milligrams/basis points with BigInt intermediates. Per-gram making charges use gross weight; metal uses net weight at the supplied purity-specific catalog rate; making/metal/GST components round half-up, with residual GST allocated to SGST. Old-metal settlement is restricted to managers/owners and remains subject to accountant approval. The operational UI is intentionally a customer vertical slice; a production POS user interface is not exposed.

Login throttling is stored atomically in PostgreSQL and uses Express's resolved client address. TRUST_PROXY defaults to empty (no trust), ignoring caller forwarding headers. For a reviewed proxy topology, set TRUST_PROXY to a comma-separated allowlist of the actual proxy IP addresses/CIDRs only. Boolean blanket trust, hop counts, hostnames and /0 networks are rejected. Restrict direct backend access and verify that the proxy overwrites incoming forwarding headers; never list arbitrary customer address ranges. Express walks the proxy chain from the socket to the nearest untrusted hop. Behind an unconfigured proxy all clients share its bucket. The service logs request IDs, route patterns, timing/status and sanitized error codes without bodies, cookies, passwords or customer values. Deploy log/alert collection and set database roles/transport to least privilege. See recovery-runbook.md for retention, maintenance and external readiness gates.
