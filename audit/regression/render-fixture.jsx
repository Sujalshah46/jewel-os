import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../../src/App';
import { JewelleryProvider, useJewellery } from '../../src/context/JewelleryContext';
import InvoiceViewModal from '../../src/components/modules/InvoiceViewModal';
import AccountsReportsModule from '../../src/components/modules/AccountsReportsModule';
import { createBackup, COLLECTIONS } from '../../src/utils/backup';
export function renderApp() { return renderToString(<App />); }
export function renderSeed() {
  let state;
  function Capture() {
    const context = useJewellery();
    state = Object.fromEntries([...COLLECTIONS, 'dailyDiary', 'catalogueSettings', 'activeFirmId', 'activeClientId', 'activeBranchId'].map(key => [key, context[key]]));
    return <AccountsReportsModule />;
  }
  const html = renderToString(<JewelleryProvider><Capture /></JewelleryProvider>);
  return { backup: createBackup(state), html };
}
