import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('actual default app blocks workflows without touching storage; actual demo seed exports a valid snapshot', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'jewel-render-'));
  try {
    for (const mode of ['production', 'demo']) {
      const outfile = join(dir, mode + '.mjs');
      await build({ entryPoints: ['audit/regression/render-fixture.jsx'], bundle: true, platform: 'node', format: 'esm',
        outfile, define: { 'import.meta.env.VITE_APP_MODE': JSON.stringify(mode), 'process.env.NODE_ENV': '"production"' },
        banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' } });
      const harness = await import(outfile);
      let readCount = 0;
      globalThis.localStorage = { getItem: () => { readCount++; return null; } };
      if (mode === 'production') {
        assert.match(harness.renderApp(), /Operational mode unavailable/);
        assert.equal(readCount, 0);
      } else {
        const { backup, html } = harness.renderSeed();
        assert.equal(backup.schemaVersion, 2);
        assert.ok(backup.karigarVouchers.length);
        assert.ok(backup.schemeEnrollments.length);
        assert.match(html, /reports are unavailable/);
        assert.doesNotMatch(html, /All Ledgers Balanced|GSTR1_/);
      }
    }
  } finally { delete globalThis.localStorage; await rm(dir, { recursive: true, force: true }); }
});

test('invoice print separates issue payments and later receipts with reconciled current balance', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'jewel-invoice-render-'));
  try {
    const outfile = join(dir, 'invoice.mjs');
    await build({ stdin: { contents: `import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import Modal from './src/components/modules/InvoiceViewModal.jsx'; export const render=(fixture)=>{globalThis.invoicePrintFixture=fixture;return renderToStaticMarkup(React.createElement(Modal))}`, resolveDir: process.cwd() },
      bundle: true, platform: 'node', format: 'esm', outfile,
      define: { 'process.env.NODE_ENV': '"production"' },
      banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
      plugins: [{ name: 'invoice-context-fixture', setup(builder) {
        builder.onResolve({ filter: /JewelleryContext$/ }, () => ({ path: 'fixture', namespace: 'invoice-fixture' }));
        builder.onLoad({ filter: /.*/, namespace: 'invoice-fixture' }, () => ({ contents: 'export const useJewellery=()=>globalThis.invoicePrintFixture;' }));
      } }],
    });
    const { render } = await import(outfile);
    const previewInvoice = { id:'I1', firmId:'F1', invoiceNo:'DEMO1', date:'2026-10-09', items:[], totalInvoiceAmount:1030,
      payments:{cash:130,totalReceived:130,balanceUdhaarDue:900}, firmSnapshot:{name:'Synthetic Issuer'} };
    const receipt = {invoiceId:'I1',firmId:'F1',amount:600};
    const partial = render({previewInvoice,udhaarRepayments:[receipt]});
    assert.match(partial,/PAYMENT MODES AT ISSUE/);
    assert.match(partial,/REPAYMENTS AFTER ISSUE:<\/span><span>₹600\.00/);
    assert.match(partial,/TOTAL RECEIVED TO DATE:<\/span><span>₹730\.00/);
    assert.match(partial,/BALANCE DUE \(UDHAAR\):<\/span><span>₹300\.00/);
    const paid = render({previewInvoice,udhaarRepayments:[{...receipt,amount:900}]});
    assert.match(paid,/TOTAL RECEIVED TO DATE:<\/span><span>₹1,030\.00/);
    assert.doesNotMatch(paid,/BALANCE DUE \(UDHAAR\)/);
    assert.equal(previewInvoice.payments.totalReceived,130);
  } finally { delete globalThis.invoicePrintFixture; await rm(dir,{recursive:true,force:true}); }
});
