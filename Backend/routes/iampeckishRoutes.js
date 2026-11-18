import express from "express";
import {
    // Auth
    signIn,
    getTestToken,
    generateToken,
    refreshToken,
    exchangeToken,
    getAuthStatus,
    getAuthorizeUrl,
    authorizeConnect,
    login,
    callback,
    getProfile,
    // Restaurants
    getRestaurants,
    getRestaurantById,
    // Units
    getUnits,
    getUnitConversions,
    // Items
    getItems,
    getIngredients,
    getPreparations,
    getProducts,
    // Suppliers
    getSuppliers,
    getSupplierByRef,
    // Purchases & Invoices
    getPurchases,
    getInvoices,
    // Stock
    getStocklevels,
    getStocktakes,
    getStocktakeById,
    // Events
    getEventsWastes,
    getEventsStocktakes,
    getEventsTransfers,
    getEventsSales,
    getEventsReceives,
    postEvent
} from "../controllers/iampeckishController.js";

const router = express.Router();

// ==========================================
// 1️⃣ AUTHENTICATION ROUTES
// ==========================================
router.get("/oauth/callback", callback);
router.get("/callback", callback);
router.get("/auth/login", login);
router.get("/auth/callback", callback);
router.get("/auth/authorize", getAuthorizeUrl);
router.post("/auth/authorize", authorizeConnect);
router.post("/auth/token", exchangeToken);
router.post("/auth/refresh", refreshToken);
router.post("/auth/signin", signIn);
router.post("/auth/test-token", getTestToken);
router.post("/auth/generate-token", generateToken);
router.get("/auth/status", getAuthStatus);
router.get("/auth/me", getProfile);

// ==========================================
// 2️⃣ RESTAURANT ROUTES
// ==========================================
router.get("/restaurants", getRestaurants);
router.get("/restaurants/:restaurant_uuid", getRestaurantById);

// ==========================================
// 3️⃣ UNITS ROUTES
// ==========================================
router.get("/units", getUnits);
router.get("/units/conversions", getUnitConversions);

// ==========================================
// 4️⃣ ITEMS ROUTES
// ==========================================
router.get("/items", getItems);
router.get("/items/items", getItems);
router.get("/ingredients", getIngredients);
router.get("/items/ingredients", getIngredients);
router.get("/preparations", getPreparations);
router.get("/items/preparations", getPreparations);
router.get("/products", getProducts);
router.get("/items/products", getProducts);

// ==========================================
// 5️⃣ SUPPLIER ROUTES
// ==========================================
router.get("/suppliers", getSuppliers);
router.get("/suppliers/:supplier_ref", getSupplierByRef);

// ==========================================
// 6️⃣ PURCHASES & INVOICES ROUTES
// ==========================================
router.get("/purchases", getPurchases);
router.get("/invoices", getInvoices);

// ==========================================
// 7️⃣ STOCK ROUTES
// ==========================================
router.get("/stocklevels", getStocklevels);
router.get("/stocktakes", getStocktakes);
router.get("/stocktakes/:stocktake_uuid", getStocktakeById);

// ==========================================
// 8️⃣ EVENTS ROUTES
// ==========================================
router.get("/events/wastes", getEventsWastes);
router.get("/events/stocktakes", getEventsStocktakes);
router.get("/events/transfers", getEventsTransfers);
router.get("/events/sales", getEventsSales);
router.get("/events/receives", getEventsReceives);
router.post("/events/:eventType", postEvent);

export default router;

