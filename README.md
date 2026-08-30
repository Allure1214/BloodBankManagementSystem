# Blood Bank Management System

A full-stack blood donation and blood-bank management application built with React, Express, and MySQL.

The application supports donor accounts, donation campaigns, appointment reservations, donation records, aggregate blood inventory, notifications, reporting, audit logs, and granular administrator permissions.

> This repository is a functional application prototype. It is not a certified hospital blood-bank or transfusion-management system. Inventory is modeled as aggregate counts by blood bank and blood type; individual blood units, laboratory screening, quarantine, crossmatching, and expiration are not modeled.

## Features

### Donor features

- Account registration and JWT-based authentication
- Password reset using an OTP workflow
- Donor profile and blood-type management
- Upcoming donation campaign discovery
- Campaign reservation and appointment management
- Donation eligibility checks based on recorded completion dates
- Donation history and statistics
- Blood-bank directory and blood availability search
- User notifications
- Contact form
- Rule-based blood donation chatbot

### Administrator features

- Dashboard statistics and charts
- Campaign and campaign-session management
- Appointment confirmation, cancellation, and completion
- Donation record creation and status management
- Aggregate blood inventory adjustment
- Blood-bank management
- User administration and account deactivation
- Granular administrator permissions
- Bulk notification management
- Contact-message management
- Audit-log inspection
- PDF and Excel report exports
- Chatbot analytics

### Inventory model

Inventory is stored as one aggregate count for each blood-bank and blood-type combination.

The system currently supports:

- Eight ABO/Rh blood types
- Atomic stock additions and subtractions
- Prevention of negative inventory
- Automatic stock credit when a donation first transitions to `Completed`
- UI classifications for normal, low, and critical stock

The system does not currently support:

- Individual blood bag or batch tracking
- Collection and expiration dates
- Quarantine or laboratory-release states
- Component separation
- Crossmatching
- Automatic server-side expiry processing

## Architecture

```text
React/Vite frontend
        |
        | HTTPS/JSON
        v
Express REST API
        |
        | mysql2 connection pool
        v
MySQL database
```

Authentication uses signed JWT bearer tokens. Protected routes reload the current user role and account status from MySQL. Administrative mutations additionally use database-backed granular permissions, while `superadmin` accounts bypass individual permission checks.

## Technology stack

### Frontend

- React 18
- Vite 5
- React Router 6
- TanStack React Query
- Axios
- Tailwind CSS
- PostCSS and Autoprefixer
- Headless UI
- Lucide and Heroicons
- React Leaflet and Leaflet
- Recharts
- React Hook Form and Yup
- jsPDF and jsPDF AutoTable
- XLSX

Campaign maps use Leaflet with OpenStreetMap tiles. Google Maps is used only through external direction links; no Google Maps API key is required by the current implementation.

### Backend

- Node.js
- Express 4
- MySQL through `mysql2`
- JSON Web Tokens
- `bcryptjs`
- CORS origin allowlisting
- Express rate limiting
- Nodemailer dependency

`nodemailer` is installed, but outbound email delivery is not currently implemented. Password-reset OTPs are generated in memory and logged by the backend for development.

The `openai` package is installed, but the current chatbot uses local keyword and intent matching and does not call the OpenAI API.

## Repository structure

```text
blood-bank-management/
|-- public/                         Static frontend assets
|-- src/
|   |-- api/                        Shared API client re-export
|   |-- components/
|   |   |-- auth/                   Route and access guards
|   |   |-- common/                 Shared application components
|   |   |-- layout/                 User/admin layouts
|   |   `-- modules/                Feature-specific components
|   |-- config/
|   |   `-- api.js                  API base URL and Axios client
|   |-- context/                    Authentication context
|   |-- pages/
|   |   |-- admin/                  Administrative pages
|   |   |-- common/                 Shared pages
|   |   `-- user/                   Donor/public pages
|   |-- styles/                     Global styles
|   `-- utils/                      Validation and distance helpers
|-- backend/
|   |-- config/
|   |   `-- database.js             MySQL connection pool
|   |-- middleware/
|   |   |-- auth.js                 JWT and active-user validation
|   |   |-- checkPermission.js      Granular administrator RBAC
|   |   `-- auditLogger.js          Administrative audit logging
|   |-- routes/
|   |   |-- Admin/                  Administrative API routers
|   |   `-- *.js                    Public and donor API routers
|   |-- scripts/
|   |   |-- initDB.js               Fresh database initialization
|   |   `-- migrations/             Existing-database migrations
|   |-- server.js                   Express entry point
|   `-- package.json
|-- .env.development                Local frontend variables
|-- .env.production                 Production frontend variables
|-- vercel.json                     Vercel SPA rewrite
|-- vite.config.js
`-- package.json
```

## Prerequisites

- Node.js 18 or later
- npm
- MySQL 8 or a compatible managed MySQL service

## Environment configuration

Do not commit real credentials or secrets. Environment files are ignored by Git.

### Frontend development

Create or update `.env.development`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Blood Bank Management System
```

### Frontend production

Create `.env.production` or configure these variables in Vercel:

```env
VITE_API_BASE_URL=https://your-api-domain.example/api
VITE_APP_NAME=Blood Bank Management System
```

`VITE_API_BASE_URL` must include the `/api` prefix. `VITE_API_URL` is accepted as a compatibility fallback, but `VITE_API_BASE_URL` is preferred. `VITE_APP_NAME` is reserved for application metadata and is not currently consumed by the UI.

### Backend development

Create `backend/.env`:

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_password
DB_NAME=blood_bank_db

JWT_SECRET=replace_with_at_least_32_random_characters
CORS_ORIGINS=http://localhost:3000
```

Optional, currently unused integration variable:

```env
OPENAI_API_KEY=
```

The server refuses to start if `JWT_SECRET` is missing or shorter than 32 characters.

### Backend production

Configure these variables on the API host:

```env
NODE_ENV=production
PORT=5000

DB_HOST=your-managed-mysql-host
DB_PORT=your-managed-mysql-port
DB_USER=your-managed-mysql-user
DB_PASSWORD=your-managed-mysql-password
DB_NAME=your-database-name

JWT_SECRET=replace_with_a_long_cryptographically_random_secret
CORS_ORIGINS=https://your-frontend.vercel.app
```

Multiple frontend origins can be comma-separated:

```env
CORS_ORIGINS=https://example.com,https://www.example.com
```

The following variables are required when `NODE_ENV=production`:

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `CORS_ORIGINS`

`DB_PORT` defaults to `25492`, and `PORT` defaults to `5000`, but both should be explicitly configured in production. The runtime database pool enables TLS when `NODE_ENV=production` or when the database hostname contains `aivencloud`.

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/blood-bank-management.git
cd blood-bank-management
```

Install frontend and backend dependencies:

```bash
npm install
cd backend
npm install
cd ..
```

## Database setup

### Fresh local database

Ensure MySQL is running and `backend/.env` contains valid local credentials.

```bash
cd backend
npm run init-db
```

This executes `backend/scripts/initDB.js` and creates the configured database and tables.

> `initDB.js` currently uses the default MySQL port and does not configure TLS. It is intended primarily for local initialization. For managed MySQL services, create or select the database through the provider and apply the schema with a properly configured MySQL client.

### Existing database

The security constraint migration is located at `backend/scripts/migrations/001_security_constraints.sql`.

Apply it with a MySQL client after taking a backup:

```bash
mysql \
  --host=your-host \
  --port=your-port \
  --user=your-user \
  --password \
  your-database < backend/scripts/migrations/001_security_constraints.sql
```

The migration intentionally fails if incompatible data exists, including:

- Duplicate profiles for one user
- Duplicate permission rows for one administrator
- Duplicate inventory rows for one bank and blood type
- Null inventory bank IDs
- Negative inventory values

Resolve those records before rerunning the migration.

### Database tables

- `users`
- `user_profiles`
- `blood_banks`
- `blood_inventory`
- `admin_permissions`
- `campaigns`
- `campaign_sessions`
- `campaign_reservations`
- `donations`
- `messages`
- `notifications`
- `audit_logs`
- `chatbot_conversations`

### Development administrator warning

Review the administrator seeding section in `backend/scripts/initDB.js` before using it. The current seed is development scaffolding and must not be relied upon for production access. Create production administrators through a controlled process using a bcrypt-hashed password, then remove or disable development credentials.

## Running locally

### Start the backend

```bash
cd backend
npm run dev
```

The API defaults to `http://localhost:5000`. For a non-watch process, use `npm run start`.

### Start the frontend

In another terminal, from the repository root:

```bash
npm run dev
```

Vite is configured to serve the frontend at `http://localhost:3000`.

## Build and preview

```bash
npm run build
npm run preview
```

Generated files are written to `dist/`.

## API overview

There is no generated Swagger/OpenAPI page in the current repository. All API routes are mounted under `/api`.

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/verify-email
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/reset-password
```

Authentication routes are rate-limited to 20 requests per 15-minute window per client.

### Donor account

All `/api/user` routes require a JWT.

```text
GET /api/user/profile
PUT /api/user/profile
PUT /api/user/change-password
PUT /api/user/update-blood-type
GET /api/user/reservation
GET /api/user/appointments
PUT /api/user/appointments/:id/cancel
GET /api/user/donations
GET /api/user/donation-stats
PUT /api/user/notification-preferences
```

### Campaigns

```text
GET  /api/campaigns/upcoming
POST /api/campaigns/reserve
GET  /api/campaigns/check-reservation
GET  /api/campaigns/check-eligibility
GET  /api/campaigns/:campaignId/check-reservation
PUT  /api/campaigns/complete-donation/:reservationId
```

Reservation creation and donor-specific checks require authentication. Campaign completion additionally requires `can_manage_appointments`.

### Blood banks and availability

```text
GET /api/blood-banks/all
GET /api/blood-banks/areas
GET /api/blood-banks/availability
GET /api/blood-banks/inventory-summary
GET /api/blood-banks/:id
GET /api/blood-banks/:id/availability
GET /api/blood-banks/:id/inventory
```

Blood-bank creation, modification, and deletion require `can_manage_blood_banks`. Administrative inventory access and mutation require `can_manage_inventory`.

### Appointments

The active appointment prefix is singular:

```text
GET /api/appointment
GET /api/appointment/:id
GET /api/appointment/time-slots/:campaignId/:date
PUT /api/appointment/:id/status
PUT /api/appointment/:id/update-time
PUT /api/appointment/:id/complete-donation
```

Administrative reads and mutations require `can_manage_appointments`, except the public time-slot lookup.

### Administrative resources

```text
/api/admin/dashboard
/api/admin/users
/api/admin/inventory/update
/api/admin/campaigns
/api/admin/donations
/api/admin/notifications
/api/admin/permission
/api/admin/messages
/api/admin/audit-logs
```

Administrative mutations use the relevant database-backed permission:

- `can_manage_users`
- `can_manage_inventory`
- `can_manage_campaigns`
- `can_manage_blood_banks`
- `can_manage_donations`
- `can_manage_appointments`
- `can_manage_notifications`
- `can_manage_reports`

Superadmins bypass granular permission checks.

### Notifications and messages

```text
GET /api/notifications
GET /api/notifications/recent
PUT /api/notifications/:id/read
PUT /api/notifications/read-all
POST /api/messages/submit
```

### Chatbot

```text
POST /api/chatbot/chat
GET  /api/chatbot/suggestions
GET  /api/chatbot/history
GET  /api/chatbot/analytics
```

The chatbot uses local intent recognition. History is stored only for authenticated users.

## Deployment

### Frontend on Vercel

The repository includes `vercel.json`, which rewrites client-side routes to `/index.html` so React Router routes work after direct navigation or refresh.

Configure:

```env
VITE_API_BASE_URL=https://your-api-domain.example/api
VITE_APP_NAME=Blood Bank Management System
```

Recommended Vercel settings:

```text
Framework preset: Vite
Build command: npm run build
Output directory: dist
```

### Express API on Render

The repository does not include a `render.yaml`, so Render deployment must be configured manually.

```text
Root directory: backend
Build command: npm install
Start command: npm run start
```

Add all backend production environment variables through Render's environment configuration and include the deployed frontend domain in `CORS_ORIGINS`.

### MySQL on Aiven

Configure the runtime API using the Aiven service credentials:

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
NODE_ENV=production
```

The current TLS configuration uses `rejectUnauthorized: false`. For stronger production identity verification, download Aiven's CA certificate and configure `mysql2` with it.

Do not assume `npm run init-db` can create an Aiven database. Managed-service accounts may not have `CREATE DATABASE` permission, and the initialization script does not currently pass the configured port or TLS options.

## Security behavior

- Passwords are hashed with bcrypt.
- JWTs expire after 24 hours.
- Authentication middleware rejects missing, invalid, expired, or inactive users.
- Roles and status are reloaded from the database for protected requests.
- Granular administrator permissions are stored in MySQL.
- Inventory subtraction uses a conditional atomic update.
- Completed donations credit inventory only on their first completion transition.
- Donation completion and inventory credit occur within one transaction.
- CORS uses an explicit origin allowlist.
- JSON request bodies are limited to 100 KB.
- Authentication endpoints are rate-limited.

## Available scripts

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

### Backend

```bash
cd backend
npm run dev
npm run start
npm run init-db
```

## Known limitations

- No Swagger/OpenAPI documentation is generated.
- No automated test suite is configured.
- Repository-wide ESLint currently reports existing errors.
- OTPs are stored in process memory and are lost on restart.
- OTP delivery is not connected to email and development OTPs are logged by the backend.
- The chatbot does not currently use OpenAI.
- Inventory is aggregate and has no expiration model.
- Low-stock labels are frontend threshold calculations, not server-generated alerts.
- Database TLS does not currently verify the provider certificate.
- The production bundle currently emits a large-chunk warning.
- The repository has no infrastructure-as-code configuration for Render.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make and verify your changes.
4. Run the production build.
5. Run the available lint checks and document any baseline failures.
6. Open a pull request with a clear description of the change.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
