# Expense Tracking — Design Spec

## Overview

Add simple expense tracking to the existing invoice generator. Users can record business expenses, attach receipts, manage vendors, and see income vs expenses on the dashboard. No tax-specific features (GST/TDS/ITR) — just clean expense tracking.

## Data Models

### Vendor

Separate from Client (vendors are who you pay, clients pay you). Same CRUD pattern as Client.

```
Vendor
  id            String    @id @default(cuid())
  businessId    String    → Business
  name          String
  email         String?
  addressLines  String[]
  notes         String?
  archivedAt    DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([businessId, name])
  @@index([businessId, archivedAt])
```

### ExpenseCategory

Simple categories. Ships with defaults (SaaS, Rent, Travel, Contractors, Office, Meals, etc.). User can add custom ones.

```
ExpenseCategory
  id          String    @id @default(cuid())
  businessId  String    → Business
  name        String
  slug        String
  isSystem    Boolean   @default(false)
  isActive    Boolean   @default(true)
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())

  @@unique([businessId, slug])
  @@index([businessId, isActive])
```

### Expense

Core expense record. Amounts in integer cents (paise for INR), same as existing invoice money math.

```
Expense
  id              String    @id @default(cuid())
  businessId      String    → Business
  vendorId        String?   → Vendor
  categoryId      String    → ExpenseCategory
  createdByUserId String    → User

  description     String
  date            DateTime
  amount          Int       (cents/paise — integer math)
  currency        String    @default("INR")
  paymentMethod   String?   (UPI / Bank / Cash / Card)
  reference       String?   (UTR / cheque no / transaction ID)
  notes           String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([businessId, date])
  @@index([businessId, categoryId])
  @@index([businessId, vendorId])
```

### ExpenseAttachment

Multiple file uploads per expense. Stored in Supabase Storage "expenses" bucket, same pattern as logo upload.

```
ExpenseAttachment
  id          String    @id @default(cuid())
  expenseId   String    → Expense
  fileName    String
  fileUrl     String
  fileType    String    (pdf / image / xlsx)
  fileSize    Int
  uploadedAt  DateTime  @default(now())
```

### BulkImport

Audit trail for CSV uploads. Tracks what was imported and any errors.

```
BulkImport
  id            String    @id @default(cuid())
  businessId    String    → Business
  userId        String    → User
  fileName      String
  rowCount      Int
  importedCount Int
  skippedCount  Int
  errorLog      Json?
  importedAt    DateTime  @default(now())
```

## Pages & Routes

### Sidebar Changes

Group existing sidebar items under section headers:

```
INCOME
  Dashboard
  Invoices
  Clients
  Products
  Recurring

EXPENSES
  Expenses        ← new
  Vendors         ← new

(bottom)
  Settings
  Team
```

Categories managed via settings or inline — not a standalone page.

### Expenses List (`/expenses`)

Same table pattern as invoices list page.

- **Filters:** category, vendor, date range (default: current month), search
- **Columns:** date, description, vendor, category (color badge), amount, attachment indicator
- **Actions:** Add Expense button, Import CSV button
- **Footer:** total amount for current filter
- **Row click:** opens expense detail/edit

### Add/Edit Expense (`/expenses/new`, `/expenses/[id]`)

Same form pattern as invoice-form.

- **Core fields:** description, amount, date, category (dropdown), vendor (dropdown with quick-add), payment method, reference, notes
- **Attachments:** drag-drop area (same pattern as logo-upload but allows multiple files)
- **Quick-add vendor:** inline modal, same pattern as client-edit-dialog

### Vendors (`/vendors`)

Same pattern as clients page. CRUD with soft delete.

- **List:** name, email, expense count, total spent
- **Add/Edit:** modal dialog, same pattern as client-edit-dialog

### CSV Import (`/expenses/import`)

Simple upload flow:

1. Upload CSV file
2. Column mapping step — map CSV columns to: date, description, amount, reference
3. Preview rows before importing
4. Import creates expenses (uncategorized, no vendor — user assigns after)
5. BulkImport audit record created

### Dashboard Changes

Add to existing dashboard KPIs:

- **Expenses (this month):** sum of expenses for current month
- **Net (this month):** paid invoice income minus expenses

Keep existing KPIs (outstanding, paid this month, overdue) as-is.

## Server Actions

Follow existing pattern in `src/lib/actions/`. All actions use `requireMembership()`.

- `src/lib/actions/expenses.ts` — create, update, delete expense
- `src/lib/actions/vendors.ts` — create, update, archive vendor
- `src/lib/actions/categories.ts` — create, update, toggle active (seed defaults on first access)
- `src/lib/actions/expense-attachments.ts` — upload to Supabase Storage, delete
- `src/lib/actions/bulk-import.ts` — parse CSV, create expenses, create audit record

## Zod Schemas

Follow existing pattern in `src/lib/schemas/`.

- `src/lib/schemas/expense.ts`
- `src/lib/schemas/vendor.ts`
- `src/lib/schemas/category.ts`

## File Storage

Expense attachments go to Supabase Storage bucket "expenses" (new bucket). Same upload/delete pattern as logo.ts. Allowed file types: PDF, PNG, JPEG, WebP, XLSX, CSV. Max size: 10 MB per file.

## Default Categories

Seeded lazily: when a business's first expense is created or the categories list is first queried, check if any ExpenseCategory rows exist for that business. If not, insert the defaults. Marked `isSystem: true` so they can be deactivated but not deleted.

1. SaaS & Software
2. Rent & Workspace
3. Travel
4. Meals & Entertainment
5. Office Supplies
6. Contractors & Freelancers
7. Professional Services (Legal, CA)
8. Internet & Phone
9. Marketing & Advertising
10. Insurance
11. Equipment & Hardware
12. Bank & Payment Fees
13. Miscellaneous

## What's NOT in scope

- GST / TDS / tax fields on expenses
- Tax reports, GST summary, TDS summary
- P&L reports, tax package ZIP
- Recurring expenses
- Bank integration (Plaid)
- OCR / receipt extraction
- Category auto-suggestion

These can all be layered on later without schema changes (GST/TDS fields are nullable additions to Expense model).
