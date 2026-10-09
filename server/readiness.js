export async function assertOperationalSchema(pool) {
  await pool.query(`SELECT u.disabled, c.archived_reason, s.catalog_price_paise, i.business_date,
    p.receipt_number, pc.next_number, l.account_code, r.window_start
    FROM "user" u, customer c, stock_item s, invoice i, invoice_payment p,
      payment_counter pc, ledger_entry l, auth_rate_limit r LIMIT 0`);
}
