// models/inventoryModels.js
import { DataTypes } from "sequelize";
import { definePeckishModel } from "./modelHelpers.js";

export const PeckishPurchase = definePeckishModel(
    "PeckishPurchase",
    "peckish_purchases",
    {
        purchase_uuid: { type: DataTypes.STRING(100), allowNull: false },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        order_number: { type: DataTypes.STRING(100), allowNull: true },
        supplier_ref: { type: DataTypes.STRING(100), allowNull: true },
        supplier_name: { type: DataTypes.STRING(255), allowNull: true },
        status: { type: DataTypes.STRING(50), allowNull: true },
        order_date: { type: DataTypes.DATE, allowNull: true },
        delivery_date: { type: DataTypes.DATE, allowNull: true },
        currency: { type: DataTypes.STRING(20), allowNull: true },
        subtotal: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        tax_amount: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        total_amount: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        items_json: { type: DataTypes.JSON, allowNull: true },
        api_created_at: { type: DataTypes.DATE, allowNull: true },
        api_updated_at: { type: DataTypes.DATE, allowNull: true }
    },
    "purchase_uuid",
    [
        { name: "idx_purchases_uuid", fields: ["purchase_uuid"] },
        { name: "idx_purchases_supplier", fields: ["supplier_ref"] }
    ]
);

export const PeckishInvoice = definePeckishModel(
    "PeckishInvoice",
    "peckish_invoices",
    {
        invoice_uuid: { type: DataTypes.STRING(100), allowNull: false },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        invoice_number: { type: DataTypes.STRING(100), allowNull: true },
        purchase_uuid: { type: DataTypes.STRING(100), allowNull: true },
        supplier_ref: { type: DataTypes.STRING(100), allowNull: true },
        supplier_name: { type: DataTypes.STRING(255), allowNull: true },
        status: { type: DataTypes.STRING(50), allowNull: true },
        invoice_date: { type: DataTypes.DATE, allowNull: true },
        due_date: { type: DataTypes.DATE, allowNull: true },
        currency: { type: DataTypes.STRING(20), allowNull: true },
        subtotal: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        tax_amount: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        total_amount: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        items_json: { type: DataTypes.JSON, allowNull: true },
        api_created_at: { type: DataTypes.DATE, allowNull: true },
        api_updated_at: { type: DataTypes.DATE, allowNull: true }
    },
    "invoice_uuid",
    [
        { name: "idx_invoices_uuid", fields: ["invoice_uuid"] },
        { name: "idx_invoices_supplier", fields: ["supplier_ref"] }
    ]
);

export const PeckishStockLevel = definePeckishModel(
    "PeckishStockLevel",
    "peckish_stock_levels",
    {
        stock_level_key: { type: DataTypes.STRING(150), allowNull: false },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        item_uuid: { type: DataTypes.STRING(100), allowNull: true },
        item_name: { type: DataTypes.STRING(255), allowNull: true },
        item_type: { type: DataTypes.STRING(50), allowNull: true },
        storage_location: { type: DataTypes.STRING(150), allowNull: true },
        quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        unit_uuid: { type: DataTypes.STRING(100), allowNull: true },
        unit_name: { type: DataTypes.STRING(100), allowNull: true },
        unit_cost: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        total_value: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        par_level: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        as_of_date: { type: DataTypes.DATE, allowNull: true }
    },
    "stock_level_key",
    [{ name: "idx_stocklevels_item", fields: ["item_uuid"] }]
);

export const PeckishStockTakeMaster = definePeckishModel(
    "PeckishStockTakeMaster",
    "peckish_stock_take_master",
    {
        stocktake_uuid: { type: DataTypes.STRING(100), allowNull: false },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        name: { type: DataTypes.STRING(255), allowNull: true },
        status: { type: DataTypes.STRING(50), allowNull: true },
        stocktake_date: { type: DataTypes.DATE, allowNull: true },
        started_at: { type: DataTypes.DATE, allowNull: true },
        completed_at: { type: DataTypes.DATE, allowNull: true },
        total_value: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        variance_value: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        counted_by: { type: DataTypes.STRING(150), allowNull: true },
        lines_json: { type: DataTypes.JSON, allowNull: true }
    },
    "stocktake_uuid",
    [{ name: "idx_stocktake_master_uuid", fields: ["stocktake_uuid"] }]
);

export const PeckishStockTakeDetail = definePeckishModel(
    "PeckishStockTakeDetail",
    "peckish_stock_take_details",
    {
        detail_key: { type: DataTypes.STRING(150), allowNull: false },
        stocktake_uuid: { type: DataTypes.STRING(100), allowNull: false },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        item_uuid: { type: DataTypes.STRING(100), allowNull: true },
        item_name: { type: DataTypes.STRING(255), allowNull: true },
        storage_location: { type: DataTypes.STRING(150), allowNull: true },
        expected_quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        counted_quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        variance_quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        unit_uuid: { type: DataTypes.STRING(100), allowNull: true },
        unit_cost: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        variance_value: { type: DataTypes.DECIMAL(18, 4), allowNull: true }
    },
    "detail_key",
    [
        { name: "idx_st_detail_master", fields: ["stocktake_uuid"] },
        { name: "idx_st_detail_item", fields: ["item_uuid"] }
    ]
);

