import { startServer } from "./app.js";
import { sequelize } from "./models/index.js";

const PORT = process.env.PORT || 5000;
const server = await startServer(PORT);

const shutdown = async (signal) => {
    console.log(`${signal} signal received: closing HTTP server and MySQL pool...`);
    server.close(async () => {
        try {
            await sequelize.close();
            console.log("MySQL connection pool closed.");
        } catch (err) {
            console.error("Error closing MySQL pool:", err.message);
        }
        process.exit(0);
    });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
