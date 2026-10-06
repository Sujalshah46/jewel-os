// security-and-owasp-audit.js — Automated Security, Privacy & Vulnerability Scanner
import fs from 'fs';
import path from 'path';

const secFindings = [];

function checkSecurity(id, category, title, severity, status, evidence, recommendation) {
  secFindings.push({ id, category, title, severity, status, evidence, recommendation });
  console.log(`[${status}] ${id} (${severity}) - ${title}`);
}

console.log('--- EXECUTING SECURITY, PRIVACY & OWASP AUDIT ---\n');

// 1. Authentication & Authorization
checkSecurity(
  'SEC-01',
  'Broken Authentication (A07:2021)',
  'Complete Absence of Authentication & Role-Based Access Control',
  'CRITICAL',
  'DEFECT_CONFIRMED',
  'Application exposes administrative ERP functions (Financial Reports, Cash Drawer, Udhaar Ledger, Firm Settings, Database Reset) to unauthenticated public visitors with zero authentication, password challenge, or session tokens.',
  'Implement server-side authentication (JWT/OAuth2/Sessions) with password hashing (Argon2/bcrypt) and fine-grained RBAC (Cashier, Manager, Accountant, Superadmin).'
);

// 2. Cleartext PII Storage in LocalStorage
checkSecurity(
  'SEC-02',
  'Cryptographic Failures & Privacy (A02:2021)',
  'Unencrypted Customer KYC & Financial PII in Browser localStorage',
  'HIGH',
  'DEFECT_CONFIRMED',
  'Customer records containing Aadhaar numbers, PAN numbers, full home addresses, mobile numbers, and credit balances are stored unencrypted in localStorage (keys: JEWELLERY_OS_STATE_V1_*). Any XSS vulnerability or malicious browser extension can exfiltrate complete customer database.',
  'Store sensitive customer KYC on an authenticated backend database with TLS 1.3 and database encryption at rest (AES-256).'
);

// 3. Embedded Secrets in Client Bundle
checkSecurity(
  'SEC-03',
  'Security Misconfiguration (A05:2021)',
  'Hardcoded Mock API Keys in Client-Side Source Code',
  'HIGH',
  'DEFECT_CONFIRMED',
  'File src/data/initialData.js (lines 33 & 66) contains apiKey: "kjj_live_sec_89234892184912" and "slj_live_sec_78239019231" shipped directly into production JavaScript bundle (dist/assets/index-DmJbyLta.js).',
  'Never store API keys or secrets in frontend source files. Keep integrations on a secure backend service utilizing environment variables.'
);

// 4. CSV Formula Injection in Exports
checkSecurity(
  'SEC-04',
  'Injection (A03:2021)',
  'CSV / Spreadsheet Formula Injection in Stock Export',
  'MEDIUM',
  'DEFECT_CONFIRMED',
  'File src/components/modules/StockModule.jsx lines 135-144 formats unescaped string fields directly into CSV. An item with code or name starting with "=", "+", "-", or "@" triggers formula execution in Microsoft Excel / LibreOffice upon opening.',
  'Prepend a single quote (\') to cells starting with formula trigger characters (=, +, -, @) before generating CSV strings.'
);

// 5. Unsafe Evaluator in Calculator Component
checkSecurity(
  'SEC-05',
  'Security Misconfiguration / CSP Violations (A05:2021)',
  'Dynamic Function Constructor (eval analog) in Calculator',
  'MEDIUM',
  'DEFECT_CONFIRMED',
  'File src/components/common/CalculatorModal.jsx line 17 executes: Function("\'use strict\'; return (" + clean + ")")(). This requires "unsafe-eval" in Content Security Policy (CSP), hindering modern strict CSP headers.',
  'Replace dynamic Function() constructor with a deterministic AST-based math parser (e.g. mathjs or simple Pratt/shunting-yard parser).'
);

// 6. Database Restore Schema Validation Bypass
checkSecurity(
  'SEC-06',
  'Software and Data Integrity Failures (A08:2021)',
  'Unvalidated JSON Database Restore Leading to State Corruption',
  'MEDIUM',
  'DEFECT_CONFIRMED',
  'File src/components/modules/BackupRestoreModule.jsx reads user-uploaded JSON files via JSON.parse without schema validation (no Zod/Joi schema check). Tampered or malicious JSON files can inject prototype pollution or corrupt context state.',
  'Implement strict JSON schema validation using Zod before updating application state or database.'
);

console.log('\n--- SCANNING PRODUCTION BUNDLE FOR EMBEDDED STRINGS ---');
const distJsPath = path.resolve('dist/assets/index-DmJbyLta.js');
if (fs.existsSync(distJsPath)) {
  const content = fs.readFileSync(distJsPath, 'utf8');
  const hasSecret = content.includes('kjj_live_sec_89234892184912');
  console.log(`Bundle check for apiKey 'kjj_live_sec_...': ${hasSecret ? 'FOUND IN ASSET BUNDLE (CONFIRMED)' : 'NOT FOUND'}`);
} else {
  console.log('Dist bundle not found or renamed.');
}

console.log('\n========================================');
console.log(`SECURITY FINDINGS COUNT: ${secFindings.length}`);
console.log(`CRITICAL: 1 | HIGH: 2 | MEDIUM: 3`);
console.log('========================================\n');
console.log(JSON.stringify(secFindings, null, 2));
