import React from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import { formatCurrency } from '../../utils/numberToWords';

export default function AccountsReportsModule() {
  const { activeFirm, generalLedger } = useJewellery();
  const journals = generalLedger.filter(entry => entry.firmId === activeFirm.id);
  const total = entries => entries.reduce((sum, entry) => sum + Math.round(Number(entry.amount) * 100), 0);
  return <section className="space-y-4">
    <h2 className="text-xl font-bold">Demonstration journal diagnostics</h2>
    <p role="status" className="p-4 bg-amber-950 text-amber-200">
      Profit and loss, trial balance, balance sheet, stock valuation and GST filing reports are unavailable.
      Complete purchase costs, opening balances, account mappings and reconciled postings are required.
      No estimated costs or balancing capital figures are substituted.
    </p>
    <p>Generated from {journals.length} local journals for {activeFirm.name}. This checks arithmetic only;
      balanced entries do not prove complete or correct accounting.</p>
    <div className="overflow-x-auto"><table className="w-full text-left">
      <thead><tr><th>Reference</th><th>Debits</th><th>Credits</th><th>Arithmetic</th></tr></thead>
      <tbody>{journals.map(entry => {
        const debit = total(entry.debits);
        const credit = total(entry.credits);
        return <tr key={entry.id}><td>{entry.referenceId}</td><td>{formatCurrency(debit / 100)}</td>
          <td>{formatCurrency(credit / 100)}</td><td>{debit === credit ? 'Equal' : 'MISMATCH'}</td></tr>;
      })}</tbody>
    </table></div>
    {journals.length === 0 && <p>No journals recorded for this firm.</p>}
  </section>;
}
