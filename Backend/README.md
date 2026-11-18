# RestoFlow Backend - IAmPeckish Integration & Restaurant POS

A high-performance Node.js & Express REST API that integrates **RestoFlow POS** with the **IAmPeckish Connect API**, featuring automatic bidirectional data synchronization into a **MySQL** database powered by **Sequelize ORM**.

---

## 📌 Features

- **Express 5 REST API:** Modular architecture with centralized routing, error handling, CORS, and request logging.
- **IAmPeckish OAuth 2.0 Integration:** Full authorization flow, token exchange, transparent 401 token refresh interceptors, and in-memory credential storage.
- **MySQL & Sequelize Synchronization (20 Tables):** Automatically syncs API responses into normalized MySQL tables using composite unique-key bulk upserts (`INSERT ... ON DUPLICATE KEY UPDATE`).
- **Full Payload Fidelity:** Every database table stores structured typed columns alongside a `raw_data` (`JSON`) column so no nested or dynamic API fields are lost.
- **Audit Logging:** Logs every sync attempt, rows received, rows synced, and error messages to `peckish_sync_logs`.
- **Ready-to-Use Postman Collection:** Comprehensive Postman collection covering all 35 endpoints with pre-configured variables and automatic token capture scripts.

---

## 📂 Project Structure

```text
Backend/
├── config/
│   └── db.js                         # Sequelize MySQL connection & connectDB helper
├── controllers/
│   └── iampeckishController.js       # Route controller handling auth, sync, and API responses
├── database/
│   └── restoflow_pos_schema.sql      # Standalone MySQL DDL schema script (20 tables)
├── models/
│   ├── modelHelpers.js               # Standardized model factory with tenant keys & indexes
│   ├── coreModels.js                 # Restaurants, Units, Conversions, Suppliers
│   ├── catalogModels.js              # Items, Ingredients, Preparations, Products
│   ├── inventoryModels.js            # Purchases, Invoices, Stock Levels, Stocktakes
│   ├── eventModels.js                # Wastage, StockTakes, Transfers, Sales, Receives, SyncLog
│   └── index.js                      # Sequelize models registry & soft associations
├── postman/
│   └── RestoFlow_IAmPeckish_API.postman_collection.json # Postman collection
├── routes/
│   └── iampeckishRoutes.js           # API route definitions
├── services/
│   ├── iampeckishService.js          # Axios client with auto-refresh interceptors
│   └── iampeckishSqlService.js       # Bulk upsert persistence handlers for MySQL
├── utils/
│   ├── iampeckishRequestHelper.js    # Outbound Axios configuration builder
│   └── iampeckishTokenStore.js       # In-memory OAuth token and credential storage
├── .env                              # Local private environment variables
├── .example.env                      # Template environment variables 
├── .env.example                      # Standard template environment variables
├── .gitignore                        # Git ignore rules
├── app.js                            # Express application setup and listener
├── package.json                      # Project dependencies and scripts
└── server.js                         # Server entrypoint with graceful shutdown
```

---

## 🛠️ Prerequisites

- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher
- **MySQL Server:** v5.7+ / v8.0+ or MariaDB 10.3+
- **IAmPeckish Developer Account:** Client ID & Client Secret from Peckish Connect

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/rishbh-bhawsar/restaurant-management
cd restaurant-management/Backend
npm install
```

### 2. Configure Environment Variables

Copy the template file to `.env`:

```bash
cp .example.env .env
```

Open `.env` and fill in your MySQL database credentials and IAmPeckish details:

```env
# Server
PORT=5000
NODE_ENV=development

# IAmPeckish API Credentials
IAMPECKISH_CLIENT_ID=your_client_id
IAMPECKISH_CLIENT_SECRET=your_client_secret
IAMPECKISH_API_KEY=
IAMPECKISH_REDIRECT_URI=http://localhost:5000/api/oauth/callback

# MySQL Database
DB_USER=root
DB_PASS=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=restoflow_pos
DB_LOGGING=false
DB_SYNC_ALTER=false
```

### 3. Create the Database

Log in to MySQL and create the database (Sequelize will automatically create all 20 tables on startup):

```sql
CREATE DATABASE IF NOT EXISTS restoflow_pos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

*(Optional: You can also execute `database/restoflow_pos_schema.sql` manually via MySQL Workbench or CLI).*

### 4. Start the Server

```bash
# Production mode
npm start

# Development mode (with live watch)
npm run dev

# Alternative entrypoint
npm run server
```

Once started, verify the health status:

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "database": "connected",
  "timestamp": "2026-11-18T07:30:00.000Z",
  "uptime": "5s"
}
```

---

## 🔄 IAmPeckish Integration Flow

### Step 1: OAuth Authentication

1. Open the authorization URL in your browser:
   ```text
   http://localhost:5000/api/auth/login?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:5000/api/oauth/callback
   ```
2. Approve permissions on IAmPeckish.
3. Peckish redirects back to `/api/oauth/callback?code=AUTH_CODE`.
4. The callback automatically exchanges the authorization code for `access_token` + `refresh_token` and displays your session tokens.
5. Alternatively, exchange the code directly via `POST /api/auth/token`:
   ```bash
   curl -X POST http://localhost:5000/api/auth/token \
     -H "Content-Type: application/json" \
     -d '{
       "grant_type": "authorization_code",
       "code": "YOUR_CODE",
       "client_id": "YOUR_CLIENT_ID",
       "client_secret": "YOUR_CLIENT_SECRET",
       "redirect_uri": "http://localhost:5000/api/oauth/callback"
     }'
   ```

### Step 2: Fetch Data & Sync to MySQL

Data endpoints accept `entityId`, `branchId`, and `URL_PARAMETER` containing credentials:

```bash
curl -G "http://localhost:5000/api/restaurants" \
  --data-urlencode "entityId=1" \
  --data-urlencode "branchId=1" \
  --data-urlencode "URL_PARAMETER=URL_PATH=https://api.iampeckish.com/connect/api/:;:USERNAME=user@example.com:;:PASSWORD=secret:;:CLIENT_ID=client123:;:CLIENT_SECRET=secret123:;:ACCESS_TOKEN=token123:;:RESTAURANT_UUID=rest_uuid"
```

The response is returned to the client and simultaneously persisted into MySQL:
```json
{
  "success": true,
  "status": 2,
  "entityId": 1,
  "branchId": 1,
  "synced": 5,
  "data": [ ... ]
}
```

---

## 🗄️ Database Tables (20 Entities)

| Table Name | Description | Key Model |
| :--- | :--- | :--- |
| `peckish_restaurants` | Restaurant venues, addresses, timezones | `PeckishRestaurant` |
| `peckish_units` | Units of measure (kg, litre, pieces) | `PeckishUnit` |
| `peckish_unit_conversions` | Unit conversion rates | `PeckishUnitConversion` |
| `peckish_suppliers` | Vendor and supplier records | `PeckishSupplier` |
| `peckish_suppliers_details` | In-depth supplier catalogues & contacts | `PeckishSupplierDetail` |
| `peckish_items` | Master inventory items | `PeckishItem` |
| `peckish_ingredients` | Raw cooking ingredients & allergen data | `PeckishIngredient` |
| `peckish_preparations` | Prepared food recipes & sub-batches | `PeckishPreparation` |
| `peckish_products` | Sellable POS products & menu items | `PeckishProduct` |
| `peckish_purchases` | Purchase orders & delivery dates | `PeckishPurchase` |
| `peckish_invoices` | Supplier invoices & payment status | `PeckishInvoice` |
| `peckish_stock_levels` | Real-time on-hand stock quantities & valuations | `PeckishStockLevel` |
| `peckish_stock_take_master` | Stocktake sessions & total variances | `PeckishStockTakeMaster` |
| `peckish_stock_take_details` | Individual item stock count lines | `PeckishStockTakeDetail` |
| `peckish_wastage` | Waste and loss logs | `PeckishWastage` |
| `peckish_stock_takes` | Historical stocktake audit events | `PeckishStockTakeEvent` |
| `peckish_transfers` | Inter-branch inventory transfers | `PeckishTransfer` |
| `peckish_sales_events` | POS item sales, taxes, discounts | `PeckishSalesEvent` |
| `peckish_receives` | Received goods deliveries | `PeckishReceive` |
| `peckish_sync_logs` | API sync audit log & failure diagnostic history | `PeckishSyncLog` |

---

## 📮 Postman Collection

Import `postman/RestoFlow_IAmPeckish_API.postman_collection.json` into Postman:
1. Open **Postman** → **Import** → choose the collection file.
2. Under the collection's **Variables** tab, fill in your `clientId`, `clientSecret`, `username`, and `password`.
3. Built-in test scripts will automatically save `accessToken`, `refreshToken`, and `restaurantUuid` across requests.

---

## 📜 Scripts

| Command | Action |
| :--- | :--- |
| `npm start` | Starts the Express server using `app.js` |
| `npm run dev` | Runs with Node's native file watcher (`--watch`) |
| `npm run server` | Starts via `server.js` with graceful shutdown handlers |

---

## 📄 License

ISC License - Developed by **Rishbh Bhawsar**.
