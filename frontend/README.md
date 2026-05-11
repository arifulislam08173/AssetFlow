# AssetFlow Frontend

Next.js App Router frontend for AssetFlow.

## This update includes

- Role direction: Super Admin, Company Admin, IT, Asset Manager, HR Manager, Finance Manager, Auditor, Viewer
- Company module pages
- Category module pages
- Page-based create/edit flow instead of modals
- Asset create page with multiple asset rows
- Asset import foundation with CSV template download
- Assignment create workflow connected to backend
- Return/clearance workflow connected to backend
- Scanner manual search connected to backend
- User create page and role view
- Purchase/repair create foundation
- Asset CSV export and printable report export
- Improved professional UI wording and workflow guidance

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

`.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

Login:

```text
admin@assetflow.com
password
```

## Main test flow

1. Login
2. Create company
3. Create category
4. Create asset with category dropdown
5. Create employee
6. Create assignment
7. Process return/clearance
8. Search by scanner
9. Export asset CSV/report
10. Check audit logs
