import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { calculateCatalogQuote, calculateOldMetalQuote } from './pricing.js';

const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(160),
  mobile: z.string().trim().min(5).max(32),
  email: z.union([z.string().trim().email().max(254), z.literal('')]).optional().nullable().transform(value => value || null),
  address: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
}).strict();

const updateCustomerSchema = createCustomerSchema.partial().refine(value => Object.keys(value).length > 0, {
  message: 'At least one customer field is required.',
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
}).strict();

const privilegedActionSchema = z.object({ reason: z.string().trim().min(4).max(240) }).strict();
const branchSchema = z.object({ name: z.string().trim().min(1).max(120) }).strict();
const stockCreateSchema = z.object({
  branchId: z.string().uuid(),
  itemCode: z.string().trim().min(1).max(80),
  barcode: z.string().trim().max(120).optional().nullable(),
  description: z.string().trim().min(1).max(300),
  metalType: z.string().trim().min(1).max(24),
  grossWeightMg: z.number().int().min(0).max(100000000),
  netWeightMg: z.number().int().min(0).max(100000000),
  purityBps: z.number().int().min(1).max(10000),
  ratePerGramPaise: z.number().int().min(0).max(1000000000000),
  makingChargeType: z.enum(['per_gram', 'fixed', 'percentage']),
  makingChargeValue: z.number().int().min(0).max(1000000000000),
  makingDiscountBps: z.number().int().min(0).max(10000).default(0),
  stoneValuePaise: z.number().int().min(0).max(1000000000000).default(0),
  hallmarkChargePaise: z.number().int().min(0).max(1000000000000).default(4500),
  otherChargesPaise: z.number().int().min(0).max(1000000000000).default(0),
  itemDiscountPaise: z.number().int().min(0).max(1000000000000).default(0),
  gstRateBps: z.number().int().min(0).max(10000).default(300),
  quantity: z.number().int().min(1).max(100000),
  reason: z.string().trim().min(4).max(240),
}).strict().refine(value => value.netWeightMg <= value.grossWeightMg, {
  path: ['netWeightMg'], message: 'Net weight cannot exceed gross weight.',
}).refine(value => value.makingChargeType !== 'percentage' || value.makingChargeValue <= 10000, {
  path: ['makingChargeValue'], message: 'Percentage making charge must be at most 10000 basis points.',
});
const stockListSchema = paginationSchema.extend({ branchId: z.string().uuid().optional() });
const adjustmentSchema = z.object({
  expectedQuantity: z.number().int().min(0).max(100000),
  quantityDelta: z.number().int().min(-100000).max(100000).refine(value => value !== 0),
  reason: z.string().trim().min(4).max(240),
}).strict();
const oldMetalPaymentSchema = z.object({
  metalType: z.enum(['Gold', 'Silver', 'Platinum']),
  grossWeightMg: z.number().int().min(1).max(100000000),
  lessWeightMg: z.number().int().min(0).max(100000000),
  purityBps: z.number().int().min(1).max(10000),
  baseRatePaisePerGram: z.number().int().min(0).max(1000000000000),
  deductionPaisePerGram: z.number().int().min(0).max(1000000000000),
}).strict().refine(value => value.lessWeightMg < value.grossWeightMg, {
  path: ['lessWeightMg'], message: 'Less weight must be lower than gross weight.',
}).refine(value => value.deductionPaisePerGram <= value.baseRatePaisePerGram, {
  path: ['deductionPaisePerGram'], message: 'Rate deduction cannot exceed the base rate.',
});
const invoiceCreateSchema = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid().optional().nullable(),
  items: z.array(z.object({ stockItemId: z.string().uuid(), quantity: z.number().int().min(1).max(1000) }).strict()).min(1).max(100),
  payments: z.object({
    cashPaise: z.number().int().min(0).max(1000000000000).default(0),
    bankPendingPaise: z.number().int().min(0).max(1000000000000).default(0),
    oldMetal: oldMetalPaymentSchema.optional().nullable(),
  }).strict().default({}),
}).strict().refine(value => new Set(value.items.map(item => item.stockItemId)).size === value.items.length, {
  path: ['items'], message: 'Each stock item may appear only once on an invoice.',
});

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function ensureSameOrigin(req, res, config, principal) {
  const origin = req.get('origin');
  let accepted = origin ? origin === config.appOrigin : false;
  if (!origin) {
    try {
      const site = req.get('sec-fetch-site');
      accepted = (!site || site === 'same-origin') && new URL(req.get('referer')).origin === config.appOrigin;
    }
    catch { accepted = false; }
  }
  const expectedToken = createHmac('sha256', config.authSecret).update(principal.sessionId).digest('base64url');
  const suppliedToken = req.get('x-csrf-token') || '';
  const expected = Buffer.from(expectedToken);
  const supplied = Buffer.from(suppliedToken);
  const tokenValid = supplied.length === expected.length && timingSafeEqual(supplied, expected);
  if (!accepted || !tokenValid) {
    sendError(res, 403, 'CSRF_ORIGIN_REJECTED', 'A same-origin request is required.');
    return false;
  }
  return true;
}

function requireManager(req, res) {
  if (['OWNER', 'MANAGER'].includes(req.principal.role)) return true;
  sendError(res, 403, 'ROLE_FORBIDDEN', 'Only tenant owners or managers can perform this action.');
  return false;
}

function ensureMutationRequest(req, res, config) {
  return ensureSameOrigin(req, res, config, req.principal);
}

function businessDateAndFinancialYear(now = new Date()) {
  const dateParts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now).reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {});
  const businessDate = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  const calendarYear = Number(dateParts.year);
  const fiscalStart = Number(dateParts.month) >= 4 ? calendarYear : calendarYear - 1;
  const financialYear = `${String(fiscalStart).slice(-2)}-${String(fiscalStart + 1).slice(-2)}`;
  return { businessDate, financialYear };
}

async function loadInvoiceBundle(db, invoiceId, tenantId) {
  const invoiceResult = await db.query(
    `SELECT id, tenant_id AS "tenantId", branch_id AS "branchId", customer_id AS "customerId", sold_by AS "soldBy", financial_year AS "financialYear", document_number AS "documentNumber", business_date AS "businessDate", issuer_name_snapshot AS "issuerName", taxable_amount_paise AS "taxableAmountPaise", cgst_paise AS "cgstPaise", sgst_paise AS "sgstPaise", total_paise AS "totalPaise", outstanding_paise AS "outstandingPaise", created_at AS "createdAt"
     FROM invoice WHERE id = $1::uuid AND tenant_id = $2::uuid`, [invoiceId, tenantId],
  );
  if (!invoiceResult.rowCount) return null;
  const [lines, payments] = await Promise.all([
    db.query(
      `SELECT id, stock_item_id AS "stockItemId", item_code_snapshot AS "itemCode", description_snapshot AS description, quantity, gross_weight_mg_snapshot AS "grossWeightMg", net_weight_mg_snapshot AS "netWeightMg", purity_bps_snapshot AS "purityBps", line_taxable_amount_paise AS "taxableAmountPaise", line_cgst_paise AS "cgstPaise", line_sgst_paise AS "sgstPaise", line_total_paise AS "totalPaise", pricing_snapshot AS "pricingSnapshot"
       FROM invoice_line WHERE invoice_id = $1::uuid AND tenant_id = $2::uuid ORDER BY id`, [invoiceId, tenantId],
    ),
    db.query(
      `SELECT method, status, amount_paise AS "amountPaise", reference, created_at AS "createdAt"
       FROM invoice_payment WHERE invoice_id = $1::uuid AND tenant_id = $2::uuid ORDER BY created_at, id`, [invoiceId, tenantId],
    ),
  ]);
  return { ...invoiceResult.rows[0], lines: lines.rows, payments: payments.rows };
}

export function createApp({ auth, pool, config }) {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.all('/api/auth/*path', toNodeHandler(auth));
  app.use(express.json({ limit: '32kb', strict: true }));
  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok' });
    } catch {
      sendError(res, 503, 'DATABASE_UNAVAILABLE', 'Operational storage is unavailable.');
    }
  });
  const authenticate = async (req, res, next) => {
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user || !session?.session || session.session.expiresAt <= new Date()) {
        return sendError(res, 401, 'UNAUTHENTICATED', 'A valid session is required.');
      }
      const tenantId = req.get('x-tenant-id');
      if (!tenantId) return sendError(res, 400, 'TENANT_REQUIRED', 'Select an authorized tenant.');
      if (!z.string().uuid().safeParse(tenantId).success) return sendError(res, 400, 'INVALID_TENANT', 'Tenant identifier must be a UUID.');
      const membershipResult = await pool.query(
        `SELECT m.tenant_id, m.role, g.role AS platform_role
         FROM membership m JOIN tenant t ON t.id = m.tenant_id
         LEFT JOIN platform_grant g ON g.user_id = m.user_id
         WHERE m.user_id = $1 AND m.tenant_id = $2::uuid AND m.enabled = true AND t.status = 'ACTIVE'`,
        [session.user.id, tenantId],
      );
      const membership = membershipResult.rows[0];
      if (!membership) return sendError(res, 403, 'TENANT_FORBIDDEN', 'No active membership grants access to this tenant.');
      req.principal = {
        userId: session.user.id,
        sessionId: session.session.id,
        tenantId: membership.tenant_id,
        role: membership.role,
        platformRole: membership.platform_role ?? null,
      };
      next();
    } catch (error) {
      next(error);
    }
  };

  app.get('/api/branches', authenticate, async (req, res) => {
    const result = await pool.query(
      'SELECT id, name FROM tenant_branch WHERE tenant_id = $1::uuid AND active = true ORDER BY name, id',
      [req.principal.tenantId],
    );
    res.json({ items: result.rows });
  });

  app.post('/api/branches', authenticate, (req, res, next) => {
    if (!ensureMutationRequest(req, res, config) || !requireManager(req, res)) return;
    next();
  }, async (req, res) => {
    const parsed = branchSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, 'INVALID_BRANCH', 'Branch name is invalid.');
    try {
      const result = await pool.query(
        'INSERT INTO tenant_branch (tenant_id, name) VALUES ($1::uuid, $2) RETURNING id, name',
        [req.principal.tenantId, parsed.data.name],
      );
      res.status(201).json({ branch: result.rows[0] });
    } catch (error) {
      if (error?.code === '23505') return sendError(res, 409, 'BRANCH_EXISTS', 'A branch with this name already exists.');
      throw error;
    }
  });

  app.get('/api/stock', authenticate, async (req, res) => {
    const { tenantId, ...rawQuery } = req.query;
    if (tenantId !== undefined) return sendError(res, 400, 'TENANT_FILTER_NOT_ALLOWED', 'Tenant scope comes from the authenticated membership.');
    const parsed = stockListSchema.safeParse(rawQuery);
    if (!parsed.success) return sendError(res, 400, 'INVALID_PAGINATION', 'Stock pagination or branch filter is invalid.');
    const { page, pageSize, branchId } = parsed.data;
    const filters = ['tenant_id = $1::uuid', 'archived = false'];
    const values = [req.principal.tenantId];
    if (branchId) {
      values.push(branchId);
      filters.push(`branch_id = $${values.length}::uuid`);
    }
    const where = filters.join(' AND ');
    const filterValues = [...values];
    values.push(pageSize, (page - 1) * pageSize);
    const [items, total] = await Promise.all([
      pool.query(
        `SELECT id, tenant_id AS "tenantId", branch_id AS "branchId", item_code AS "itemCode", barcode, description, metal_type AS "metalType", gross_weight_mg AS "grossWeightMg", net_weight_mg AS "netWeightMg", purity_bps AS "purityBps", rate_per_gram_paise AS "ratePerGramPaise", making_charge_type AS "makingChargeType", making_charge_value AS "makingChargeValue", making_discount_bps AS "makingDiscountBps", stone_value_paise AS "stoneValuePaise", hallmark_charge_paise AS "hallmarkChargePaise", other_charges_paise AS "otherChargesPaise", item_discount_paise AS "itemDiscountPaise", gst_rate_bps AS "gstRateBps", quantity_available AS "quantityAvailable", catalog_price_paise AS "catalogPricePaise", created_at AS "createdAt", updated_at AS "updatedAt"
         FROM stock_item WHERE ${where} ORDER BY item_code, id LIMIT $${values.length - 1} OFFSET $${values.length}`,
        values,
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM stock_item WHERE ${where}`, filterValues),
    ]);
    res.json({ items: items.rows, page, pageSize, total: total.rows[0].total });
  });

  app.post('/api/stock', authenticate, (req, res, next) => {
    if (!ensureMutationRequest(req, res, config) || !requireManager(req, res)) return;
    next();
  }, async (req, res) => {
    const parsed = stockCreateSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, 'INVALID_STOCK_ITEM', 'Stock fields are invalid or include unsupported properties.');
    const item = parsed.data;
    const quote = calculateCatalogQuote(item);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO stock_item (tenant_id, branch_id, item_code, barcode, description, metal_type, gross_weight_mg, net_weight_mg, purity_bps, rate_per_gram_paise, making_charge_type, making_charge_value, making_discount_bps, stone_value_paise, hallmark_charge_paise, other_charges_paise, item_discount_paise, gst_rate_bps, quantity_available, catalog_price_paise)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
         RETURNING id, tenant_id AS "tenantId", branch_id AS "branchId", item_code AS "itemCode", barcode, description, metal_type AS "metalType", gross_weight_mg AS "grossWeightMg", net_weight_mg AS "netWeightMg", purity_bps AS "purityBps", rate_per_gram_paise AS "ratePerGramPaise", making_charge_type AS "makingChargeType", making_charge_value AS "makingChargeValue", making_discount_bps AS "makingDiscountBps", stone_value_paise AS "stoneValuePaise", hallmark_charge_paise AS "hallmarkChargePaise", other_charges_paise AS "otherChargesPaise", item_discount_paise AS "itemDiscountPaise", gst_rate_bps AS "gstRateBps", quantity_available AS "quantityAvailable", catalog_price_paise AS "catalogPricePaise", created_at AS "createdAt", updated_at AS "updatedAt"`,
        [req.principal.tenantId, item.branchId, item.itemCode, item.barcode || null, item.description, item.metalType, item.grossWeightMg, item.netWeightMg, item.purityBps, item.ratePerGramPaise, item.makingChargeType, item.makingChargeValue, item.makingDiscountBps, item.stoneValuePaise, item.hallmarkChargePaise, item.otherChargesPaise, item.itemDiscountPaise, item.gstRateBps, item.quantity, quote.totalPricePaise],
      );
      await client.query(
        `INSERT INTO stock_movement (tenant_id, stock_item_id, movement_type, quantity_delta, reason, actor_user_id)
         VALUES ($1::uuid, $2::uuid, 'RECEIPT', $3, $4, $5)`,
        [req.principal.tenantId, result.rows[0].id, item.quantity, item.reason, req.principal.userId],
      );
      await client.query('COMMIT');
      res.status(201).json({ item: { ...result.rows[0], quote } });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error?.code === '23505') return sendError(res, 409, 'STOCK_IDENTIFIER_EXISTS', 'Item code or barcode already exists in this tenant.');
      if (error?.code === '23503') return sendError(res, 400, 'BRANCH_FORBIDDEN', 'Branch does not belong to this tenant.');
      throw error;
    } finally {
      client.release();
    }
  });

  app.get('/api/stock/:id/movements', authenticate, async (req, res) => {
    if (!z.string().uuid().safeParse(req.params.id).success) return sendError(res, 404, 'STOCK_ITEM_NOT_FOUND', 'Stock item was not found.');
    const parent = await pool.query('SELECT id FROM stock_item WHERE id = $1::uuid AND tenant_id = $2::uuid AND archived = false', [req.params.id, req.principal.tenantId]);
    if (!parent.rowCount) return sendError(res, 404, 'STOCK_ITEM_NOT_FOUND', 'Stock item was not found.');
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) return sendError(res, 400, 'INVALID_PAGINATION', 'Movement pagination is invalid.');
    const { page, pageSize } = parsed.data;
    const [items, total] = await Promise.all([
      pool.query(
        `SELECT id, stock_item_id AS "stockItemId", movement_type AS "movementType", quantity_delta AS "quantityDelta", reason, actor_user_id AS "actorUserId", created_at AS "createdAt"
         FROM stock_movement WHERE tenant_id = $1::uuid AND stock_item_id = $2::uuid
         ORDER BY created_at DESC, id DESC LIMIT $3 OFFSET $4`,
        [req.principal.tenantId, req.params.id, pageSize, (page - 1) * pageSize],
      ),
      pool.query('SELECT COUNT(*)::int AS total FROM stock_movement WHERE tenant_id = $1::uuid AND stock_item_id = $2::uuid', [req.principal.tenantId, req.params.id]),
    ]);
    res.json({ items: items.rows, page, pageSize, total: total.rows[0].total });
  });

  app.post('/api/stock/:id/adjustments', authenticate, (req, res, next) => {
    if (!ensureMutationRequest(req, res, config) || !requireManager(req, res)) return;
    next();
  }, async (req, res) => {
    if (!z.string().uuid().safeParse(req.params.id).success) return sendError(res, 404, 'STOCK_ITEM_NOT_FOUND', 'Stock item was not found.');
    const parsed = adjustmentSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, 'INVALID_ADJUSTMENT', 'A nonzero quantity change, expected quantity, and reason are required.');
    const { expectedQuantity, quantityDelta, reason } = parsed.data;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updated = await client.query(
        `UPDATE stock_item SET quantity_available = quantity_available + $3, updated_at = NOW()
         WHERE id = $1::uuid AND tenant_id = $2::uuid AND archived = false AND quantity_available = $4 AND quantity_available + $3 >= 0
         RETURNING id, quantity_available AS "quantityAvailable"`,
        [req.params.id, req.principal.tenantId, quantityDelta, expectedQuantity],
      );
      if (!updated.rowCount) {
        const existing = await client.query('SELECT quantity_available FROM stock_item WHERE id = $1::uuid AND tenant_id = $2::uuid AND archived = false', [req.params.id, req.principal.tenantId]);
        await client.query('ROLLBACK');
        if (!existing.rowCount) return sendError(res, 404, 'STOCK_ITEM_NOT_FOUND', 'Stock item was not found.');
        return sendError(res, 409, 'STOCK_QUANTITY_CONFLICT', 'Stock changed since it was read or the adjustment would make quantity negative.');
      }
      await client.query(
        `INSERT INTO stock_movement (tenant_id, stock_item_id, movement_type, quantity_delta, reason, actor_user_id)
         VALUES ($1::uuid, $2::uuid, 'ADJUSTMENT', $3, $4, $5)`,
        [req.principal.tenantId, req.params.id, quantityDelta, reason, req.principal.userId],
      );
      await client.query('COMMIT');
      res.json({ itemId: updated.rows[0].id, quantityAvailable: updated.rows[0].quantityAvailable });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });

  app.get('/api/stock/:id', authenticate, async (req, res) => {
    if (!z.string().uuid().safeParse(req.params.id).success) return sendError(res, 404, 'STOCK_ITEM_NOT_FOUND', 'Stock item was not found.');
    const result = await pool.query(
      `SELECT id, tenant_id AS "tenantId", branch_id AS "branchId", item_code AS "itemCode", barcode, description, metal_type AS "metalType", gross_weight_mg AS "grossWeightMg", net_weight_mg AS "netWeightMg", purity_bps AS "purityBps", rate_per_gram_paise AS "ratePerGramPaise", making_charge_type AS "makingChargeType", making_charge_value AS "makingChargeValue", making_discount_bps AS "makingDiscountBps", stone_value_paise AS "stoneValuePaise", hallmark_charge_paise AS "hallmarkChargePaise", other_charges_paise AS "otherChargesPaise", item_discount_paise AS "itemDiscountPaise", gst_rate_bps AS "gstRateBps", quantity_available AS "quantityAvailable", catalog_price_paise AS "catalogPricePaise", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM stock_item WHERE id = $1::uuid AND tenant_id = $2::uuid AND archived = false`,
      [req.params.id, req.principal.tenantId],
    );
    if (!result.rowCount) return sendError(res, 404, 'STOCK_ITEM_NOT_FOUND', 'Stock item was not found.');
    res.json({ item: result.rows[0] });
  });

  app.post('/api/invoices', authenticate, (req, res, next) => {
    if (!ensureMutationRequest(req, res, config)) return;
    const key = req.get('idempotency-key');
    if (!z.string().min(8).max(128).regex(/^[A-Za-z0-9._:-]+$/).safeParse(key).success) {
      return sendError(res, 400, 'IDEMPOTENCY_KEY_REQUIRED', 'Supply a stable Idempotency-Key for this sale.');
    }
    req.idempotencyKey = key;
    next();
  }, async (req, res) => {
    const parsed = invoiceCreateSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, 'INVALID_INVOICE', 'Sale fields are invalid or include unsupported totals, status, or authority fields.');
    const sale = parsed.data;
    const canonicalRequest = {
      branchId: sale.branchId,
      customerId: sale.customerId || null,
      items: [...sale.items].sort((a, b) => a.stockItemId.localeCompare(b.stockItemId)),
      payments: {
        cashPaise: sale.payments.cashPaise,
        bankPendingPaise: sale.payments.bankPendingPaise,
        oldMetal: sale.payments.oldMetal || null,
      },
    };
    const requestHash = createHash('sha256').update(JSON.stringify(canonicalRequest)).digest('hex');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [`${req.principal.tenantId}:${req.principal.userId}:${req.idempotencyKey}`],
      );
      const existing = await client.query(
        'SELECT id, request_hash FROM invoice WHERE tenant_id = $1::uuid AND sold_by = $2 AND idempotency_key = $3',
        [req.principal.tenantId, req.principal.userId, req.idempotencyKey],
      );
      if (existing.rowCount) {
        if (existing.rows[0].request_hash !== requestHash) {
          await client.query('ROLLBACK');
          return sendError(res, 409, 'IDEMPOTENCY_KEY_REUSED', 'This idempotency key was already used for a different sale.');
        }
        await client.query('COMMIT');
        const invoice = await loadInvoiceBundle(pool, existing.rows[0].id, req.principal.tenantId);
        return res.status(200).json({ invoice, replayed: true });
      }

      const branch = await client.query(
        'SELECT id FROM tenant_branch WHERE id = $1::uuid AND tenant_id = $2::uuid AND active = true',
        [sale.branchId, req.principal.tenantId],
      );
      if (!branch.rowCount) throw Object.assign(new Error('Branch is not active in this tenant.'), { apiStatus: 404, apiCode: 'BRANCH_NOT_FOUND' });

      let customer = null;
      if (sale.customerId) {
        const result = await client.query(
          'SELECT id FROM customer WHERE id = $1::uuid AND tenant_id = $2::uuid AND archived = false',
          [sale.customerId, req.principal.tenantId],
        );
        if (!result.rowCount) throw Object.assign(new Error('Customer reference is not active in this tenant.'), { apiStatus: 400, apiCode: 'INVALID_CUSTOMER_REFERENCE' });
        customer = result.rows[0];
      }

      const stockResult = await client.query(
        `SELECT id, tenant_id AS "tenantId", branch_id AS "branchId", item_code AS "itemCode", description, metal_type AS "metalType", gross_weight_mg AS "grossWeightMg", net_weight_mg AS "netWeightMg", purity_bps AS "purityBps", rate_per_gram_paise AS "ratePerGramPaise", making_charge_type AS "makingChargeType", making_charge_value AS "makingChargeValue", making_discount_bps AS "makingDiscountBps", stone_value_paise AS "stoneValuePaise", hallmark_charge_paise AS "hallmarkChargePaise", other_charges_paise AS "otherChargesPaise", item_discount_paise AS "itemDiscountPaise", gst_rate_bps AS "gstRateBps", quantity_available AS "quantityAvailable", catalog_price_paise AS "catalogPricePaise"
         FROM stock_item WHERE tenant_id = $1::uuid AND id = ANY($2::uuid[]) AND archived = false ORDER BY id FOR UPDATE`,
        [req.principal.tenantId, sale.items.map(item => item.stockItemId)],
      );
      if (stockResult.rowCount !== sale.items.length) throw Object.assign(new Error('One or more stock items are not available in this tenant.'), { apiStatus: 404, apiCode: 'STOCK_ITEM_NOT_FOUND' });
      const stockById = new Map(stockResult.rows.map(item => [item.id, item]));
      const pricedLines = sale.items.map(requestLine => {
        const stock = stockById.get(requestLine.stockItemId);
        if (stock.branchId !== sale.branchId) throw Object.assign(new Error('All items must belong to the selected branch.'), { apiStatus: 400, apiCode: 'BRANCH_ITEM_MISMATCH' });
        if (stock.quantityAvailable < requestLine.quantity) throw Object.assign(new Error(`Insufficient quantity for ${stock.itemCode}.`), { apiStatus: 409, apiCode: 'INSUFFICIENT_STOCK' });
        const quote = calculateCatalogQuote(stock);
        const line = {
          stock,
          quantity: requestLine.quantity,
          quote,
          taxableAmountPaise: quote.taxableAmountPaise * requestLine.quantity,
          cgstPaise: quote.cgstPaise * requestLine.quantity,
          sgstPaise: quote.sgstPaise * requestLine.quantity,
          totalPaise: quote.totalPricePaise * requestLine.quantity,
        };
        if (![line.taxableAmountPaise, line.cgstPaise, line.sgstPaise, line.totalPaise].every(Number.isSafeInteger)) {
          throw Object.assign(new Error('Sale amount exceeds the supported exact-money range.'), { apiStatus: 400, apiCode: 'AMOUNT_TOO_LARGE' });
        }
        return line;
      });
      const taxableTotalPaise = pricedLines.reduce((sum, line) => sum + line.taxableAmountPaise, 0);
      const cgstTotalPaise = pricedLines.reduce((sum, line) => sum + line.cgstPaise, 0);
      const sgstTotalPaise = pricedLines.reduce((sum, line) => sum + line.sgstPaise, 0);
      const totalPaise = pricedLines.reduce((sum, line) => sum + line.totalPaise, 0);
      if (![taxableTotalPaise, cgstTotalPaise, sgstTotalPaise, totalPaise].every(Number.isSafeInteger) || totalPaise <= 0) {
        throw Object.assign(new Error('Sale total must be positive and within the exact-money range.'), { apiStatus: 400, apiCode: 'INVALID_SALE_TOTAL' });
      }

      const oldMetalQuote = sale.payments.oldMetal ? calculateOldMetalQuote(sale.payments.oldMetal) : null;
      const oldMetalPaise = oldMetalQuote?.valuationPaise || 0;
      const confirmedTenderPaise = sale.payments.cashPaise + oldMetalPaise;
      if (!Number.isSafeInteger(confirmedTenderPaise) || confirmedTenderPaise > totalPaise) {
        throw Object.assign(new Error('Confirmed cash and exchange value cannot exceed the server-calculated invoice total.'), { apiStatus: 400, apiCode: 'OVERPAYMENT_NOT_SUPPORTED' });
      }
      if (sale.payments.oldMetal && oldMetalPaise <= 0) {
        throw Object.assign(new Error('Old metal must have a positive server-calculated valuation.'), { apiStatus: 400, apiCode: 'INVALID_OLD_METAL_VALUE' });
      }
      const outstandingPaise = totalPaise - confirmedTenderPaise;
      if (outstandingPaise > 0 && !customer) {
        throw Object.assign(new Error('A tenant customer is required when a balance remains outstanding.'), { apiStatus: 400, apiCode: 'CUSTOMER_REQUIRED_FOR_CREDIT' });
      }
      if (sale.payments.bankPendingPaise > outstandingPaise) {
        throw Object.assign(new Error('Pending bank transfer cannot exceed the remaining outstanding balance.'), { apiStatus: 400, apiCode: 'INVALID_PENDING_TENDER' });
      }

      const { businessDate, financialYear } = businessDateAndFinancialYear();
      const sequenceResult = await client.query(
        `INSERT INTO invoice_counter (tenant_id, financial_year, next_number) VALUES ($1::uuid, $2, 1)
         ON CONFLICT (tenant_id, financial_year) DO UPDATE SET next_number = invoice_counter.next_number + 1
         RETURNING next_number`,
        [req.principal.tenantId, financialYear],
      );
      const documentNumber = `INV/${financialYear}/${String(sequenceResult.rows[0].next_number).padStart(6, '0')}`;
      const tenantResult = await client.query('SELECT name FROM tenant WHERE id = $1::uuid', [req.principal.tenantId]);
      const issuerNameSnapshot = tenantResult.rows[0].name;
      const invoiceResult = await client.query(
        `INSERT INTO invoice (tenant_id, branch_id, customer_id, sold_by, financial_year, document_number, idempotency_key, request_hash, business_date, issuer_name_snapshot, taxable_amount_paise, cgst_paise, sgst_paise, total_paise, outstanding_paise)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING id`,
        [req.principal.tenantId, sale.branchId, customer?.id || null, req.principal.userId, financialYear, documentNumber, req.idempotencyKey, requestHash, businessDate, issuerNameSnapshot, taxableTotalPaise, cgstTotalPaise, sgstTotalPaise, totalPaise, outstandingPaise],
      );
      const invoiceId = invoiceResult.rows[0].id;
      for (const line of pricedLines) {
        const stock = line.stock;
        const pricingSnapshot = JSON.stringify({
          ratePerGramPaise: stock.ratePerGramPaise,
          makingChargeType: stock.makingChargeType,
          makingChargeValue: stock.makingChargeValue,
          makingDiscountBps: stock.makingDiscountBps,
          stoneValuePaise: stock.stoneValuePaise,
          hallmarkChargePaise: stock.hallmarkChargePaise,
          otherChargesPaise: stock.otherChargesPaise,
          itemDiscountPaise: stock.itemDiscountPaise,
          gstRateBps: stock.gstRateBps,
          unitQuotePaise: line.quote.totalPricePaise,
        });
        await client.query(
          `INSERT INTO invoice_line (tenant_id, invoice_id, stock_item_id, item_code_snapshot, description_snapshot, quantity, gross_weight_mg_snapshot, net_weight_mg_snapshot, purity_bps_snapshot, unit_taxable_amount_paise, unit_cgst_paise, unit_sgst_paise, unit_total_paise, line_taxable_amount_paise, line_cgst_paise, line_sgst_paise, line_total_paise, pricing_snapshot)
           VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
          [req.principal.tenantId, invoiceId, stock.id, stock.itemCode, stock.description, line.quantity, stock.grossWeightMg, stock.netWeightMg, stock.purityBps, line.quote.taxableAmountPaise, line.quote.cgstPaise, line.quote.sgstPaise, line.quote.totalPricePaise, line.taxableAmountPaise, line.cgstPaise, line.sgstPaise, line.totalPaise, pricingSnapshot],
        );
        const updated = await client.query(
          `UPDATE stock_item SET quantity_available = quantity_available - $3, updated_at = NOW()
           WHERE id = $1::uuid AND tenant_id = $2::uuid AND quantity_available >= $3`,
          [stock.id, req.principal.tenantId, line.quantity],
        );
        if (!updated.rowCount) throw Object.assign(new Error('Stock changed while finalizing the sale.'), { apiStatus: 409, apiCode: 'INSUFFICIENT_STOCK' });
        await client.query(
          `INSERT INTO stock_movement (tenant_id, stock_item_id, movement_type, quantity_delta, reason, actor_user_id)
           VALUES ($1::uuid, $2::uuid, 'SALE', $3, $4, $5)`,
          [req.principal.tenantId, stock.id, -line.quantity, `Sale ${documentNumber}`, req.principal.userId],
        );
      }

      if (sale.payments.cashPaise > 0) {
        await client.query(
          `INSERT INTO invoice_payment (tenant_id, invoice_id, method, status, amount_paise, actor_user_id) VALUES ($1::uuid, $2::uuid, 'CASH', 'RECEIVED', $3, $4)`,
          [req.principal.tenantId, invoiceId, sale.payments.cashPaise, req.principal.userId],
        );
      }
      if (sale.payments.bankPendingPaise > 0) {
        await client.query(
          `INSERT INTO invoice_payment (tenant_id, invoice_id, method, status, amount_paise, actor_user_id) VALUES ($1::uuid, $2::uuid, 'BANK_PENDING', 'PENDING', $3, $4)`,
          [req.principal.tenantId, invoiceId, sale.payments.bankPendingPaise, req.principal.userId],
        );
      }
      if (oldMetalQuote) {
        await client.query(
          `INSERT INTO old_metal_receipt (tenant_id, invoice_id, metal_type, gross_weight_mg, less_weight_mg, purity_bps, base_rate_paise_per_gram, deduction_paise_per_gram, valuation_paise, actor_user_id)
           VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [req.principal.tenantId, invoiceId, sale.payments.oldMetal.metalType, sale.payments.oldMetal.grossWeightMg, sale.payments.oldMetal.lessWeightMg, sale.payments.oldMetal.purityBps, sale.payments.oldMetal.baseRatePaisePerGram, sale.payments.oldMetal.deductionPaisePerGram, oldMetalPaise, req.principal.userId],
        );
        await client.query(
          `INSERT INTO invoice_payment (tenant_id, invoice_id, method, status, amount_paise, actor_user_id) VALUES ($1::uuid, $2::uuid, 'OLD_METAL', 'RECEIVED', $3, $4)`,
          [req.principal.tenantId, invoiceId, oldMetalPaise, req.principal.userId],
        );
      }

      const ledgerRows = [
        { account: 'CASH', debit: sale.payments.cashPaise, credit: 0 },
        { account: 'SCRAP_METAL', debit: oldMetalPaise, credit: 0 },
        { account: 'ACCOUNTS_RECEIVABLE', debit: outstandingPaise, credit: 0 },
        { account: 'SALES_REVENUE', debit: 0, credit: taxableTotalPaise },
        { account: 'OUTPUT_CGST', debit: 0, credit: cgstTotalPaise },
        { account: 'OUTPUT_SGST', debit: 0, credit: sgstTotalPaise },
      ].filter(entry => entry.debit > 0 || entry.credit > 0);
      const debitTotal = ledgerRows.reduce((sum, entry) => sum + entry.debit, 0);
      const creditTotal = ledgerRows.reduce((sum, entry) => sum + entry.credit, 0);
      if (debitTotal !== creditTotal || creditTotal !== totalPaise) throw new Error('Server ledger invariant failed; sale transaction rolled back.');
      for (const entry of ledgerRows) {
        await client.query(
          `INSERT INTO ledger_entry (tenant_id, invoice_id, account_code, debit_paise, credit_paise, actor_user_id) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6)`,
          [req.principal.tenantId, invoiceId, entry.account, entry.debit, entry.credit, req.principal.userId],
        );
      }
      await client.query('COMMIT');
      const invoice = await loadInvoiceBundle(pool, invoiceId, req.principal.tenantId);
      res.status(201).json({ invoice, replayed: false });
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { /* transaction may already be closed */ }
      if (error?.apiStatus) return sendError(res, error.apiStatus, error.apiCode, error.message);
      if (error?.code === '23503') return sendError(res, 400, 'INVALID_REFERENCE', 'A referenced tenant record is no longer available.');
      if (error?.code === '23505') return sendError(res, 409, 'SALE_CONFLICT', 'The sale conflicts with a previously recorded request.');
      throw error;
    } finally {
      client.release();
    }
  });

  app.get('/api/invoices', authenticate, async (req, res) => {
    const { tenantId, ...rawQuery } = req.query;
    if (tenantId !== undefined) return sendError(res, 400, 'TENANT_FILTER_NOT_ALLOWED', 'Tenant scope comes from the authenticated membership.');
    const parsed = paginationSchema.safeParse(rawQuery);
    if (!parsed.success) return sendError(res, 400, 'INVALID_PAGINATION', 'Invoice pagination is invalid.');
    const { page, pageSize } = parsed.data;
    const [items, total] = await Promise.all([
      pool.query(
        `SELECT id, document_number AS "documentNumber", financial_year AS "financialYear", business_date AS "businessDate", issuer_name_snapshot AS "issuerName", taxable_amount_paise AS "taxableAmountPaise", cgst_paise AS "cgstPaise", sgst_paise AS "sgstPaise", total_paise AS "totalPaise", outstanding_paise AS "outstandingPaise", created_at AS "createdAt"
         FROM invoice WHERE tenant_id = $1::uuid ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`,
        [req.principal.tenantId, pageSize, (page - 1) * pageSize],
      ),
      pool.query('SELECT COUNT(*)::int AS total FROM invoice WHERE tenant_id = $1::uuid', [req.principal.tenantId]),
    ]);
    res.json({ items: items.rows, page, pageSize, total: total.rows[0].total });
  });

  app.get('/api/invoices/:id', authenticate, async (req, res) => {
    if (!z.string().uuid().safeParse(req.params.id).success) return sendError(res, 404, 'INVOICE_NOT_FOUND', 'Invoice was not found.');
    const invoice = await loadInvoiceBundle(pool, req.params.id, req.principal.tenantId);
    if (!invoice) return sendError(res, 404, 'INVOICE_NOT_FOUND', 'Invoice was not found.');
    res.json({ invoice });
  });

  app.get('/api/memberships', async (req, res) => {
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user || !session?.session || session.session.expiresAt <= new Date()) {
        return sendError(res, 401, 'UNAUTHENTICATED', 'A valid session is required.');
      }
      const memberships = await pool.query(
        `SELECT t.id AS tenant_id, t.name AS tenant_name, m.role
         FROM membership m JOIN tenant t ON t.id = m.tenant_id
         WHERE m.user_id = $1 AND m.enabled = true AND t.status = 'ACTIVE'
         ORDER BY t.name ASC`, [session.user.id],
      );
      const csrfToken = createHmac('sha256', config.authSecret).update(session.session.id).digest('base64url');
      res.json({
        memberships: memberships.rows.map(m => ({ tenantId: m.tenant_id, tenantName: m.tenant_name, role: m.role })),
        csrfToken,
      });
    } catch (error) {
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to load memberships.' } });
    }
  });

  app.get('/api/customers', authenticate, async (req, res) => {
    const { tenantId, ...rawQuery } = req.query;
    if (tenantId !== undefined) return sendError(res, 400, 'TENANT_FILTER_NOT_ALLOWED', 'Tenant scope comes from the authenticated membership.');
    const parsed = paginationSchema.safeParse(rawQuery);
    if (!parsed.success) return sendError(res, 400, 'INVALID_PAGINATION', 'Pagination must use page >= 1 and pageSize from 1 to 100.');
    const { page, pageSize } = parsed.data;
    const [items, total] = await Promise.all([
      pool.query(
        `SELECT id, tenant_id AS "tenantId", name, mobile, email, address, city, created_at AS "createdAt", updated_at AS "updatedAt"
         FROM customer WHERE tenant_id = $1::uuid AND archived = false
         ORDER BY name ASC, id ASC LIMIT $2 OFFSET $3`, [req.principal.tenantId, pageSize, (page - 1) * pageSize],
      ),
      pool.query('SELECT COUNT(*)::int AS total FROM customer WHERE tenant_id = $1::uuid AND archived = false', [req.principal.tenantId]),
    ]);
    res.json({ items: items.rows, page, pageSize, total: total.rows[0].total });
  });

  app.post('/api/customers', authenticate, (req, res, next) => {
    if (!ensureSameOrigin(req, res, config, req.principal)) return;
    next();
  }, async (req, res) => {
    const parsed = createCustomerSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, 'INVALID_CUSTOMER', 'Customer fields are invalid or include unsupported properties.');
    const { name, mobile, email = null, address = null, city = null } = parsed.data;
    const result = await pool.query(
      `INSERT INTO customer (tenant_id, name, mobile, email, address, city)
       VALUES ($1::uuid, $2, $3, $4, $5, $6)
       RETURNING id, tenant_id AS "tenantId", name, mobile, email, address, city, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [req.principal.tenantId, name, mobile, email, address, city],
    );
    const customer = result.rows[0];
    res.status(201).json({ customer });
  });

  app.get('/api/customers/:id', authenticate, async (req, res) => {
    if (!z.string().uuid().safeParse(req.params.id).success) return sendError(res, 404, 'CUSTOMER_NOT_FOUND', 'Customer was not found.');
    const result = await pool.query(
      `SELECT id, tenant_id AS "tenantId", name, mobile, email, address, city, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM customer WHERE id = $1::uuid AND tenant_id = $2::uuid AND archived = false`, [req.params.id, req.principal.tenantId],
    );
    const customer = result.rows[0];
    if (!customer) return sendError(res, 404, 'CUSTOMER_NOT_FOUND', 'Customer was not found.');
    res.json({ customer });
  });

  app.patch('/api/customers/:id', authenticate, (req, res, next) => {
    if (!ensureSameOrigin(req, res, config, req.principal)) return;
    next();
  }, async (req, res) => {
    if (!z.string().uuid().safeParse(req.params.id).success) return sendError(res, 404, 'CUSTOMER_NOT_FOUND', 'Customer was not found.');
    const parsed = updateCustomerSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, 'INVALID_CUSTOMER', 'Customer fields are invalid or include unsupported properties.');
    const columns = { name: 'name', mobile: 'mobile', email: 'email', address: 'address', city: 'city' };
    const values = Object.entries(parsed.data);
    const assignments = values.map(([key], index) => `${columns[key]} = $${index + 3}`).join(', ');
    const result = await pool.query(
      `UPDATE customer SET ${assignments}, updated_at = NOW()
       WHERE id = $1::uuid AND tenant_id = $2::uuid AND archived = false
       RETURNING id, tenant_id AS "tenantId", name, mobile, email, address, city, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [req.params.id, req.principal.tenantId, ...values.map(([, value]) => value)],
    );
    if (!result.rowCount) return sendError(res, 404, 'CUSTOMER_NOT_FOUND', 'Customer was not found.');
    const customer = result.rows[0];
    res.json({ customer });
  });

  app.post('/api/customers/:id/archive', authenticate, (req, res, next) => {
    if (!ensureSameOrigin(req, res, config, req.principal)) return;
    if (!['OWNER', 'MANAGER'].includes(req.principal.role)) return sendError(res, 403, 'ROLE_FORBIDDEN', 'Only tenant owners or managers can archive customer records.');
    next();
  }, async (req, res) => {
    if (!z.string().uuid().safeParse(req.params.id).success) return sendError(res, 404, 'CUSTOMER_NOT_FOUND', 'Customer was not found.');
    const parsed = privilegedActionSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, 'INVALID_ACTION', 'A short reason is required.');
    const result = await pool.query(
      'UPDATE customer SET archived = true, archived_at = NOW(), archived_by = $3, archived_reason = $4, updated_at = NOW() WHERE id = $1::uuid AND tenant_id = $2::uuid AND archived = false',
      [req.params.id, req.principal.tenantId, req.principal.userId, parsed.data.reason],
    );
    if (!result.rowCount) return sendError(res, 404, 'CUSTOMER_NOT_FOUND', 'Customer was not found.');
    res.status(204).end();
  });

  app.use('/api', (_req, res) => sendError(res, 404, 'FEATURE_UNAVAILABLE', 'This operational endpoint is not available.'));

  app.use((error, _req, res, _next) => {
    if (error?.status === 400) return sendError(res, 400, 'BAD_REQUEST', 'Request body must be valid JSON.');
    console.error('[operational-api] request failed', error?.message ?? 'unknown error');
    sendError(res, 500, 'INTERNAL_ERROR', 'The request could not be completed.');
  });
  return app;
}
