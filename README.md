# 💎 JEWELLERY OS — Next-Generation Jewellery ERP & POS System

**Jewellery OS** is a complete, custom-built ERP and Point of Sale (POS) application engineered for modern jewellery retailers, multi-branch stores, and SaaS enterprises.

---

## 🌟 Key Modules & Capabilities

1. **Live Bullion Ticker & Digital Rate Board (आज का भाव)**:
   - Real-time ticker for 24K, 22K (BIS 916), 20K, 18K (BIS 750), 16K, 14K (BIS 585) Gold & 99.9 Fine Silver / 92.5 Sterling Silver.
   - Live MCX Gold & Silver rates sync.
   - Fullscreen **LED Digital Rate Board** for in-store customer displays.

2. **Master Control Panel**:
   - Multi-Firm support (e.g. *Krishna Jewellers* and *Shubh Laxmi Ornaments* with plan management).
   - Firm GSTIN, PAN, Bank IFSC, UPI QR Code, Authorized Signatures, and E-Invoice API configurations.
   - Custom Invoice Header & Footer terms with automatic interest calculation rules.

3. **Stock & Inventory Engine (9 Dashboard Tiles)**:
   - 9-Tile interactive stock overview in Jewellery OS dashboard:
     - Gold-Silver Stock, Gold Stock, Silver Stock, Jewellery Panel, Wholesale Search, Sold Out Stock, Re-Order List, Retail Stock, Purchase Stock.
   - Fine Jewellery, Imitation Jewellery, Raw Metal Stock, and Stone Stock.
   - 16-field Opening Stock entry wizard with BIS HUID Hallmarking, Wastage %, and fine weight auto-calculation.
   - Excel / CSV stock export with column visibility filters.

4. **27-Column Deep Jewellery Calculation Engine (SELL / POS)**:
   - Barcode (e.g. `1201`), RFID, and Product Code fast scanner.
   - 27-Column deep calculation grid:
     - Gross Weight $\rightarrow$ Less Weight $\rightarrow$ Net Weight $\rightarrow$ Purity % $\rightarrow$ Wastage % $\rightarrow$ Fine Weight $\rightarrow$ Metal Rate $\rightarrow$ Making Charges (Per GM / Fixed / % / Disc) $\rightarrow$ Stone & Diamond Values $\rightarrow$ Hallmark Charge $\rightarrow$ CGST 1.5% + SGST 1.5% $\rightarrow$ Final Amount.
   - **Old Metal (Gold/Silver) Exchange (Jama)**:
     - Gross/Less/Net wt, Touch/Tunch %, fine gold calculation, scrap valuation, and "Rate Cut" vs "No Rate Cut" toggles.
   - **Multi-Mode Split Payment**:
     - Split single invoice across Cash, Cheque/Bank, Card, Online/UPI, Loyalty Points, and debiting balance to Customer Udhaar.

5. **GST Tax Invoice, Estimate & WhatsApp Receipt Hub**:
   - GST Tax Invoice with BIS Hallmark insignia, HSN 7113, Dynamic UPI QR Code, and Customer/Authorized signatures.
   - **Diwali & Festive Promotional Marketing Banner** printed in full-width on invoice footers.
   - Instant Quotation / Estimate generator for walk-in inquiries.
   - Direct 1-Click WhatsApp invoice message and receipt dispatch.

6. **Loans, Udhaar & Girvi Pawnbroking**:
   - Customer Udhaar Ledger with installment recording.
   - **Girvi / Gold Pledge Loan Booking**:
     - Loan against gold ornaments, gross/fine gold weight pledge tracking, monthly ROI interest calculator, and redemption vouchers.

7. **Daily Diary & Cash Counter (Day Book)**:
   - Complete day drawer reconciliation (Opening Cash, Inward Sales, Old Metal Jama, Udhaar Deposits, Shop Expenses, and Closing Cash in Drawer).

8. **Gold Savings Schemes & Monthly Chit Fund**:
   - 11+1 Bonus Month Gold Kitty schemes and Gold Weight Accumulation schemes with member passbooks.

9. **Karigar (Goldsmith) Job Work Ledger**:
   - Issue 24K pure bullion / alloy gold to goldsmiths, track loss/wastage allowance %, and receive finished ornaments.

10. **Jewellery Barcode & Thermal Tag Designer**:
    - Print dual-head dumbbell / butterfly jewellery tags with Barcode, SKU, Gross/Net wt, Purity, and HUID.

11. **Database Backup & Full Offline Control**:
    - Standalone local persistence with 1-click JSON backup export, import, and demo reset.

12. **Production SaaS Admin Panel & Client Module Manager**:
    - Complete multi-tenant platform command center to add clients, set subscription plans, and dynamically toggle individual module entitlements per client.
    - Multi-Firm & Branch logistics with transaction-safe deletion guards.
    - Staff Directory with 8-role RBAC permissions matrix and discount approval thresholds.
    - Jewellery Catalogue Masters (categories, HSN codes, default wastage %, metal purity standards, BIS Hallmark ₹45 fee).
    - Inter-branch inventory transfers and physical stock adjustments.
    - Connected Services Hub (Razorpay, PineLabs, Gupshup WhatsApp, MSG91 SMS, NIC E-Invoice, Thermal printers) with live health ping tests.
    - Immutable, chronological append-only security audit trail.

---

## 🚀 How to Launch Jewellery OS

### Quick Launch on Mac:
Run the start script directly from terminal:
```bash
./start.sh
```
Or start the web app manually:
```bash
cd jewellery-os
/usr/local/bin/node ./node_modules/vite/bin/vite.js preview --port 3000
```
Then open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `F2` | Open POS / New Billing Screen |
| `Esc` | Close any open modal / Print Preview / Estimate |
| `Top Header Calc` | Open floating Gold & Currency Calculator |
