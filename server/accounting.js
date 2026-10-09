export function calculateTrialBalance(entries) {
  const accounts = new Map();

  for (const entry of entries) {
    const accountCode = String(entry.accountCode || '');
    const debitPaise = Number(entry.debitPaise);
    const creditPaise = Number(entry.creditPaise);
    if (!accountCode || !Number.isSafeInteger(debitPaise) || !Number.isSafeInteger(creditPaise)
      || debitPaise < 0 || creditPaise < 0 || (debitPaise > 0) === (creditPaise > 0)) {
      throw new RangeError('Ledger entries must contain exact paise and exactly one positive side.');
    }
    const current = accounts.get(accountCode) || { accountCode, debitPaise: 0, creditPaise: 0 };
    current.debitPaise += debitPaise;
    current.creditPaise += creditPaise;
    if (!Number.isSafeInteger(current.debitPaise) || !Number.isSafeInteger(current.creditPaise)) {
      throw new RangeError('Trial balance exceeds the supported exact-money range.');
    }
    accounts.set(accountCode, current);
  }

  const items = [...accounts.values()].sort((left, right) => left.accountCode.localeCompare(right.accountCode));
  const totalDebitsPaise = items.reduce((total, item) => total + item.debitPaise, 0);
  const totalCreditsPaise = items.reduce((total, item) => total + item.creditPaise, 0);
  if (!Number.isSafeInteger(totalDebitsPaise) || !Number.isSafeInteger(totalCreditsPaise)) {
    throw new RangeError('Trial balance total exceeds the supported exact-money range.');
  }

  return {
    items: items.map(item => ({
      ...item,
      debitBalancePaise: Math.max(0, item.debitPaise - item.creditPaise),
      creditBalancePaise: Math.max(0, item.creditPaise - item.debitPaise),
    })),
    totalDebitsPaise,
    totalCreditsPaise,
    isBalanced: totalDebitsPaise === totalCreditsPaise,
  };
}
