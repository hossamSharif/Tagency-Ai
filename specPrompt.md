 
Build a SaaS web application for travel agencies to manage tourism packages, services, customers, and partner offices. The app must be mobile responsive, support Arabic (default) and English, and include dark/light themes.

### Core Purpose
- Allow travel offices to create and manage tourism packages (e.g., Hajj, Umrah, honeymoon trips).
- Packages can include multiple services: airline tickets, hotel reservations, visa issuance, etc.
- Offices may deliver services directly or act as intermediaries, passing services to other offices/companies with commission tracking.

### User & Account Management
- SaaS user management: signup, login, password reset, roles (admin, staff, customer, partner office).
- Profile management: personal info, contact details, uploaded documents.
- Multi-tenant support (each office has its own workspace).

### Packages & Services
- Create/edit/delete packages.
- Add services with pricing, description, and required documents.
- Mark services as "in-house" or "outsourced" (with commission %).
- Attach documents (passport scans via camera or PDF upload).
- Track package status (draft, active, completed).

### Customers & Partner Offices
- Customer accounts: invoices, payments, balance preview.
- Partner office accounts: commission tracking, settlement management.
- Ability to assign services to partner offices and calculate revenue split.

### Payments
- Free trial plan: 1 week.
- Paid subscription plan: monthly.
- Payment methods:
  - Stripe integration (credit/debit cards).
  - Offline bank transfer: user uploads proof document + transaction number → admin approval workflow.

### Invoices & Finance
- Generate invoices with itemized services.
- Identify outsourced services and calculate commission deduction.
- Track received payments, pending payments, and balances.
- Admin dashboard for financial overview.

### Notifications
- In-app notifications + email alerts for:
  - Payment status (approved, pending).
  - Package updates.
  - Document requests.
  - Commission settlements.

### Landing Page
- SaaS marketing site with:
  - Free trial signup.
  - Pricing page (monthly plan).
  - Feature overview.
  - Contact form.

### Passport Scanning
- Feature to scan passport data via:
  - Camera capture (OCR).
  - PDF upload → extract data automatically.

### Enhancements (Recommended)
- Role-based access control (RBAC).
- Audit logs (track changes to packages, invoices, payments).
- Reporting & analytics (sales, commissions, customer activity).
- API endpoints for integration with external systems.
- Admin panel for managing subscriptions, approvals, and user accounts.

### Technical Requirements
- Mobile responsive design.
- Arabic-first UI, with English toggle.
- Dark/light theme support.
- Secure document storage.
- Scalable SaaS architecture.
