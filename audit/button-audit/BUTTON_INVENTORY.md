# Button and Interactive Control Inventory

This inventory documents all buttons and interactive trigger controls discovered and audited across the Jewellery OS retail suite. Each control has been catalogued with its stable identifier, module/screen, label, source location, expected behavior, actual handler, and verification status.

## Status Legend
- **VERIFIED WORKING**: Button tested end-to-end with active handler, correct feedback, and state update.
- **VERIFIED FIXED**: Identified bug, dead handler, missing accessibility, or security vulnerability resolved and re-verified.
- **INTENTIONAL DISABLED / SAFE MOCK**: Control reflects enterprise policy, plan gating, or intentional offline simulation without breaking UI state.

---

| ID | Module / Screen | Control Label / Accessible Name | Source File and Line | Expected Action | Actual Handler / Action | Test Status |
|----|-----------------|---------------------------------|----------------------|-----------------|-------------------------|-------------|
| **APP-001** | Header Bar | Toggle Navigation Menu | `src/components/layout/AppShell.jsx:181` | Open/close mobile drawer navigation | `setMobileMenuOpen(!mobileMenuOpen)` | VERIFIED WORKING |
| **APP-002** | Header Bar | Expand / Collapse Sidebar | `src/components/layout/AppShell.jsx:189` | Toggle desktop sidebar width (64px / 260px) | `setSidebarCollapsed(!sidebarCollapsed)` | VERIFIED FIXED |
| **APP-003** | Header Bar | Switch Firm Selector | `src/components/layout/AppShell.jsx:218` | Open dropdown to toggle multi-firm context | `setFirmDropdownOpen(!firmDropdownOpen)` | VERIFIED FIXED |
| **APP-004** | Header Bar | Select Firm Row | `src/components/layout/AppShell.jsx:236` | Switch active enterprise firm and reload state | `setActiveFirmId(f.id)` | VERIFIED WORKING |
| **APP-005** | Header Bar | Manage Firm Settings Link | `src/components/layout/AppShell.jsx:256` | Navigate to Firm Master configuration | `setActiveModule('firm_master')` | VERIFIED WORKING |
| **APP-006** | Header Bar | NEW BILL (F2) Action | `src/components/layout/AppShell.jsx:290` | Open POS Billing counter | `setActiveModule('billing')` | VERIFIED FIXED |
| **APP-007** | Header Bar | Gold Calculator Button | `src/components/layout/AppShell.jsx:298` | Open safe arithmetic floating calculator | `onOpenCalculator()` | VERIFIED FIXED |
| **APP-008** | Rates Ticker | All Rates & LED Ticker Toggle | `src/components/layout/AppShell.jsx:134` | Expand 9-metal rates ticker & MCX board | `setRatesExpanded(!ratesExpanded)` | VERIFIED WORKING |
| **APP-009** | Rates Ticker | Open Rates Management & LED Board | `src/components/layout/AppShell.jsx:167` | Jump to Daily Rates Master module | `setActiveModule('daily_rates')` | VERIFIED WORKING |
| **APP-010** | Mobile Drawer | Close Mobile Menu Drawer | `src/components/layout/AppShell.jsx:335` | Close slide-out mobile navigation | `setMobileMenuOpen(false)` | VERIFIED WORKING |
| **APP-011** | Mobile Drawer | Navigation Module Link Items | `src/components/layout/AppShell.jsx:355` | Navigate to chosen module | `setActiveModule(item.id)` | VERIFIED WORKING |
| **APP-012** | Left Sidebar | Primary Module Nav Buttons (15 items) | `src/components/layout/AppShell.jsx:435` | Switch active workspace module | `setActiveModule(item.id)` | VERIFIED WORKING |
| **APP-013** | Left Sidebar | Collapse Toggle Floating Button | `src/components/layout/AppShell.jsx:477` | Expand/collapse sidebar rail | `setSidebarCollapsed(!sidebarCollapsed)` | VERIFIED WORKING |
| **SIDE-001**| Right Sidebar | Quick Book Shortcuts (7 buttons) | `src/components/layout/RightSidebar.jsx:68` | Jump to Day Book, Books, Ledger, Trial B/L, P/L, Logs | `setActiveModule(item.id)` | VERIFIED WORKING |
| **SIDE-002**| Right Sidebar | Floating Calculator Trigger | `src/components/layout/RightSidebar.jsx:87` | Open compact right calculator drawer | `setShowQuickCalc(!showQuickCalc)` | VERIFIED WORKING |
| **SIDE-003**| Right Sidebar | Calculator Keypad Buttons (16 keys) | `src/components/layout/RightSidebar.jsx:125` | Perform safe arithmetic parsing | `safeEvaluateMath` evaluator | VERIFIED FIXED |
| **SIDE-004**| Right Sidebar | Scroll to Top Button | `src/components/layout/RightSidebar.jsx:136` | Smoothly scroll window to top | `scrollToTop()` | VERIFIED WORKING |
| **CALC-001**| Modal | Close Calculator Modal | `src/components/common/CalculatorModal.jsx:65` | Dismiss calculator modal | `onClose()` | VERIFIED WORKING |
| **CALC-002**| Modal | Calculator Grid Keys (16 keys) | `src/components/common/CalculatorModal.jsx:92` | Evaluate expressions safely without eval | `safeEvaluateMath` parser | VERIFIED FIXED |
| **BILL-001**| Billing POS | Load Audit Sample (IS86) | `src/components/modules/BillingModule.jsx:455` | Populate sample cart with test ornaments | `handleLoadDemoDraft()` | VERIFIED FIXED |
| **BILL-002**| Billing POS | Clear / New Empty Bill | `src/components/modules/BillingModule.jsx:464` | Reset cart, customer selection, and payments | `handleClearTransaction()` | VERIFIED FIXED |
| **BILL-003**| Billing POS | Estimate / Quote Action | `src/components/modules/BillingModule.jsx:473` | Generate estimate quotation modal | `setPreviewEstimate(...)` | VERIFIED FIXED |
| **BILL-004**| Billing POS | Submit & Print Invoice (Header) | `src/components/modules/BillingModule.jsx:490` | Finalize invoice, deduct stock, open print preview | `handleSubmitInvoice(true)` | VERIFIED FIXED |
| **BILL-005**| Billing POS | + New Customer Modal Trigger | `src/components/modules/BillingModule.jsx:510` | Open quick add customer dialog | `setShowAddCustomerModal(true)` | VERIFIED WORKING |
| **BILL-006**| Billing POS | Add Item via Barcode Form Button | `src/components/modules/BillingModule.jsx:557` | Add item into cart by barcode or code | `handleBarcodeScan(e)` | VERIFIED WORKING |
| **BILL-007**| Billing POS | Quick Add from Inventory Buttons | `src/components/modules/BillingModule.jsx:567` | Directly add item into cart without delay | `handleBarcodeScan(null, s.barcode)` | VERIFIED FIXED |
| **BILL-008**| Billing POS | Toggle All 27-Column Calculation Fields | `src/components/modules/BillingModule.jsx:610` | Expand full jewellery audit columns | `setShowAllDetails(!showAllDetails)` | VERIFIED WORKING |
| **BILL-009**| Billing POS | Inspect Item Breakdown (Row Action) | `src/components/modules/BillingModule.jsx:702` | Expand inline pricing drawer | `setExpandedItemIds(...)` | VERIFIED WORKING |
| **BILL-010**| Billing POS | Remove Item from Cart (Row Action) | `src/components/modules/BillingModule.jsx:710` | Delete item from billing cart | `handleRemoveCartItem(item.id)` | VERIFIED WORKING |
| **BILL-011**| Billing POS | Old Gold Rate Cut Toggle | `src/components/modules/BillingModule.jsx:851` | Select Rate Cut valuation mode | `setOldGoldData(rateCutMode)` | VERIFIED WORKING |
| **BILL-012**| Billing POS | Old Gold No Rate Cut Toggle | `src/components/modules/BillingModule.jsx:860` | Select No Rate Cut valuation mode | `setOldGoldData(rateCutMode)` | VERIFIED WORKING |
| **BILL-013**| Billing POS | SUBMIT & PRINT TAX INVOICE (Bottom) | `src/components/modules/BillingModule.jsx:1062` | Finalize invoice and trigger print modal | `handleSubmitInvoice(true)` | VERIFIED FIXED |
| **BILL-014**| Billing POS | Save Without Printing (Bottom) | `src/components/modules/BillingModule.jsx:1071` | Save invoice and update customer balance | `handleSubmitInvoice(false)` | VERIFIED FIXED |
| **BILL-015**| Billing POS | Close New Customer Modal | `src/components/modules/BillingModule.jsx:1088` | Dismiss customer dialog | `setShowAddCustomerModal(false)` | VERIFIED FIXED |
| **BILL-016**| Billing POS | Cancel Customer Form Button | `src/components/modules/BillingModule.jsx:1166` | Cancel and reset new customer form | `setShowAddCustomerModal(false)` | VERIFIED WORKING |
| **BILL-017**| Billing POS | Save & Select Customer Submit Button | `src/components/modules/BillingModule.jsx:1173` | Save customer and auto-select in POS | `handleAddCustomerSubmit()` | VERIFIED WORKING |
| **STK-001** | Inventory | Retail Stock Mode Tab | `src/components/modules/StockModule.jsx:278` | Filter by retail items | `setStockMode('RETAIL STOCK')` | VERIFIED WORKING |
| **STK-002** | Inventory | Raw Bullion Stock Mode Tab | `src/components/modules/StockModule.jsx:286` | Filter by raw gold/silver bullion | `setStockMode('RAW BULLION')` | VERIFIED WORKING |
| **STK-003** | Inventory | Export Stock CSV Button | `src/components/modules/StockModule.jsx:296` | Download formula-sanitized inventory CSV | `handleExportCsv()` | VERIFIED FIXED |
| **STK-004** | Inventory | + New Item Action Button | `src/components/modules/StockModule.jsx:309` | Toggle new ornament entry form | `setShowAddForm(!showAddForm)` | VERIFIED WORKING |
| **STK-005** | Inventory | All Inventory Status Filter Tab | `src/components/modules/StockModule.jsx:368` | Show all stock items | `setStatusFilter('All')` | VERIFIED WORKING |
| **STK-006** | Inventory | In Stock Filter Tab | `src/components/modules/StockModule.jsx:376` | Show only unsold inventory | `setStatusFilter('In Stock')` | VERIFIED WORKING |
| **STK-007** | Inventory | View Item Details (Row Action) | `src/components/modules/StockModule.jsx:451` | Open item specification modal | `setInspectItem(item)` | VERIFIED FIXED |
| **STK-008** | Inventory | Print Tag (Row Action) | `src/components/modules/StockModule.jsx:460` | Jump to tag generator module | `setActiveModule('tags')` | VERIFIED FIXED |
| **STK-009** | Inventory | Delete Item (Row Action) | `src/components/modules/StockModule.jsx:470` | Trigger delete confirmation modal | `setItemToDelete(item)` | VERIFIED FIXED |
| **STK-010** | Inventory | Cancel Add Item Form Button | `src/components/modules/StockModule.jsx:777` | Close add ornament form | `setShowAddForm(false)` | VERIFIED WORKING |
| **STK-011** | Inventory | Save & Generate Barcode Submit Button | `src/components/modules/StockModule.jsx:784` | Validate and insert item into catalog | `handleAddItem(e)` | VERIFIED WORKING |
| **STK-012** | Inventory | Cancel Delete Item Modal Button | `src/components/modules/StockModule.jsx:817` | Abort deletion | `setItemToDelete(null)` | VERIFIED WORKING |
| **STK-013** | Inventory | Confirm Delete Item Modal Button | `src/components/modules/StockModule.jsx:823` | Delete item from inventory catalog | `handleConfirmDelete()` | VERIFIED WORKING |
| **STK-014** | Inventory | Close Inspect Modal (X Icon) | `src/components/modules/StockModule.jsx:848` | Dismiss inspection dialog | `setInspectItem(null)` | VERIFIED FIXED |
| **STK-015** | Inventory | Print Tag from Modal Action | `src/components/modules/StockModule.jsx:879` | Redirect to tag generator | `setActiveModule('tags')` | VERIFIED WORKING |
| **RATE-001**| Daily Rates | MCX Spot Auto-Sync Button | `src/components/modules/DailyRatesModule.jsx:130` | Sync rates from MCX commodity ticker | `handleSyncMcx()` | VERIFIED WORKING |
| **RATE-002**| Daily Rates | Reset Default Board Rates | `src/components/modules/DailyRatesModule.jsx:139` | Restore certified standard bullion prices | `resetDefaultRates()` | VERIFIED WORKING |
| **RATE-003**| Daily Rates | Save & Broadcast Rates Button | `src/components/modules/DailyRatesModule.jsx:153` | Save rates and trigger notification | Rate save notification | VERIFIED WORKING |
| **RATE-004**| Daily Rates | Master Module Sub-Tabs (9 tabs) | `src/components/modules/DailyRatesModule.jsx:194` | Switch rate tables (Metal, Purity, ROI, etc.) | `setActiveTab(tab)` | VERIFIED WORKING |
| **RATE-005**| Daily Rates | Copy Rates to Clipboard | `src/components/modules/DailyRatesModule.jsx:216` | Copy rates table to system clipboard | `navigator.clipboard.writeText(...)` | VERIFIED FIXED |
| **RATE-006**| Daily Rates | Export Rates CSV | `src/components/modules/DailyRatesModule.jsx:226` | Download daily rates CSV | Clean CSV export trigger | VERIFIED FIXED |
| **RATE-007**| Daily Rates | Export Rates Excel | `src/components/modules/DailyRatesModule.jsx:248` | Download daily rates Excel file | Clean Excel export trigger | VERIFIED FIXED |
| **RATE-008**| Daily Rates | Export Rates PDF | `src/components/modules/DailyRatesModule.jsx:270` | Trigger print dialog for PDF saving | `window.print()` | VERIFIED FIXED |
| **RATE-009**| Daily Rates | Print Rates Master Table | `src/components/modules/DailyRatesModule.jsx:277` | Print clean rates sheet | `window.print()` | VERIFIED FIXED |
| **RATE-010**| Daily Rates | Delete All Rates Trigger (Pink) | `src/components/modules/DailyRatesModule.jsx:286` | Open modal to prevent accidental purge | `setShowDeleteModal(true)` | VERIFIED FIXED |
| **RATE-011**| Daily Rates | Cancel Delete All Rates Modal | `src/components/modules/DailyRatesModule.jsx:301` | Abort purge | `setShowDeleteModal(false)` | VERIFIED WORKING |
| **RATE-012**| Daily Rates | Confirm Purge All Rates Modal | `src/components/modules/DailyRatesModule.jsx:307` | Clear rates list safely | `handleDeleteAllConfirm()` | VERIFIED WORKING |
| **RATE-013**| Daily Rates | Save New Metal Rate Row Submit | `src/components/modules/DailyRatesModule.jsx:334` | Add custom karat or purity row | `handleAddRate(e)` | VERIFIED WORKING |
| **ACC-001** | Accounts & Reports | Print Accounts Report | `src/components/modules/AccountsReportsModule.jsx:91` | Print statutory ledger / report | `window.print()` | VERIFIED WORKING |
| **ACC-002** | Accounts & Reports | Financial Report Navigation Tabs (5 tabs)| `src/components/modules/AccountsReportsModule.jsx:104` | Switch between P&L, Trial B/L, B/L Sheet, GST, Stock | `setActiveReportTab(tab)` | VERIFIED WORKING |
| **ACC-003** | Accounts & Reports | Export Govt JSON/Excel (GSTR-1) | `src/components/modules/AccountsReportsModule.jsx:396` | Download statutory GSTR-1 payload | `handleExportGstr1()` | VERIFIED FIXED |
| **CUST-001**| Customers | Register New Customer Party Action | `src/components/modules/CustomerModule.jsx:186` | Open customer registration modal | `setShowAddModal(true)` | VERIFIED WORKING |
| **CUST-002**| Customers | Master Directory Tabs (4 tabs) | `src/components/modules/CustomerModule.jsx:198` | Switch Customer / Karigar / Supplier / Broker | `setActiveDirectoryTab(tab)` | VERIFIED WORKING |
| **CUST-003**| Customers | Close Add Customer Modal (X Icon) | `src/components/modules/CustomerModule.jsx:388` | Dismiss party dialog | `setShowAddModal(false)` | VERIFIED FIXED |
| **CUST-004**| Customers | Cancel Party Registration Button | `src/components/modules/CustomerModule.jsx:625` | Abort party entry | `setShowAddModal(false)` | VERIFIED WORKING |
| **CUST-005**| Customers | Save Customer Party Submit Button | `src/components/modules/CustomerModule.jsx:632` | Insert party into directory | `handleAddSubmit(e)` | VERIFIED WORKING |
| **UDH-001** | Udhaar / Loans | Book Girvi / Gold Pledge Loan Action | `src/components/modules/UdhaarLoanModule.jsx:118` | Open Girvi loan booking modal | `setShowGirviModal(true)` | VERIFIED WORKING |
| **UDH-002** | Udhaar / Loans | Filter Status Tabs (All, Active, Closed) | `src/components/modules/UdhaarLoanModule.jsx:131` | Filter loans by status | `setStatusFilter(tab)` | VERIFIED WORKING |
| **UDH-003** | Udhaar / Loans | Receive Repayment (Row Action) | `src/components/modules/UdhaarLoanModule.jsx:262` | Open repayment deposit dialog | `setSelectedUdhaarForDeposit(u)` | VERIFIED WORKING |
| **UDH-004** | Udhaar / Loans | Close Repayment Modal (X Icon) | `src/components/modules/UdhaarLoanModule.jsx:291` | Dismiss deposit modal | `setShowDepositModal(false)` | VERIFIED FIXED |
| **UDH-005** | Udhaar / Loans | Cancel Deposit Modal Button | `src/components/modules/UdhaarLoanModule.jsx:330` | Abort deposit entry | `setShowDepositModal(false)` | VERIFIED WORKING |
| **UDH-006** | Udhaar / Loans | Record Deposit Submit Button | `src/components/modules/UdhaarLoanModule.jsx:337` | Process loan repayment credit | `handleDepositSubmit(e)` | VERIFIED WORKING |
| **UDH-007** | Udhaar / Loans | Close Girvi Modal (X Icon) | `src/components/modules/UdhaarLoanModule.jsx:361` | Dismiss Girvi booking modal | `setShowGirviModal(false)` | VERIFIED FIXED |
| **UDH-008** | Udhaar / Loans | Cancel Girvi Modal Button | `src/components/modules/UdhaarLoanModule.jsx:436` | Abort loan booking | `setShowGirviModal(false)` | VERIFIED WORKING |
| **UDH-009** | Udhaar / Loans | Disburse Girvi Loan Submit Button | `src/components/modules/UdhaarLoanModule.jsx:443` | Validate and disburse gold loan | `handleGirviSubmit(e)` | VERIFIED WORKING |
| **KAR-001** | Karigar / Goldsmith | Issue Raw Bullion Action Button | `src/components/modules/KarigarModule.jsx:109` | Open metal issue dialog | `setShowIssueModal(true)` | VERIFIED WORKING |
| **KAR-002** | Karigar / Goldsmith | Receive Finished Ornament Action Button | `src/components/modules/KarigarModule.jsx:119` | Open ornament receive dialog | `setShowReceiveModal(true)` | VERIFIED WORKING |
| **KAR-003** | Karigar / Goldsmith | All Karigars Filter Tab | `src/components/modules/KarigarModule.jsx:134` | Show all goldsmiths | `setSelectedKarigarId(null)` | VERIFIED WORKING |
| **KAR-004** | Karigar / Goldsmith | Select Karigar Filter Tabs | `src/components/modules/KarigarModule.jsx:142` | Filter ledger by specific karigar | `setSelectedKarigarId(k.id)` | VERIFIED WORKING |
| **KAR-005** | Karigar / Goldsmith | Issue Metal from Row Action | `src/components/modules/KarigarModule.jsx:197` | Select karigar and open issue dialog | `setShowIssueModal(true)` | VERIFIED WORKING |
| **KAR-006** | Karigar / Goldsmith | Receive Metal from Row Action | `src/components/modules/KarigarModule.jsx:206` | Select karigar and open receive dialog | `setShowReceiveModal(true)` | VERIFIED WORKING |
| **KAR-007** | Karigar / Goldsmith | Close Issue Modal (X Icon) | `src/components/modules/KarigarModule.jsx:272` | Dismiss issue modal | `setShowIssueModal(false)` | VERIFIED FIXED |
| **KAR-008** | Karigar / Goldsmith | Cancel Issue Modal Button | `src/components/modules/KarigarModule.jsx:332` | Abort metal issue | `setShowIssueModal(false)` | VERIFIED WORKING |
| **KAR-009** | Karigar / Goldsmith | Confirm Issue Metal Submit Button | `src/components/modules/KarigarModule.jsx:339` | Issue pure metal to karigar ledger | `handleIssueSubmit(e)` | VERIFIED WORKING |
| **KAR-010** | Karigar / Goldsmith | Close Receive Modal (X Icon) | `src/components/modules/KarigarModule.jsx:362` | Dismiss receive modal | `setShowReceiveModal(false)` | VERIFIED FIXED |
| **KAR-011** | Karigar / Goldsmith | Cancel Receive Modal Button | `src/components/modules/KarigarModule.jsx:431` | Abort ornament receipt | `setShowReceiveModal(false)` | VERIFIED WORKING |
| **KAR-012** | Karigar / Goldsmith | Receive Ornament & Credit Labour Submit | `src/components/modules/KarigarModule.jsx:438` | Record ornament and calculate wastage | `handleReceiveSubmit(e)` | VERIFIED WORKING |
| **SCH-001** | Bishi Schemes | Enroll New Customer Action Button | `src/components/modules/SchemeModule.jsx:115` | Open plan enrollment modal | `setShowEnrollModal(true)` | VERIFIED WORKING |
| **SCH-002** | Bishi Schemes | Scheme Filter Tabs | `src/components/modules/SchemeModule.jsx:125` | Filter plans (11+1 Dhanvarsha, etc.) | `setSelectedSchemeId(s.id)` | VERIFIED WORKING |
| **SCH-003** | Bishi Schemes | Pay Installment (Row Action) | `src/components/modules/SchemeModule.jsx:201` | Open installment payment dialog | `setShowInstallmentModal(true)` | VERIFIED WORKING |
| **SCH-004** | Bishi Schemes | Close Enrollment Modal (X Icon) | `src/components/modules/SchemeModule.jsx:234` | Dismiss enrollment modal | `setShowEnrollModal(false)` | VERIFIED FIXED |
| **SCH-005** | Bishi Schemes | Cancel Enrollment Button | `src/components/modules/SchemeModule.jsx:280` | Abort scheme enrollment | `setShowEnrollModal(false)` | VERIFIED WORKING |
| **SCH-006** | Bishi Schemes | Confirm Customer Enrollment Submit | `src/components/modules/SchemeModule.jsx:287` | Issue customer passbook account | `handleEnrollSubmit(e)` | VERIFIED WORKING |
| **SCH-007** | Bishi Schemes | Close Installment Modal (X Icon) | `src/components/modules/SchemeModule.jsx:309` | Dismiss installment modal | `setShowInstallmentModal(false)` | VERIFIED FIXED |
| **SCH-008** | Bishi Schemes | Cancel Installment Modal Button | `src/components/modules/SchemeModule.jsx:345` | Abort installment entry | `setShowInstallmentModal(false)` | VERIFIED WORKING |
| **SCH-009** | Bishi Schemes | Record Installment Payment Submit | `src/components/modules/SchemeModule.jsx:352` | Credit month deposit to passbook | `handleInstallmentSubmit(e)` | VERIFIED WORKING |
| **FIRM-001**| Firm Master | Help Button | `src/components/modules/FirmMasterModule.jsx:70` | Open Firm Master compliance guide | `setShowHelp(true)` | VERIFIED FIXED |
| **FIRM-002**| Firm Master | SAVE / UPDATE FIRM Button | `src/components/modules/FirmMasterModule.jsx:76` | Persist business details across invoices | `handleSave(e)` | VERIFIED FIXED |
| **FIRM-003**| Firm Master | Switch Firm Selector Tabs | `src/components/modules/FirmMasterModule.jsx:108` | Switch active enterprise firm form | `handleSelectFirm(f.id)` | VERIFIED WORKING |
| **FIRM-004**| Firm Master | Make Active / Active Row Button | `src/components/modules/FirmMasterModule.jsx:434` | Activate primary operating firm | `setActiveFirmId(f.id)` | VERIFIED FIXED |
| **TAG-001** | Tag Generator | Print Tag Labels Header Button | `src/components/modules/TagGeneratorModule.jsx:35` | Send formatted jewellery tags to printer | `window.print()` | VERIFIED WORKING |
| **TAG-002** | Tag Generator | Dumbbell (Tail) Format Selector | `src/components/modules/TagGeneratorModule.jsx:69` | Select 45x12mm rat-tail thermal layout | `setTagFormat('Dumbbell')` | VERIFIED WORKING |
| **TAG-003** | Tag Generator | Butterfly Tag Format Selector | `src/components/modules/TagGeneratorModule.jsx:77` | Select dual butterfly label layout | `setTagFormat('Butterfly')` | VERIFIED WORKING |
| **ECOM-001**| Showroom Catalog| MORE DETAILS (Card Action) | `src/components/modules/ECommerceModule.jsx:101` | Open full specification modal | `setSelectedItemDetails(item)` | VERIFIED FIXED |
| **ECOM-002**| Showroom Catalog| Bill This Item Quick POS Action | `src/components/modules/ECommerceModule.jsx:107` | Route item directly into POS billing | `setActiveModule('billing')` | VERIFIED FIXED |
| **ECOM-003**| Showroom Catalog| Close Details Modal (X Icon) | `src/components/modules/ECommerceModule.jsx:130` | Dismiss specification modal | `setSelectedItemDetails(null)` | VERIFIED FIXED |
| **ECOM-004**| Showroom Catalog| Generate Estimate from Catalog | `src/components/modules/ECommerceModule.jsx:177` | Open quotation modal for customer | `setPreviewEstimate(...)` | VERIFIED FIXED |
| **ECOM-005**| Showroom Catalog| BUY NOW / BILL THIS ITEM | `src/components/modules/ECommerceModule.jsx:193` | Route item into POS and focus checkout | `setActiveModule('billing')` | VERIFIED FIXED |
| **INV-M-001**| Invoice Modal | A4 Tax Invoice Format Selector | `src/components/modules/InvoiceViewModal.jsx:58` | Render standard GST tax invoice layout | `setPrintFormat('A4')` | VERIFIED FIXED |
| **INV-M-002**| Invoice Modal | A5 Half-Page Format Selector | `src/components/modules/InvoiceViewModal.jsx:64` | Render compact dot-matrix/laser format | `setPrintFormat('A5')` | VERIFIED FIXED |
| **INV-M-003**| Invoice Modal | 3-Inch POS Thermal Selector | `src/components/modules/InvoiceViewModal.jsx:70` | Render POS roll format | `setPrintFormat('Thermal')` | VERIFIED FIXED |
| **INV-M-004**| Invoice Modal | WhatsApp Customer Share Button | `src/components/modules/InvoiceViewModal.jsx:78` | Open prefilled WhatsApp invoice summary | `handleWhatsAppShare()` | VERIFIED FIXED |
| **INV-M-005**| Invoice Modal | Print Now Button | `src/components/modules/InvoiceViewModal.jsx:86` | Open browser native print dialog | `handlePrint()` | VERIFIED FIXED |
| **INV-M-006**| Invoice Modal | Close Invoice Modal (X Icon) | `src/components/modules/InvoiceViewModal.jsx:94` | Dismiss invoice print view | `setPreviewInvoice(null)` | VERIFIED FIXED |
| **EST-001** | Estimate Modal | Close Estimate Modal (X Icon) | `src/components/modules/EstimateModal.jsx:27` | Dismiss estimate preview | `setPreviewEstimate(null)` | VERIFIED FIXED |
| **EST-002** | Estimate Modal | Close Button (Footer) | `src/components/modules/EstimateModal.jsx:78` | Dismiss estimate preview | `setPreviewEstimate(null)` | VERIFIED FIXED |
| **EST-003** | Estimate Modal | Print Quotation Button | `src/components/modules/EstimateModal.jsx:84` | Print formal quotation sheet | `window.print()` | VERIFIED FIXED |
| **BKP-001** | Backup / Restore| Download Complete JSON Backup | `src/components/modules/BackupRestoreModule.jsx:63` | Download timestamped state JSON backup | `handleDownloadBackup()` | VERIFIED WORKING |
| **BKP-002** | Backup / Restore| Trigger File Upload Input Button | `src/components/modules/BackupRestoreModule.jsx:92` | Open system file picker for JSON restore | `fileInputRef.current?.click()` | VERIFIED WORKING |
| **BKP-003** | Backup / Restore| Reset to Demo State Button | `src/components/modules/BackupRestoreModule.jsx:114` | Reset store to certified baseline data | `handleResetConfirm()` | VERIFIED WORKING |
| **DIARY-001**| Daily Diary | Record Day Book Cash Transaction | `src/components/modules/DailyDiaryModule.jsx:81` | Record petty cash in/out entry | `handleAddEntry(e)` | VERIFIED WORKING |
| **SMS-001** | SMS & WhatsApp | Send Bulk SMS Campaign | `src/components/modules/SmsWhatsappModule.jsx:84` | Simulate campaign broadcast | Feedback banner rendered | INTENTIONAL DISABLED / SAFE MOCK |
| **SMS-002** | SMS & WhatsApp | Send Test SMS Button | `src/components/modules/SmsWhatsappModule.jsx:135` | Simulate single SMS test | Feedback banner rendered | INTENTIONAL DISABLED / SAFE MOCK |
| **SMS-003** | SMS & WhatsApp | Send Test WhatsApp Button | `src/components/modules/SmsWhatsappModule.jsx:146` | Simulate single WhatsApp test | Feedback banner rendered | INTENTIONAL DISABLED / SAFE MOCK |
