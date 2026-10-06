# Blocked Checks and Out-of-Scope Integrations

This document clarifies external dependencies, third-party credentials, and intentional out-of-scope boundaries identified during the button and control audit.

---

## 1. External Third-Party Gateways (Intentional Safe Simulation)

In accordance with the audit operating rules (avoiding unapproved external SMS broadcasts, paid WhatsApp messaging, or live government portal mutations), the following controls are configured as **safe local simulations**:

### A. SMS & WhatsApp Bulk Messaging (`SmsWhatsappModule.jsx`)
- **Controls:**
  - `SMS-001`: "Send Bulk SMS Campaign"
  - `SMS-002`: "Send Test SMS"
  - `SMS-003`: "Send Test WhatsApp"
- **Status:** **Intentional Simulation / Out of Live Scope**
- **Rationale:** Connecting to production SMS aggregators (e.g., Fast2SMS, Twilio, Gupshup) or Meta WhatsApp Cloud API requires paid credentials, DLT template approval under TRAI regulations, and recipient phone whitelisting.
- **Handling in Jewellery OS:** The buttons display rich UI simulated progress notifications and validate template token parameters without sending real billable packets over external networks.

### B. NIC E-Invoicing / E-Way Bill Portal Sync (`FirmMasterModule.jsx`)
- **Controls:**
  - E-Invoice credentials configuration fields
- **Status:** **Offline Schema Verification / Mock Gateway**
- **Rationale:** Interacting with the live Government of India NIC IRP (Invoice Registration Portal) requires certified GSP (GST Suvidha Provider) keys, GSTIN credentials, and authorized production certificates.
- **Handling in Jewellery OS:** The statutory payload schema is validated locally and can be exported as GSTR-1 JSON via `AccountsReportsModule.jsx:handleExportGstr1`. Live HTTP calls to the government portal remain gated until production credentials are provided.

---

## 2. Hardware-Dependent Controls

### A. Hardware Thermal Barcode & Label Printers (`TagGeneratorModule.jsx`)
- **Controls:**
  - `TAG-001`: "PRINT TAG LABELS"
- **Status:** **Browser Print Emulation Verified**
- **Rationale:** Physical ESC/POS or TSPL/ZPL thermal barcode printers (e.g., TSC TE244, TVS LP 46, Citizen CL-S621) communicate via raw USB/Serial print drivers.
- **Handling in Jewellery OS:** The control formats 45mm x 12mm dual dumbbell and butterfly layouts accurately with QR codes and text elements, invoking `window.print()` using standard CSS `@media print` dimensions.

### B. Electronic Digital Weighing Scale RS-232 Port
- **Controls:** Automatic weight capture from physical serial scale
- **Status:** **Manual Input Supported / Serial API Optional**
- **Rationale:** Direct serial communication with physical retail scales (e.g., Essae, Aczet, Citizen) requires the Web Serial API with explicit user device permission.
- **Handling in Jewellery OS:** Inputs accept direct precision keyboard entry with auto-recalculation; serial listener integration is architected for optional kiosk mode.
