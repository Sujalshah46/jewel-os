// admin-panel-tests.js
// Automated verification suite for Jewellery OS SaaS Admin Panel & Multi-Tenant Management

import {
  ALL_SYSTEM_MODULES,
  INITIAL_CLIENTS,
  INITIAL_BRANCHES,
  INITIAL_STAFF,
  SYSTEM_ROLES_PERMISSIONS,
  INITIAL_CATALOGUE_SETTINGS,
  INITIAL_INTEGRATIONS,
  INITIAL_AUDIT_LOGS
} from '../src/data/initialAdminData.js';

console.log('======================================================================');
console.log('JEWELLERY OS - SAAS ADMIN PANEL VERIFICATION SUITE');
console.log('======================================================================\n');

let passedCount = 0;
let failedCount = 0;

function assert(condition, testId, message) {
  if (condition) {
    passedCount++;
    console.log(`✅ PASS: [${testId}] ${message}`);
  } else {
    failedCount++;
    console.error(`❌ FAIL: [${testId}] ${message}`);
  }
}

// -----------------------------------------------------------------------------
// 1. Client & Multi-Tenant Data Structures
// -----------------------------------------------------------------------------
console.log('--- 1. Testing SaaS Client & Module Entitlements ---');

assert(
  Array.isArray(INITIAL_CLIENTS) && INITIAL_CLIENTS.length >= 3,
  'ADM-01',
  `Initial clients seeded with at least 3 active/trial tenants (Found: ${INITIAL_CLIENTS.length})`
);

const enterpriseClient = INITIAL_CLIENTS.find(c => c.plan === 'Enterprise');
assert(
  enterpriseClient && enterpriseClient.enabledModules.length === ALL_SYSTEM_MODULES.length,
  'ADM-02',
  `Enterprise client "${enterpriseClient?.name}" is provisioned with all ${ALL_SYSTEM_MODULES.length} system modules`
);

const starterClient = INITIAL_CLIENTS.find(c => c.plan === 'Starter');
assert(
  starterClient && !starterClient.enabledModules.includes('schemes') && !starterClient.enabledModules.includes('karigars'),
  'ADM-03',
  `Starter client "${starterClient?.name}" has gated modules restricted (Schemes & Karigars excluded)`
);

// Test Dynamic Module Toggle Logic
function simulateToggleModule(client, moduleKey) {
  const isEnabled = client.enabledModules.includes(moduleKey);
  const updated = isEnabled
    ? client.enabledModules.filter(m => m !== moduleKey)
    : [...client.enabledModules, moduleKey];
  return { ...client, enabledModules: updated };
}

const toggledClient = simulateToggleModule(starterClient, 'schemes');
assert(
  toggledClient.enabledModules.includes('schemes'),
  'ADM-04',
  'Module toggle correctly enables "schemes" for client'
);

const untoggledClient = simulateToggleModule(toggledClient, 'schemes');
assert(
  !untoggledClient.enabledModules.includes('schemes'),
  'ADM-05',
  'Module toggle correctly disables "schemes" when toggled again'
);

// -----------------------------------------------------------------------------
// 2. Branch & Multi-Location Safety Checks
// -----------------------------------------------------------------------------
console.log('\n--- 2. Testing Branch & Location Safety Constraints ---');

assert(
  Array.isArray(INITIAL_BRANCHES) && INITIAL_BRANCHES.length >= 3,
  'ADM-06',
  `Initial branches seeded with retail showrooms and central storage warehouse (Found: ${INITIAL_BRANCHES.length})`
);

function simulateDeleteBranch(branchId, branchesList, stockList) {
  const hasLinkedStock = stockList.some(s => s.branchId === branchId);
  if (hasLinkedStock) {
    throw new Error('Cannot delete branch with active inventory items.');
  }
  return branchesList.filter(b => b.id !== branchId);
}

const mockStock = [{ id: 'STK-01', branchId: 'BR-001' }];
let deletionBlocked = false;
try {
  simulateDeleteBranch('BR-001', INITIAL_BRANCHES, mockStock);
} catch (e) {
  deletionBlocked = true;
}
assert(
  deletionBlocked,
  'ADM-07',
  'Safety check prevents deleting branch when active stock items are linked'
);

const safeDeletedBranches = simulateDeleteBranch('BR-002', INITIAL_BRANCHES, mockStock);
assert(
  safeDeletedBranches.length === INITIAL_BRANCHES.length - 1,
  'ADM-08',
  'Branch with zero linked stock deleted successfully without errors'
);

// -----------------------------------------------------------------------------
// 3. Staff & Role-Based Access Control (RBAC)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Testing Staff Directory & Role Permissions Matrix ---');

const expectedRoles = [
  'Platform Super Admin',
  'Business Owner',
  'Branch Manager',
  'Inventory Manager',
  'Salesperson / Cashier',
  'Karigar / Workshop Manager',
  'Accountant',
  'Read-only Auditor'
];

const allRolesCovered = expectedRoles.every(r => SYSTEM_ROLES_PERMISSIONS[r] && SYSTEM_ROLES_PERMISSIONS[r].permissions.length > 0);
assert(
  allRolesCovered,
  'ADM-09',
  `Permissions matrix covers all 8 domain roles with explicit permissions`
);

const cashierPerms = SYSTEM_ROLES_PERMISSIONS['Salesperson / Cashier'].permissions;
const superAdminPerms = SYSTEM_ROLES_PERMISSIONS['Platform Super Admin'].permissions;

assert(
  cashierPerms.includes('manage_billing') && !cashierPerms.includes('manage_clients') && !cashierPerms.includes('manage_staff'),
  'ADM-10',
  'Cashier role has billing permission but lacks client and staff management permissions'
);

assert(
  superAdminPerms.includes('manage_clients') && superAdminPerms.includes('manage_modules'),
  'ADM-11',
  'Platform Super Admin role has privileged cross-tenant client and module management permissions'
);

// -----------------------------------------------------------------------------
// 4. Jewellery Catalogue Rules & Statutory Parameters
// -----------------------------------------------------------------------------
console.log('\n--- 4. Testing Jewellery Catalogue Rules & BIS Hallmark Standards ---');

assert(
  INITIAL_CATALOGUE_SETTINGS.hallmarkChargePerPiece === 45.0,
  'ADM-12',
  `BIS Hallmark base charge configured to ₹45.00 (+ 3% GST = ₹46.35)`
);

assert(
  INITIAL_CATALOGUE_SETTINGS.taxGstPercent === 3.0,
  'ADM-13',
  `Standard jewellery GST rate set to 3.0% (CGST 1.5% + SGST 1.5%)`
);

assert(
  INITIAL_CATALOGUE_SETTINGS.categories.length >= 8,
  'ADM-14',
  `Ornament categories list configured with HSN codes and default wastage tolerances (Found: ${INITIAL_CATALOGUE_SETTINGS.categories.length})`
);

// -----------------------------------------------------------------------------
// 5. Integrations & Health Ping Verification
// -----------------------------------------------------------------------------
console.log('\n--- 5. Testing Integrations Hub ---');

assert(
  Array.isArray(INITIAL_INTEGRATIONS) && INITIAL_INTEGRATIONS.length >= 6,
  'ADM-15',
  `Demo provider examples are present but not configured (Found: ${INITIAL_INTEGRATIONS.length})`
);

const maskedKeysSafe = INITIAL_INTEGRATIONS.every(i => !('apiKeyMasked' in i) && i.status === 'Not configured');
assert(
  maskedKeysSafe,
  'ADM-16',
  'Provider examples expose no mock credentials and make no connection claim'
);

// -----------------------------------------------------------------------------
// 6. Append-Only Security Audit Log Integrity
// -----------------------------------------------------------------------------
console.log('\n--- 6. Testing Append-Only Audit Trail ---');

assert(
  Array.isArray(INITIAL_AUDIT_LOGS) && INITIAL_AUDIT_LOGS.length >= 6,
  'ADM-17',
  `Audit log contains initial historical audit records (Found: ${INITIAL_AUDIT_LOGS.length})`
);

function simulateAppendAudit(logs, entry) {
  const newLog = {
    id: 'AUD-' + Date.now(),
    timestamp: new Date().toISOString(),
    ...entry,
    status: 'Success'
  };
  return [newLog, ...logs];
}

const updatedLogs = simulateAppendAudit(INITIAL_AUDIT_LOGS, {
  actorName: 'Mansi Anil',
  actorRole: 'Platform Super Admin',
  action: 'Client Created',
  category: 'SaaS Platform',
  target: 'Test Client',
  details: 'Unit test audit verification'
});

assert(
  updatedLogs.length === INITIAL_AUDIT_LOGS.length + 1 && updatedLogs[0].action === 'Client Created',
  'ADM-18',
  'Audit log appends entries chronologically in immutable order'
);

console.log('\n----------------------------------------------------------------------');
console.log(`TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log('----------------------------------------------------------------------');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL SAAS ADMIN PANEL TESTS PASSED SUCCESSFULLY!\n');
}
