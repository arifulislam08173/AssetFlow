# AssetFlow Backend API

Professional Node.js + Express + PostgreSQL + Sequelize backend for AssetFlow.

## This update includes

- Final role seed list: Super Admin, Company Admin, IT, Asset Manager, HR Manager, Finance Manager, Auditor, Viewer
- Permission middleware with wildcard support, e.g. `assets.*`
- Company management endpoints
- Category management endpoints
- Page-based frontend support for create/edit forms
- Bulk asset create API and CSV template endpoint
- Assignment list/create API
- Return & clearance list/create API
- Scanner search API by asset code, serial number, or asset tag
- Export endpoints for assets CSV, printable asset report, and audit CSV
- Fixed TypeScript build

## Setup

```bash
cp .env.example .env
npm install
npm run db:fresh
npm run dev
```

Use your local PostgreSQL `.env` values, for example:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=assetflow_db
DB_USER=postgres
DB_PASSWORD=postgres
CLIENT_URL=http://localhost:3000
```

Default login:

```text
admin@assetflow.com
password
```

## Useful commands

```bash
npm run dev
npm run build
npm run db:sync
npm run db:seed
npm run db:fresh
```

`db:fresh` drops and recreates tables. Use only in development.
