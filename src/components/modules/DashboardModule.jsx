import React from 'react';
import { invoiceSettlement } from '../../utils/invoices';
import { useJewellery } from '../../context/JewelleryContext';
import { formatCurrency, formatWeight } from '../../utils/numberToWords';
import {
  ArrowRight,
  Banknote,
  CircleAlert,
  CreditCard,
  Gem,
  Package,
  Receipt,
  Scale,
  TrendingUp,
  Users
} from 'lucide-react';

function MetricCard({ label, value, note, icon: Icon, tone = '' }) {
  return (
    <article className={`jos-metric-card ${tone}`}>
      <span className="jos-metric-icon"><Icon size={20} /></span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

function paymentSummary(payments = {}) {
  const labels = [
    ['cash', 'Cash'],
    ['cheque', 'Bank'],
    ['card', 'Card'],
    ['online', 'UPI'],
    ['loyaltyRedeemed', 'Loyalty']
  ];
  const active = labels.filter(([key]) => Number(payments[key]) > 0).map(([, label]) => label);
  return active.length ? active.join(' + ') : 'No settlement recorded';
}

export default function DashboardModule() {
  const {
    activeFirm,
    analytics,
    invoices,
    udhaarRepayments,
    stock,
    customers,
    udhaarList,
    dailyRates,
    setActiveModule,
    setPreviewInvoice
  } = useJewellery();

  const firmInvoices = invoices.filter(invoice =>
    !invoice.firmId || invoice.firmId === activeFirm.id || invoice.firmCode === activeFirm.code
  );
  const periodSales = firmInvoices.reduce((sum, invoice) => sum + Number(invoice.totalInvoiceAmount || 0), 0);
  const activeDueAccounts = udhaarList.filter(item =>
    item.status === 'Active' && (!item.firmCode || item.firmCode === activeFirm.code)
  );
  const lowStock = stock.filter(item => item.status === 'In Stock' && Number(item.qty || 1) <= Number(item.reorderLevel || 2));
  const currentGoldRate = dailyRates.find(rate => rate.karat?.includes('24K'))?.ratePerGram || 0;

  const attentions = [
    {
      label: `${activeDueAccounts.length} receivable accounts need review`,
      detail: formatCurrency(analytics.totalUdhaarOutstanding),
      module: 'udhaar',
      icon: CreditCard
    },
    {
      label: `${lowStock.length} stock lines are at reorder level`,
      detail: 'Review inventory thresholds',
      module: 'stock',
      icon: Package
    },
    {
      label: 'Rate master uses local demo values',
      detail: currentGoldRate ? `24K stored at ₹${currentGoldRate.toLocaleString('en-IN')}/g` : 'No rate available',
      module: 'daily_rates',
      icon: TrendingUp
    }
  ];

  return (
    <div className="jos-dashboard">
      <section className="jos-page-heading">
        <div>
          <span>Overview · Financial year 2024–25</span>
          <h1>{activeFirm.name}</h1>
          <p>Store operations snapshot from locally stored demonstration records.</p>
        </div>
        <button type="button" className="jos-primary-button" onClick={() => setActiveModule('billing')}>
          <Receipt size={18} /> New Bill <kbd>F2</kbd>
        </button>
      </section>

      <section className="jos-metric-grid" aria-label="Business overview">
        <MetricCard
          icon={TrendingUp}
          label="Sales in selected dataset"
          value={formatCurrency(periodSales)}
          note={`${firmInvoices.length} invoices · historical demo data`}
        />
        <MetricCard
          icon={Banknote}
          label="Cash in counter"
          value={formatCurrency(activeFirm.cashBalance)}
          note="Physical drawer balance"
        />
        <MetricCard
          icon={CreditCard}
          label="Outstanding receivables"
          value={formatCurrency(analytics.totalUdhaarOutstanding)}
          note={`${activeDueAccounts.length} active accounts`}
          tone="warning"
        />
        <MetricCard
          icon={Gem}
          label="Inventory valuation"
          value={formatCurrency(analytics.totalStockValue)}
          note="Stored item values · not a live valuation"
        />
      </section>

      <section className="jos-dashboard-grid">
        <article className="jos-card jos-invoices-card">
          <div className="jos-card-heading">
            <div>
              <span>Transactions</span>
              <h2>Recent invoices</h2>
            </div>
            <button type="button" onClick={() => setActiveModule('billing')}>Create bill <ArrowRight size={16} /></button>
          </div>
          <div className="jos-table-wrap">
            <table className="jos-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Settlement</th>
                  <th className="numeric">Amount</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {firmInvoices.slice(0, 6).map(invoice => (
                  <tr key={invoice.id}>
                    <td><strong className="nowrap">{invoice.invoiceNo}</strong></td>
                    <td>{new Date(invoice.date).toLocaleDateString('en-IN')}</td>
                    <td>{invoice.customerName}</td>
                    <td>
                      <span className={invoiceSettlement(invoice, udhaarRepayments).outstanding > 0 ? 'jos-badge warning' : 'jos-badge success'}>
                        {invoiceSettlement(invoice, udhaarRepayments).outstanding > 0 ? 'Part paid' : 'Settled'}
                      </span>
                      <small className="jos-payment-copy">{paymentSummary(invoice.payments)}</small>
                    </td>
                    <td className="numeric">{formatCurrency(invoice.totalInvoiceAmount)}</td>
                    <td>
                      <button
                        type="button"
                        className="jos-row-action"
                        onClick={() => setPreviewInvoice(invoice)}
                        aria-label={`View invoice ${invoice.invoiceNo}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="jos-attention-card">
          <div>
            <span>Operations</span>
            <h2>Needs attention</h2>
            <p>Actionable items derived from the current local dataset.</p>
          </div>
          <div className="jos-attention-list">
            {attentions.map(item => {
              const Icon = item.icon;
              return (
                <button type="button" key={item.label} onClick={() => setActiveModule(item.module)}>
                  <span><Icon size={17} /></span>
                  <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                  <ArrowRight size={16} />
                </button>
              );
            })}
          </div>
        </aside>
      </section>

      <section className="jos-stock-summary">
        <div className="jos-card-heading">
          <div>
            <span>Inventory composition</span>
            <h2>Metal stock summary</h2>
          </div>
          <button type="button" onClick={() => setActiveModule('stock')}>Open inventory <ArrowRight size={16} /></button>
        </div>
        <div className="jos-stock-grid">
          <div>
            <span className="jos-stock-icon gold"><Gem size={22} /></span>
            <span><small>Gold gross weight</small><strong>{formatWeight(analytics.totalStockGoldGrams)}</strong></span>
            <span><small>Net weight</small><strong>{formatWeight(analytics.totalStockGoldNetGrams)}</strong></span>
          </div>
          <div>
            <span className="jos-stock-icon silver"><Scale size={22} /></span>
            <span><small>Silver gross weight</small><strong>{formatWeight(analytics.totalStockSilverGrams)}</strong></span>
            <span><small>Net weight</small><strong>{formatWeight(analytics.totalStockSilverNetGrams)}</strong></span>
          </div>
          <div>
            <span className="jos-stock-icon"><Package size={22} /></span>
            <span><small>Available stock lines</small><strong>{analytics.totalStockCount}</strong></span>
            <span><small>Customer records</small><strong>{customers.length}</strong></span>
          </div>
        </div>
      </section>
    </div>
  );
}
