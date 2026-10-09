import { bigint, boolean, check, date, foreignKey, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const membershipRole = pgEnum('membership_role', ['OWNER', 'MANAGER', 'CASHIER']);
export const platformRole = pgEnum('platform_role', ['ADMIN']);

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex('user_email_key').on(table.email)]);

export const sessions = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, table => [uniqueIndex('session_token_key').on(table.token), index('session_user_id_idx').on(table.userId)]);

export const accounts = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex('account_provider_account_key').on(table.providerId, table.accountId), index('account_user_id_idx').on(table.userId)]);

export const verifications = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [index('verification_identifier_idx').on(table.identifier)]);

export const tenants = pgTable('tenant', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  status: text('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [index('tenant_status_created_idx').on(table.status, table.createdAt)]);

export const memberships = pgTable('membership', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  role: membershipRole('role').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex('membership_user_tenant_key').on(table.userId, table.tenantId), index('membership_tenant_enabled_role_idx').on(table.tenantId, table.enabled, table.role)]);

export const platformGrants = pgTable('platform_grant', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  role: platformRole('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const customers = pgTable('customer', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 160 }).notNull(),
  mobile: varchar('mobile', { length: 32 }).notNull(),
  email: varchar('email', { length: 254 }),
  address: varchar('address', { length: 300 }),
  city: varchar('city', { length: 100 }),
  archived: boolean('archived').notNull().default(false),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  archivedBy: text('archived_by').references(() => users.id, { onDelete: 'set null' }),
  archivedReason: varchar('archived_reason', { length: 240 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex('customer_tenant_id_key').on(table.tenantId, table.id),
  index('customer_tenant_archived_name_id_idx').on(table.tenantId, table.archived, table.name, table.id),
  index('customer_tenant_created_at_idx').on(table.tenantId, table.createdAt),
  index('customer_tenant_updated_at_idx').on(table.tenantId, table.updatedAt),
  index('customer_tenant_mobile_idx').on(table.tenantId, table.mobile),
]);

export const branches = pgTable('tenant_branch', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 120 }).notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex('tenant_branch_tenant_id_key').on(table.tenantId, table.id),
  uniqueIndex('tenant_branch_tenant_name_key').on(table.tenantId, table.name),
  index('tenant_branch_tenant_active_name_idx').on(table.tenantId, table.active, table.name),
]);

export const stockItems = pgTable('stock_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  branchId: uuid('branch_id').notNull(),
  itemCode: varchar('item_code', { length: 80 }).notNull(),
  barcode: varchar('barcode', { length: 120 }),
  description: varchar('description', { length: 300 }).notNull(),
  metalType: varchar('metal_type', { length: 24 }).notNull(),
  grossWeightMg: bigint('gross_weight_mg', { mode: 'number' }).notNull(),
  netWeightMg: bigint('net_weight_mg', { mode: 'number' }).notNull(),
  purityBps: integer('purity_bps').notNull(),
  ratePerGramPaise: bigint('rate_per_gram_paise', { mode: 'number' }).notNull(),
  makingChargeType: varchar('making_charge_type', { length: 16 }).notNull(),
  makingChargeValue: bigint('making_charge_value', { mode: 'number' }).notNull(),
  makingDiscountBps: integer('making_discount_bps').notNull().default(0),
  stoneValuePaise: bigint('stone_value_paise', { mode: 'number' }).notNull().default(0),
  hallmarkChargePaise: bigint('hallmark_charge_paise', { mode: 'number' }).notNull().default(4500),
  otherChargesPaise: bigint('other_charges_paise', { mode: 'number' }).notNull().default(0),
  itemDiscountPaise: bigint('item_discount_paise', { mode: 'number' }).notNull().default(0),
  gstRateBps: integer('gst_rate_bps').notNull().default(300),
  quantityAvailable: integer('quantity_available').notNull(),
  catalogPricePaise: bigint('catalog_price_paise', { mode: 'number' }).notNull(),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex('stock_item_tenant_id_key').on(table.tenantId, table.id),
  uniqueIndex('stock_item_tenant_item_code_key').on(table.tenantId, table.itemCode),
  uniqueIndex('stock_item_tenant_barcode_key').on(table.tenantId, table.barcode),
  index('stock_item_tenant_branch_archived_code_idx').on(table.tenantId, table.branchId, table.archived, table.itemCode),
  foreignKey({ columns: [table.tenantId, table.branchId], foreignColumns: [branches.tenantId, branches.id], name: 'stock_item_tenant_branch_fk' }),
  check('stock_item_gross_weight_nonnegative', sql`${table.grossWeightMg} >= 0`),
  check('stock_item_net_weight_range', sql`${table.netWeightMg} >= 0 AND ${table.netWeightMg} <= ${table.grossWeightMg}`),
  check('stock_item_purity_range', sql`${table.purityBps} BETWEEN 1 AND 10000`),
  check('stock_item_rate_nonnegative', sql`${table.ratePerGramPaise} >= 0`),
  check('stock_item_making_type_allowed', sql`${table.makingChargeType} IN ('per_gram', 'fixed', 'percentage')`),
  check('stock_item_making_value_nonnegative', sql`${table.makingChargeValue} >= 0`),
  check('stock_item_making_percentage_range', sql`${table.makingChargeType} <> 'percentage' OR ${table.makingChargeValue} <= 10000`),
  check('stock_item_making_discount_range', sql`${table.makingDiscountBps} BETWEEN 0 AND 10000`),
  check('stock_item_charges_nonnegative', sql`${table.stoneValuePaise} >= 0 AND ${table.hallmarkChargePaise} >= 0 AND ${table.otherChargesPaise} >= 0 AND ${table.itemDiscountPaise} >= 0`),
  check('stock_item_gst_rate_range', sql`${table.gstRateBps} BETWEEN 0 AND 10000`),
  check('stock_item_quantity_nonnegative', sql`${table.quantityAvailable} >= 0`),
  check('stock_item_price_nonnegative', sql`${table.catalogPricePaise} >= 0`),
]);

export const stockMovements = pgTable('stock_movement', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  stockItemId: uuid('stock_item_id').notNull(),
  movementType: varchar('movement_type', { length: 24 }).notNull(),
  quantityDelta: integer('quantity_delta').notNull(),
  reason: varchar('reason', { length: 240 }).notNull(),
  actorUserId: text('actor_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('stock_movement_tenant_item_created_idx').on(table.tenantId, table.stockItemId, table.createdAt, table.id),
  foreignKey({ columns: [table.tenantId, table.stockItemId], foreignColumns: [stockItems.tenantId, stockItems.id], name: 'stock_movement_tenant_item_fk' }),
  check('stock_movement_quantity_nonzero', sql`${table.quantityDelta} <> 0`),
  check('stock_movement_type_allowed', sql`${table.movementType} IN ('RECEIPT', 'ADJUSTMENT', 'SALE', 'RETURN', 'TRANSFER_IN', 'TRANSFER_OUT')`),
]);

export const invoiceCounters = pgTable('invoice_counter', {
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  financialYear: varchar('financial_year', { length: 5 }).notNull(),
  nextNumber: integer('next_number').notNull().default(0),
}, table => [
  uniqueIndex('invoice_counter_tenant_fy_key').on(table.tenantId, table.financialYear),
  check('invoice_counter_next_number_positive', sql`${table.nextNumber} >= 0`),
]);

export const invoices = pgTable('invoice', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  branchId: uuid('branch_id').notNull(),
  customerId: uuid('customer_id'),
  soldBy: text('sold_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  financialYear: varchar('financial_year', { length: 5 }).notNull(),
  documentNumber: varchar('document_number', { length: 32 }).notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull(),
  requestHash: varchar('request_hash', { length: 64 }).notNull(),
  businessDate: date('business_date').notNull(),
  issuerNameSnapshot: varchar('issuer_name_snapshot', { length: 160 }).notNull(),
  taxableAmountPaise: bigint('taxable_amount_paise', { mode: 'number' }).notNull(),
  cgstPaise: bigint('cgst_paise', { mode: 'number' }).notNull(),
  sgstPaise: bigint('sgst_paise', { mode: 'number' }).notNull(),
  totalPaise: bigint('total_paise', { mode: 'number' }).notNull(),
  outstandingPaise: bigint('outstanding_paise', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex('invoice_tenant_id_key').on(table.tenantId, table.id),
  uniqueIndex('invoice_tenant_document_number_key').on(table.tenantId, table.documentNumber),
  uniqueIndex('invoice_tenant_soldby_idempotency_key').on(table.tenantId, table.soldBy, table.idempotencyKey),
  index('invoice_tenant_date_id_idx').on(table.tenantId, table.businessDate, table.id),
  foreignKey({ columns: [table.tenantId, table.branchId], foreignColumns: [branches.tenantId, branches.id], name: 'invoice_tenant_branch_fk' }),
  foreignKey({ columns: [table.tenantId, table.customerId], foreignColumns: [customers.tenantId, customers.id], name: 'invoice_tenant_customer_fk' }),
  check('invoice_totals_nonnegative', sql`${table.taxableAmountPaise} >= 0 AND ${table.cgstPaise} >= 0 AND ${table.sgstPaise} >= 0 AND ${table.totalPaise} >= 0 AND ${table.outstandingPaise} BETWEEN 0 AND ${table.totalPaise}`),
  check('invoice_total_reconciles', sql`${table.totalPaise} = ${table.taxableAmountPaise} + ${table.cgstPaise} + ${table.sgstPaise}`),
]);

export const invoiceLines = pgTable('invoice_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  invoiceId: uuid('invoice_id').notNull(),
  stockItemId: uuid('stock_item_id').notNull(),
  itemCodeSnapshot: varchar('item_code_snapshot', { length: 80 }).notNull(),
  descriptionSnapshot: varchar('description_snapshot', { length: 300 }).notNull(),
  quantity: integer('quantity').notNull(),
  grossWeightMgSnapshot: bigint('gross_weight_mg_snapshot', { mode: 'number' }).notNull(),
  netWeightMgSnapshot: bigint('net_weight_mg_snapshot', { mode: 'number' }).notNull(),
  purityBpsSnapshot: integer('purity_bps_snapshot').notNull(),
  unitTaxableAmountPaise: bigint('unit_taxable_amount_paise', { mode: 'number' }).notNull(),
  unitCgstPaise: bigint('unit_cgst_paise', { mode: 'number' }).notNull(),
  unitSgstPaise: bigint('unit_sgst_paise', { mode: 'number' }).notNull(),
  unitTotalPaise: bigint('unit_total_paise', { mode: 'number' }).notNull(),
  lineTaxableAmountPaise: bigint('line_taxable_amount_paise', { mode: 'number' }).notNull(),
  lineCgstPaise: bigint('line_cgst_paise', { mode: 'number' }).notNull(),
  lineSgstPaise: bigint('line_sgst_paise', { mode: 'number' }).notNull(),
  lineTotalPaise: bigint('line_total_paise', { mode: 'number' }).notNull(),
  pricingSnapshot: text('pricing_snapshot').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex('invoice_line_tenant_id_key').on(table.tenantId, table.id),
  index('invoice_line_tenant_invoice_idx').on(table.tenantId, table.invoiceId, table.id),
  foreignKey({ columns: [table.tenantId, table.invoiceId], foreignColumns: [invoices.tenantId, invoices.id], name: 'invoice_line_tenant_invoice_fk' }),
  foreignKey({ columns: [table.tenantId, table.stockItemId], foreignColumns: [stockItems.tenantId, stockItems.id], name: 'invoice_line_tenant_stock_item_fk' }),
  check('invoice_line_quantity_positive', sql`${table.quantity} > 0`),
  check('invoice_line_amounts_nonnegative', sql`${table.unitTaxableAmountPaise} >= 0 AND ${table.unitCgstPaise} >= 0 AND ${table.unitSgstPaise} >= 0 AND ${table.unitTotalPaise} >= 0 AND ${table.lineTotalPaise} >= 0`),
  check('invoice_line_unit_total_reconciles', sql`${table.unitTotalPaise} = ${table.unitTaxableAmountPaise} + ${table.unitCgstPaise} + ${table.unitSgstPaise}`),
  check('invoice_line_total_reconciles', sql`${table.lineTotalPaise} = ${table.lineTaxableAmountPaise} + ${table.lineCgstPaise} + ${table.lineSgstPaise}`),
]);

export const invoicePayments = pgTable('invoice_payment', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  invoiceId: uuid('invoice_id').notNull(),
  method: varchar('method', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  amountPaise: bigint('amount_paise', { mode: 'number' }).notNull(),
  reference: varchar('reference', { length: 120 }),
  actorUserId: text('actor_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('invoice_payment_tenant_invoice_idx').on(table.tenantId, table.invoiceId, table.createdAt, table.id),
  foreignKey({ columns: [table.tenantId, table.invoiceId], foreignColumns: [invoices.tenantId, invoices.id], name: 'invoice_payment_tenant_invoice_fk' }),
  check('invoice_payment_method_allowed', sql`${table.method} IN ('CASH', 'BANK_PENDING', 'OLD_METAL')`),
  check('invoice_payment_status_allowed', sql`${table.status} IN ('RECEIVED', 'PENDING')`),
  check('invoice_payment_amount_positive', sql`${table.amountPaise} > 0`),
]);

export const ledgerEntries = pgTable('ledger_entry', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  invoiceId: uuid('invoice_id').notNull(),
  accountCode: varchar('account_code', { length: 40 }).notNull(),
  debitPaise: bigint('debit_paise', { mode: 'number' }).notNull().default(0),
  creditPaise: bigint('credit_paise', { mode: 'number' }).notNull().default(0),
  actorUserId: text('actor_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('ledger_entry_tenant_invoice_idx').on(table.tenantId, table.invoiceId, table.id),
  index('ledger_entry_tenant_account_created_idx').on(table.tenantId, table.accountCode, table.createdAt, table.id),
  foreignKey({ columns: [table.tenantId, table.invoiceId], foreignColumns: [invoices.tenantId, invoices.id], name: 'ledger_entry_tenant_invoice_fk' }),
  check('ledger_entry_account_allowed', sql`${table.accountCode} IN ('CASH', 'SCRAP_METAL', 'ACCOUNTS_RECEIVABLE', 'SALES_REVENUE', 'OUTPUT_CGST', 'OUTPUT_SGST')`),
  check('ledger_entry_one_side_positive', sql`(${table.debitPaise} > 0 AND ${table.creditPaise} = 0) OR (${table.creditPaise} > 0 AND ${table.debitPaise} = 0)`),
]);

export const oldMetalReceipts = pgTable('old_metal_receipt', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  invoiceId: uuid('invoice_id').notNull(),
  metalType: varchar('metal_type', { length: 24 }).notNull(),
  grossWeightMg: bigint('gross_weight_mg', { mode: 'number' }).notNull(),
  lessWeightMg: bigint('less_weight_mg', { mode: 'number' }).notNull(),
  purityBps: integer('purity_bps').notNull(),
  baseRatePaisePerGram: bigint('base_rate_paise_per_gram', { mode: 'number' }).notNull(),
  deductionPaisePerGram: bigint('deduction_paise_per_gram', { mode: 'number' }).notNull(),
  valuationPaise: bigint('valuation_paise', { mode: 'number' }).notNull(),
  actorUserId: text('actor_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex('old_metal_receipt_tenant_invoice_key').on(table.tenantId, table.invoiceId),
  foreignKey({ columns: [table.tenantId, table.invoiceId], foreignColumns: [invoices.tenantId, invoices.id], name: 'old_metal_receipt_tenant_invoice_fk' }),
  check('old_metal_receipt_weights_valid', sql`${table.grossWeightMg} >= ${table.lessWeightMg} AND ${table.lessWeightMg} >= 0`),
  check('old_metal_receipt_purity_valid', sql`${table.purityBps} BETWEEN 1 AND 10000`),
  check('old_metal_receipt_value_nonnegative', sql`${table.baseRatePaisePerGram} >= 0 AND ${table.deductionPaisePerGram} >= 0 AND ${table.valuationPaise} >= 0`),
]);
