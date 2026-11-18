import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import iampeckishRoutes from "./routes/iampeckishRoutes.js";
import { sequelize, connectDB } from "./models/index.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ======================================================
   MIDDLEWARE CONFIGURATION
====================================================== */

// CORS handling for browser / frontend clients
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, URL_PARAMETER, x-client-id, x-client-secret, x-api-key"
    );
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

// Body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logger middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
});

/* ======================================================
   CORE / HEALTH ROUTES
====================================================== */

// Health check endpoint
app.get("/health", async (req, res) => {
    let dbStatus = "disconnected";
    try {
        await sequelize.authenticate();
        dbStatus = "connected";
    } catch (err) {
        dbStatus = `error: ${err.message}`;
    }

    res.status(200).json({
        status: "OK",
        database: dbStatus,
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`
    });
});

// Root info endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        name: "RestoFlow API",
        version: "1.0.0",
        description: "Backend API for RestoFlow restaurant POS & IAmPeckish integration",
        endpoints: {
            health: "/health",
            peckish: "/api/",
            authStatus: "/api/auth/status",
            restaurants: "/api/restaurants",
            items: "/api/items",
            suppliers: "/api/suppliers",
            stocklevels: "/api/stocklevels"
        }
    });
});

/* ======================================================
   API ROUTES
====================================================== */

// Mount Peckish integration routes  /api for convenience
app.use("/api", iampeckishRoutes);

/* ======================================================
   404 & ERROR HANDLING MIDDLEWARE
====================================================== */

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint not found: ${req.method} ${req.originalUrl}`
    });
});

// Centralized error handler
app.use((err, req, res, next) => {
    console.error("[Unhandled Error]", err);
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
    });
});

/* ======================================================
   SERVER & DATABASE INITIALIZATION
====================================================== */

export async function startServer(port = PORT) {
    try {
        await connectDB({
            sync: true,
            alter: process.env.DB_SYNC_ALTER === "true"
        });
    } catch (dbErr) {
        console.error("⚠️ Warning: Server starting without active MySQL connection:", dbErr.message);
    }

    return app.listen(port, () => {
        console.log(`====================================================`);
        console.log(`🚀 RestoFlow Server is running on port ${port}`);
        console.log(`👉 Local:         http://localhost:${port}`);
        console.log(`👉 Health check:  http://localhost:${port}/health`);
        console.log(`👉 Peckish API:   http://localhost:${port}/api`);
        console.log(`====================================================`);
    });
}

const isDirectRun =
    process.argv[1] &&
    fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
    startServer(PORT);
}

export default app;
