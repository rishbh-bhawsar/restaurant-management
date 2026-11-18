# Restaurant Management System (RestoFlow)

RestoFlow is a modern Restaurant Management & Point-of-Sale (POS) platform featuring inventory control, stocktaking, supplier tracking, and automated third-party integrations with **IAmPeckish Connect API**.

---

## 📁 Repository Overview

```text
restaurant-management/
├── Backend/      # Node.js, Express, Sequelize, MySQL, and IAmPeckish API integration
├── Frontend/     # POS & Management UI client applications
└── README.md     # Main documentation
```

---

## 🚀 Quick Start (Backend)

For detailed instructions on configuring the environment, running the database migrations, and executing the API calls:

👉 **[See Backend README](./Backend/README.md)**

```bash
cd Backend
npm install
cp .example.env .env
# Edit .env with your MySQL credentials and Peckish API keys
npm start
```

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js 5
- **Database:** MySQL
- **ORM:** Sequelize
- **Integration:** IAmPeckish Connect OAuth 2.0 & Inventory REST API
- **Testing & Tools:** Postman Collection included in `Backend/postman/`

---

## 📄 License

ISC License - RestoFlow
