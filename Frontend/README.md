# RestoFlow Frontend - Restaurant POS & Peckish Connect Client

An interactive, modern Restaurant Point of Sale (POS) and Management System built with **Angular (v22)**, **Bootstrap 5**, **Angular Material**, and **SCSS**. Designed to connect with the **RestoFlow Backend** & **IAmPeckish Connect API**.

---

## 🚀 Key Features

1. **Authentication & Route Guarding:**
   - **Login Page (`/auth/login`):** Pre-configured for administrative login:
     - **Email:** `admin@test.com`
     - **Password:** `admin123`
   - **Strict API & Route Guards:** Protected routes (`/dashboard`, `/pos`, `/products`, `/sales`, `/inventory`, `/restaurants`) are gated by `AuthGuard`.
   - **Pre-flight Interceptor Protection:** Outbound `/api/` calls are blocked if no valid session token exists.
   - **Automatic 401 & 403 Handling:** Catches unauthorized sessions, automatically logs out the user, triggers a descriptive toast notification, and redirects to `/auth/login`.

2. **Interactive Point of Sale (POS):**
   - **POS Terminal (`/pos/terminal`):** Category filter pills, debounced instant search, responsive product catalog cards, out-of-stock badges.
   - **Product Customization Modal:** Portion sizes, spice levels, add-on modifiers, and special kitchen instructions.
   - **Live Cart Panel:** Quantity increments/decrements, tax calculations (8.25%), instant discount vouchers (5%, 10%, 15%), order type selector (Dine-In, Takeaway, Delivery).
   - **Checkout Flow (`/pos/checkout`):** Cash tender & change calculator, Card, UPI/QR, Split bill options, and guest table assignment.
   - **Order Review & Thermal Receipt (`/pos/order-review`):** Complete receipt preview with formatted line items, totals, paid watermark, and native browser printing (`window.print()`).

3. **Dashboard & Operations:**
   - Real-time revenue metrics, orders count, low-stock warnings, and recent transaction tables.

4. **Scroll Pagination & 404 Empty States:**
   - Custom `[appInfiniteScroll]` directive for seamless data loading.
   - Clean 404 "No Records Found" empty state component with reset/reload actions.

5. **Toaster Notification System:**
   - Reactive `ToasterService` & `ToasterComponent` for clear alerts (Success, Error, Warning, Info) parsed from backend API responses.

6. **Postman & Multi-Tenant Support:**
   - Directly maps all 35 endpoints from `Backend/postman/RestoFlow_IAmPeckish_API.postman_collection.json`.
   - Injects required `URL_PARAMETER`, `entityId`, `branchId`, and `restaurant_uuid` parameters into every outbound request.

---

## 📁 Project Directory Structure

```text
restoflow-frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── api/
│   │   │   │   ├── api.service.ts
│   │   │   │   ├── api-endpoints.ts
│   │   │   │   └── api-error-handler.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   └── error.interceptor.ts
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── restaurant-context.service.ts
│   │   │   │   └── toaster.service.ts
│   │   │   └── config/
│   │   │       └── app.config.ts
│   │   ├── layouts/
│   │   │   ├── main-layout/
│   │   │   │   ├── components/
│   │   │   │   │   ├── sidebar/
│   │   │   │   │   ├── header/
│   │   │   │   │   └── breadcrumb/
│   │   │   │   └── main-layout.component.*
│   │   │   └── auth-layout/
│   │   │       └── auth-layout.component.*
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── pos/
│   │   │   ├── products/
│   │   │   ├── sales/
│   │   │   ├── inventory/
│   │   │   └── restaurants/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   ├── directives/
│   │   │   ├── pipes/
│   │   │   └── shared.module.ts
│   │   ├── app-routing.module.ts
│   │   ├── app.component.*
│   │   └── app.module.ts
│   ├── assets/
│   ├── environments/
│   └── styles.scss
└── angular.json
```

---

## 🛠️ Getting Started

### 1. Run Development Server

```bash
cd Frontend
npm start
```
Navigate to `http://localhost:4200/`.

### 2. Login

- **Email:** `admin@test.com`
- **Password:** `admin123`

### 3. Build for Production

```bash
npm run build
```
The compiled output is saved in `dist/Frontend/`.
