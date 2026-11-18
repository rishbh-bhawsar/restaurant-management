// models/eventModels.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { definePeckishModel } from "./modelHelpers.js";

export const PeckishWastage = definePeckishModel(
    "PeckishWastage",
    "peckish_wastage",
    {
        event_uuid: { type: DataTypes.STRING(100), allowNull: false },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        item_uuid: { type: DataTypes.STRING(100), allowNull: true },
        item_name: { type: DataTypes.STRING(255), allowNull: true },
        quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        unit_uuid: { type: DataTypes.STRING(100), allowNull: true },
        unit_name: { type: DataTypes.STRING(100), allowNull: true },
        cost_value: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        reason: { type: DataTypes.STRING(255), allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        event_date: { type: DataTypes.DATE, allowNull: true },
        recorded_by: { type: DataTypes.STRING(150), allowNull: true }
    },
    "event_uuid",
    [{ name: "idx_wastage_date", fields: ["event_date"] }]
);

export const PeckishStockTakeEvent = definePeckishModel(
    "PeckishStockTakeEvent",
    "peckish_stock_takes",
    {
        event_uuid: { type: DataTypes.STRING(100), allowNull: false },
        stocktake_uuid: { type: DataTypes.STRING(100), allowNull: true },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        item_uuid: { type: DataTypes.STRING(100), allowNull: true },
        item_name: { type: DataTypes.STRING(255), allowNull: true },
        expected_quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        counted_quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        variance_quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        unit_uuid: { type: DataTypes.STRING(100), allowNull: true },
        cost_variance: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        event_date: { type: DataTypes.DATE, allowNull: true }
    },
    "event_uuid",
    [{ name: "idx_st_event_date", fields: ["event_date"] }]
);

export const PeckishTransfer = definePeckishModel(
    "PeckishTransfer",
    "peckish_transfers",
    {
        event_uuid: { type: DataTypes.STRING(100), allowNull: false },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        from_restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        to_restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        item_uuid: { type: DataTypes.STRING(100), allowNull: true },
        item_name: { type: DataTypes.STRING(255), allowNull: true },
        quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        unit_uuid: { type: DataTypes.STRING(100), allowNull: true },
        unit_name: { type: DataTypes.STRING(100), allowNull: true },
        cost_value: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        status: { type: DataTypes.STRING(50), allowNull: true },
        event_date: { type: DataTypes.DATE, allowNull: true }
    },
    "event_uuid",
    [{ name: "idx_transfer_date", fields: ["event_date"] }]
);

export const PeckishSalesEvent = definePeckishModel(
    "PeckishSalesEvent",
    "peckish_sales_events",
    {
        event_uuid: { type: DataTypes.STRING(100), allowNull: false },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        product_uuid: { type: DataTypes.STRING(100), allowNull: true },
        item_uuid: { type: DataTypes.STRING(100), allowNull: true },
        product_name: { type: DataTypes.STRING(255), allowNull: true },
        pos_ref: { type: DataTypes.STRING(100), allowNull: true },
        quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        gross_amount: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        net_amount: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        tax_amount: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        discount_amount: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        currency: { type: DataTypes.STRING(20), allowNull: true },
        event_date: { type: DataTypes.DATE, allowNull: true }
    },
    "event_uuid",
    [
        { name: "idx_sales_date", fields: ["event_date"] },
        { name: "idx_sales_product", fields: ["product_uuid"] }
    ]
);

export const PeckishReceive = definePeckishModel(
    "PeckishReceive",
    "peckish_receives",
    {
        event_uuid: { type: DataTypes.STRING(100), allowNull: false },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        purchase_uuid: { type: DataTypes.STRING(100), allowNull: true },
        invoice_uuid: { type: DataTypes.STRING(100), allowNull: true },
        supplier_ref: { type: DataTypes.STRING(100), allowNull: true },
        item_uuid: { type: DataTypes.STRING(100), allowNull: true },
        item_name: { type: DataTypes.STRING(255), allowNull: true },
        quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        unit_uuid: { type: DataTypes.STRING(100), allowNull: true },
        unit_cost: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        total_cost: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        event_date: { type: DataTypes.DATE, allowNull: true }
    },
    "event_uuid",
    [
        { name: "idx_receives_date", fields: ["event_date"] },
        { name: "idx_receives_supplier", fields: ["supplier_ref"] }
    ]
);

export const PeckishSyncLog = sequelize.define(
    "PeckishSyncLog",
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        entity_id: { type: DataTypes.INTEGER, allowNull: true },
        branch_id: { type: DataTypes.INTEGER, allowNull: true },
        endpoint: { type: DataTypes.STRING(100), allowNull: false },
        table_name: { type: DataTypes.STRING(100), allowNull: false },
        rows_received: { type: DataTypes.INTEGER, defaultValue: 0 },
        rows_synced: { type: DataTypes.INTEGER, defaultValue: 0 },
        status: { type: DataTypes.STRING(20), defaultValue: "SUCCESS" },
        error_message: { type: DataTypes.TEXT, allowNull: true },
        synced_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    },
    {
        tableName: "peckish_sync_logs",
        timestamps: true,
        underscored: true,
        indexes: [
            { name: "idx_sync_logs_tenant", fields: ["entity_id", "branch_id"] },
            { name: "idx_sync_logs_endpoint", fields: ["endpoint", "synced_at"] }
        ]
    }
);

