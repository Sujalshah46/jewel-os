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
| SEC-003 KYC and provider secrets | Partial | New credential entry was removed and operational customer responses omit secrets. Legacy demo storage still contains KYC fields and may retain previously entered browser values; retention, redaction, deletion, and secure migration are unresolved. |
| DB-001 Atomic/concurrent persistence | Partial | Tenant-scoped stock and sale APIs now use PostgreSQL transactions, row locks/conditional updates, idempotency, and an atomic journal. Returns, repayments, purchasing, transfers, and recovery do not have equivalent server transactions. API/database integration tests have not been rerun in this environment. |
| DB-002 Backup and restore | Open | Legacy export/import defects remain; no complete, validated, atomic operational backup/restore drill is established. |
| DB-003 IDs and fiscal numbers | Partial | Operational invoices use database UUIDs and tenant/FY-scoped counters in the sale transaction. Repayment, return, and other numbering remain unimplemented. |
| FIN-001 Server-derived finalization | Partial | An operational sale endpoint validates tenant references, recalculates amounts from persisted price inputs, and atomically commits sale, stock, invoice, payment, and ledger rows. Database behavior still needs integration verification; other settlement workflows are not implemented. |
| FIN-002 Balanced journals | Partial | Finalization asserts balanced paise postings for cash, old metal, receivable, revenue, CGST, and SGST. This is a provisional demo-rule mapping; accountant approval and other settlement/account lifecycles remain open. |
| FIN-003 Repayment settlement truth | Open | Loan/receipt and invoice balances remain legacy demo state. |
| FIN-004 Ledger-backed reports | Open | Existing reports still use estimates/plugs instead of a verified authoritative ledger. |
| FIN-005 Tax precision and zero-rate behavior | Partial | Explicit 0% GST remains zero and CGST/SGST reconcile to rounded GST; server pricing stores paise snapshots. Full worked-example and database tests remain. |
| FIN-006 Immutable invoice issuer/zero values | Partial | Operational invoices store issuer and priced-line snapshots, including zero tax. Legacy invoice rendering/reprint immutability is not fully corrected. |
| FIN-007 Pricing-field/product-type wiring | Partial | Operational stock pricing feeds the shared calculation helper; catalogue estimate/billing handoff preserves selected values. Product-specific strategies and UI migration remain. |
| INV-001 Stock IDs, quantities, movements | Partial | Tenant/branch-owned stock, opening receipt, movement history, and optimistic adjustments are implemented in the operational API. Database/concurrency tests need to run; UI migration is incomplete. |
| INV-002 Transfer custody/firm integrity | Open | No transactional dispatch/receipt transfer lifecycle. |
| INV-003 Purchasing and returns | Open | No supplier payable/purchase workflow or linked sale reversal workflow. |
| INV-004 Encoded tags/RFID claims | Open | Tag graphics and scan/RFID behavior have not been replaced with verified payloads or removed from claims. |
| EXT-001 Schemes/Girvi/karigar accounting | Open | These workflows remain synthetic demo functionality and are absent from operational mode; no reconciled lifecycle exists. |
| OPS-001 Honest simulations | Partial | Integration, MCX-rate, and messaging screens now label synthetic actions and do not claim a provider send/connection. Operational customer mode excludes them. A real provider and approved rate provenance remain unimplemented. |
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
- [ ] Link repayment receipts to invoices and derive outstanding balances from settlement history without changing issued snapshots (FIN-003).
- [ ] Derive financial reports from the authoritative journal and remove plug/estimate “reconciled” claims (FIN-004).
- **Acceptance:** exact-paise worked examples including explicit zero tax; all valid journals balance; invalid/forged totals and references reject; invoice/customer/report balances reconcile; historical issuer and zero-valued fields remain stable after later firm edits.

### Phase 4 — Complete recovery, imports, and legacy-data protections

- [ ] Define versioned backup/export schemas and make validation complete before any restore mutation (DB-002).
- [ ] Implement isolated restore/roundtrip and preserve pre-restore snapshots; remove generic destructive recovery actions.
- [ ] Preserve current browser data unchanged. Provide a separate reviewed dry-run reconciliation/import path; quarantine missing/conflicting ownership and exclude KYC, role grants, and credentials without approved policy (SEC-002/003).
- [ ] Document forward migration/rollback compatibility and verify fresh plus populated upgrade paths.
- **Acceptance:** export→fresh restore→export semantic equality; malformed imports and injected failures cause zero state changes; ambiguous rows are quarantined; database restore drill reconciles stock, balances, and journal history.

### Phase 5 — Inventory lifecycle and optional workflow honesty

- [ ] Enforce stock identity, exact quantities, movement history, and tenant-consistent references (INV-001).
- [ ] Add dispatch/receipt custody state machine for transfers or keep transfers disabled (INV-002).
- [ ] Add supplier purchase/payable/settlement and traceable partial/full returns/reversals or keep these operations disabled (INV-003).
- [ ] Generate and independently decode barcode/QR payloads; remove RFID/payment claims until real integrations and lifecycle tests exist (INV-004).
- [ ] Either implement balanced scheme/Girvi/karigar cash and metal lifecycles or keep those screens inaccessible in operational mode (EXT-001).
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
- [x] Phase 1 — standalone correctness and demo claims (source/tests/browser checks above).
- [ ] Phase 2 — transactional inventory/sales boundary (implemented and standalone checks pass; PostgreSQL acceptance suite remains to run).
- [ ] Phase 3 — pricing/accounting invariants (provisional sale/ledger path implemented; repayments, reports, and accountant review remain).
- [ ] Phase 4 — recovery and data migration protections.
- [ ] Phase 5 — inventory lifecycles and optional modules.
- [ ] Phase 6 — release/security/operations/capacity gates.

## Result

In progress. No broader finding is considered fixed solely because an operation is absent from the current customer-only API. Update each finding row with implementation and test evidence as phases complete. The product remains unsuitable for real business data and production operations until all applicable technical and external release gates pass.
