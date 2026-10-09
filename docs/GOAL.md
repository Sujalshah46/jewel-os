# Goal: remediate the complete CodeRabbit production-readiness audit

## Goal statement

Close every repository-fixable finding in `jewelry-os-audit/REPORT.md`, or explicitly exclude the affected workflow from any real-operations product mode with a tested server-side gate. Preserve the current React stack and synthetic demo. Do not import unverified browser data, deploy, process live payments, or claim pilot/production readiness without the external release evidence listed below.

## Audit sources and current baseline

- CodeRabbit audit archive: `/tmp/jewel-os-audit/jewelry-os-audit/REPORT.md` and `NEXT_TASK.md`.
- Original audited commit: `5799decc941845bc692de49154bf520d4003582e`.
- The previous bounded goal implemented the first authenticated tenant/customer slice. Its code changes are present in the current worktree; this plan does not treat that slice as completion of the full report.
- Initial review for this goal was performed before new remediation. Latest verification at plan creation: `npm test`, `npm run build`, `npm run build:operational`, and `git diff --check` passed. Operational database/API tests were documented as passing earlier in this task, but could not be rerun during this review because `TEST_DATABASE_URL` and `UPGRADE_DATABASE_URL` are unset.

## Latest finding-by-finding status

`Partial` means the existing customer-only server boundary or demo containment reduces risk only within that slice; it does not close the report finding for the broader ERP workflow.

| Finding | Current status | Evidence / remaining work |
|---|---|---|
| SEC-001 Authentication and roles | Partial | Better Auth sessions and server membership/role checks protect customer API. Staff, firm, stock, invoice, and other mutations still exist only in the untrusted demo provider; full identity lifecycle and server authorization remain. |
| SEC-002 Tenant ownership | Partial | Customer API queries are tenant-scoped. Other business entities, references, exports, and firm/branch switching are not migrated or enforced server-side. |
| SEC-003 KYC and provider secrets | Partial | New credential entry was removed and operational customer responses omit secrets. Local demo snapshot exports/imports redact named KYC, bank, and provider credential fields, but existing browser storage may retain values; retention, deletion, secure migration, and full leakage tests remain unresolved. |
| DB-001 Atomic/concurrent persistence | Partial | Tenant-scoped stock and sale APIs now use PostgreSQL transactions, row locks/conditional updates, idempotency, and an atomic journal. Returns, repayments, purchasing, transfers, and recovery do not have equivalent server transactions. API/database integration tests have not been rerun in this environment. |
| DB-002 Backup and restore | Partial | Local demo snapshots now use a versioned schema, include omitted histories, redact named sensitive fields, validate IDs/references before any state update, and upgrade the known legacy export shape. Restore/reset downloads a redacted pre-change snapshot; the generic error-boundary data wipe is removed. Operational database backup/restore, durable atomic replacement, migration fixtures, and a recovery drill remain unimplemented. |
| DB-003 IDs and fiscal numbers | Partial | Operational invoices use database UUIDs and tenant/FY-scoped counters in the sale transaction. Repayment, return, and other numbering remain unimplemented. |
| FIN-001 Server-derived finalization | Partial | An operational sale endpoint validates tenant references, recalculates amounts from persisted price inputs, and atomically commits sale, stock, invoice, payment, and ledger rows. Database behavior still needs integration verification; other settlement workflows are not implemented. |
| FIN-002 Balanced journals | Partial | Finalization asserts balanced paise postings for cash, old metal, receivable, revenue, CGST, and SGST. This is a provisional demo-rule mapping; accountant approval and other settlement/account lifecycles remain open. |
| FIN-003 Repayment settlement truth | Partial | A provisional operational cash receipt endpoint now locks the invoice, calculates balance from received tenders, issues an idempotent tenant/FY receipt number, and posts matching cash/receivable entries. It has not passed PostgreSQL integration tests; loans and non-cash settlement confirmation remain disabled. |
| FIN-004 Ledger-backed reports | Partial | A tenant-scoped, date-filtered trial-balance API now aggregates posted ledger entries and refuses invalid/out-of-balance periods. The complete statements suite, legacy demo plugs, and PostgreSQL integration verification remain. |
| FIN-005 Tax precision and zero-rate behavior | Partial | Explicit 0% GST remains zero and CGST/SGST reconcile to rounded GST; server pricing stores paise snapshots. Full worked-example and database tests remain. |
| FIN-006 Immutable invoice issuer/zero values | Partial | Operational invoices store issuer and priced-line snapshots, including zero tax. Legacy invoice rendering/reprint immutability is not fully corrected. |
| FIN-007 Pricing-field/product-type wiring | Partial | Operational stock pricing feeds the shared calculation helper; catalogue estimate/billing handoff preserves selected values. Product-specific strategies and UI migration remain. |
| INV-001 Stock IDs, quantities, movements | Partial | Tenant/branch-owned stock, opening receipt, movement history, and optimistic adjustments are implemented in the operational API. Database/concurrency tests need to run; UI migration is incomplete. |
| INV-002 Transfer custody/firm integrity | Excluded from operational mode | Operational UI has no transfer workflow and transfer routes return `FEATURE_UNAVAILABLE` for read and mutation methods. The legacy demo's local branch transfer action is not transactional and is not approved for real inventory. |
| INV-003 Purchasing and returns | Excluded from operational mode | Operational UI has no purchase/return screens or APIs; tested routes return `FEATURE_UNAVAILABLE`. Supplier payables and linked sale reversals remain unimplemented. |
| INV-004 Encoded tags/RFID claims | Partial | The demo tag screen now calls itself a layout preview and discloses that QR art, barcodes, HUID/hallmark, RFID, and printer compatibility are unverified. Tag/RFID tools are absent from operational UI and routes; verified encoded payloads are still not implemented. |
| EXT-001 Schemes/Girvi/karigar accounting | Excluded from operational mode | Operational UI has no screens and the corresponding routes return `FEATURE_UNAVAILABLE` for read and mutation methods. Legacy demo workflows remain synthetic and have no reconciled lifecycle. |
| OPS-001 Honest simulations | Partial | Integration and messaging actions label synthetic activity and do not claim provider delivery. Market/rate-board copy now identifies sample data as non-official and non-BIS-certified; item lookup and tag layouts disclaim hardware/payload verification. Operational mode excludes these paths. Real providers and approved rate provenance remain unimplemented. |
| OPS-002 Audit and policy enforcement | Partial | Customer archive stores attribution. Legacy audit and policy surfaces now disclose that they are synthetic/unverified/un-enforced; actual immutable audit records and policy enforcement remain. |
| OPS-003 Behavioral tests and release gates | Partial | Actual HTTP tests cover the customer slice; legacy source-string/copy-function checks remain, broader business invariants and mandatory CI are absent. |
| OPS-004 Recovery and operations | Partial | Local migration/startup instructions exist. Backup/restore, monitoring, alerting, RPO/RTO, support/offboarding, and deployed configuration are unverified. |
| SEC-004 Dependency advisories | Partial | Removed unused Vercel CLI, pinned path-to-regexp/esbuild, and upgraded Vite to a patched compatible major. Clean install passes and `npm audit --omit=dev` reports zero advisories. Full audit still reports 7 development findings (6 high, 1 moderate), mainly Tailwind 3 dependencies; Tailwind 4 requires a reviewed framework migration. |
| SEC-005 Spreadsheet-safe rate export | Fixed in demo export | Shared serializer quotes/escapes cells and neutralizes formula-leading text; numeric cells remain numeric. CSV and Excel-compatible CSV now use `.csv`. Added injection cases to regression tests. |
| UX-001 Daily diary date handler | Fixed | Date selection now updates the source date only; historical status is derived. Browser exercised archive and non-archive date changes without runtime errors. |
| PERF-001 Capacity/localStorage bottlenecks | Partial | Customer API is server-paginated; the legacy demo still serializes/filter-processes whole collections and has no measured capacity budget. |
| UX-002 Catalogue estimate/billing handoff | Fixed in demo flow | Catalogue estimates preserve the selected line/grand total (including zero); Bill This Item transfers one in-stock item and selected amount into the cart. Helper tests and browser flow passed. |

## Implementation plan and acceptance gates

### Phase 1 — Close standalone correctness and truthful-demo issues

- [x] Fix UX-001 and exercise archive and non-archive dates in Chromium.
- [x] Add a shared CSV cell serializer and fix SEC-005; test formula prefixes, delimiters, quotes, newlines, tabs, and carriage returns.
- [x] Fix UX-002 with an explicit catalogue-to-estimate/cart data contract and tests for zero and nonzero prices; exercise estimate and bill handoff in Chromium.
- [x] Remove misleading success/connected claims in the audited demo integration, MCX-rate, and messaging paths; operational mode continues to exclude these modules.
- [x] Remove or clearly label unsupported legacy audit verification, policy-save, and period-closure claims until an authoritative implementation exists.

### Phase 2 — Extend the trusted tenant boundary to inventory and sales

- [x] Add tenant-owned product/stock, movement, invoice, line, payment/receipt, and numbering schema with additive migrations and tenant-consistent foreign keys.
- [x] Implement server-authoritative inventory reads/writes and sale finalization. Recalculate totals from validated inputs; enforce stable identifiers, conditional quantity updates, exact amounts, and idempotency in one transaction.
- [x] Define tenant-scoped authorization for implemented stock, invoices, and branches. The customer-only operational UI clears its customer draft/edit state on tenant changes; no cart exists in this UI. The API has no export route.
- [x] Keep unsupported workflows unreachable in operational mode; the standalone HTTP feature-gate test verifies unimplemented operational paths return `FEATURE_UNAVAILABLE`.
- [ ] Run the PostgreSQL acceptance suite for auth, tenant isolation, concurrent inventory changes, and sale replay; it has not run in this environment.
- **Acceptance:** anonymous/disabled/expired users denied; tenant A cannot read or mutate B through IDs, filters, nested references, exports, or stale UI state; concurrent sale/replay/fault tests preserve exactly one complete sale; numbering is unique across tenants, financial years, and business-date boundaries.

### Phase 3 — Establish approved pricing, settlement, and accounting invariants

- [x] Create a provisional server-side pricing contract for supported demo jewellery pricing and persist invoice snapshots (FIN-005–007).
- [x] Recompute and validate totals, discounts, tax, payments, credit, and referenced customers/items at sale finalization (FIN-001).
- [ ] Obtain accountant review of the provisional cash, bank-pending, debtor, exchange-metal, tax, rounding, refund, and advance posting rules (FIN-002).
- [x] Add a provisional cash receipt lifecycle linked to invoices; derive the current balance from received tender history without changing issued pricing snapshots (FIN-003).
- [ ] Run PostgreSQL integration cases for partial collection, replay, overpayment, and concurrent receipt attempts; get accountant review before operational use.
- [x] Add a tenant-scoped trial-balance report from the operational journal with exact-paise reconciliation and date filters (FIN-004).
- [ ] Add independently reconciled P&L/balance-sheet/stock reports and remove legacy demo plug/estimate “reconciled” claims (FIN-004).
- **Acceptance:** exact-paise worked examples including explicit zero tax; all valid journals balance; invalid/forged totals and references reject; invoice/customer/report balances reconcile; historical issuer and zero-valued fields remain stable after later firm edits.

### Phase 4 — Complete recovery, imports, and legacy-data protections

- [x] Define a versioned schema for local demo snapshots; include repayment, stock movement, general ledger, karigar voucher, and scheme enrollment histories; redact named KYC/bank/provider credential keys (DB-002/SEC-003).
- [x] Validate the full snapshot, IDs, and supported firm/customer/stock/branch links before scheduling any restore state updates; migrate the known legacy export deterministically and test pure roundtrip/rejection behavior.
- [x] Require a redacted pre-restore/pre-reset download and remove the error-boundary action that cleared all origin localStorage.
- [ ] Implement durable isolated operational database restore/roundtrip, failure-atomic persistence, migration fixtures, and a verified recovery drill.
- [ ] Preserve current browser data unchanged. Provide a separate reviewed dry-run reconciliation/import path; quarantine missing/conflicting ownership and exclude KYC, role grants, and credentials without approved policy (SEC-002/003).
- [ ] Document forward migration/rollback compatibility and verify fresh plus populated upgrade paths.
- **Acceptance:** export→fresh restore→export semantic equality; malformed imports and injected failures cause zero state changes; ambiguous rows are quarantined; database restore drill reconciles stock, balances, and journal history.

### Phase 5 — Inventory lifecycle and optional workflow honesty

- [ ] Enforce stock identity, exact quantities, movement history, and tenant-consistent references (INV-001).
- [x] Keep transfers unavailable in operational mode; exercise read and mutation methods and disclose that the legacy demo transfer is not authoritative (INV-002).
- [x] Keep purchases and returns unavailable in operational mode; exercise read and mutation methods (INV-003).
- [x] Label demo tags as layout previews, remove unverified scan/printer/certification claims, and keep tag/RFID workflows unavailable operationally (INV-004).
- [x] Keep schemes, Girvi, and karigar workflows unavailable in operational mode; exercise their API feature gates (EXT-001).
- **Acceptance:** stock/cash/metal conservation, tenant/branch invariants, retry safety, and disabled-route tests; encoded labels decode to the correct stable record.

### Phase 6 — Security, release tests, performance, and production evidence

- [ ] Minimize/redact KYC, remove stale credential surfaces, establish retention/deletion/export rules, and test client/API/log/export/bundle leakage (SEC-003).
- [ ] Re-audit dependency advisories and patch reachable vulnerable build/runtime paths without weakening package verification (SEC-004). Production-only audit reports zero; the current lockfile still reports 7 development findings.
- [ ] Replace legacy source-presence assertions for critical claims with HTTP/database/browser behavior tests; every failing assertion exits nonzero; add required CI checks (OPS-003).
- [ ] Pin supported runtime/package versions; document environment validation, secret handling, health/readiness, migration and rollback, monitoring, backup retention, alerts, support, offboarding, and restore RPO/RTO (OPS-004).
- [ ] Benchmark declared tenant/item/history scenarios and reduce full-store serialization/render bottlenecks; do not claim capacity before agreed budgets pass (PERF-001).
- **Acceptance:** clean install, all required tests/builds, security review, isolated timed restore meeting agreed RPO/RTO, alert exercise, and agreed latency/error/storage budgets.

## External decisions and release gates

Some work cannot be truthfully completed from code alone: accountant approval of settlement/pricing rules, approved KYC retention and offboarding policy, business-date/timezone and document-number rules, target hosting/reverse-proxy/TLS/secret-manager configuration, operators/on-call and alert destinations, RPO/RTO and capacity budgets, production credential rotation, and a reviewed policy for any real-data import. Keep affected operations disabled until decisions and evidence are supplied. No deployment or live-data migration is authorized by this goal.

## Progress

- [x] Read the complete audit report and its next-task scope before this plan.
- [x] Audited the current worktree against all 27 findings and recorded status above.
- [x] Re-ran `npm test`, `npm run build`, `npm run build:operational`, and `git diff --check` during remediation.
- [x] Added a versioned/redacted local demo snapshot schema with known legacy-format upgrade and full preflight tests; removed generic error-boundary localStorage clearing.
- [x] Audited optional operational workflows; added HTTP-method feature-gate coverage and corrected demo tag preview claims.
- [x] Phase 1 — standalone correctness and demo claims (source/tests/browser checks above).
- [ ] Phase 2 — transactional inventory/sales boundary (implemented and standalone checks pass; PostgreSQL acceptance suite remains to run).
- [ ] Phase 3 — pricing/accounting invariants (provisional sale/ledger path implemented; repayments, reports, and accountant review remain).
- [ ] Phase 4 — recovery and data migration protections.
- [ ] Phase 5 — operational exclusions for optional workflows are tested; INV-001 lifecycle/concurrency verification remains.
- [ ] Phase 6 — release/security/operations/capacity gates.

## Result

In progress. No broader finding is considered fixed solely because an operation is absent from the current customer-only API. Update each finding row with implementation and test evidence as phases complete. The product remains unsuitable for real business data and production operations until all applicable technical and external release gates pass.
