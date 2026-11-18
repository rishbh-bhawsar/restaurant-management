// services/iampeckishSqlService.js
import crypto from "crypto";
import {
    PeckishRestaurant,
    PeckishUnit,
    PeckishUnitConversion,
    PeckishSupplier,
    PeckishSupplierDetail,
    PeckishItem,
    PeckishIngredient,
    PeckishPreparation,
    PeckishProduct,
    PeckishPurchase,
    PeckishInvoice,
    PeckishStockLevel,
    PeckishStockTakeMaster,
    PeckishStockTakeDetail,
    PeckishWastage,
    PeckishStockTakeEvent,
    PeckishTransfer,
    PeckishSalesEvent,
    PeckishReceive,
    PeckishSyncLog
} from "../models/index.js";

/* ======================================================
   NORMALIZATION & SHARED UPSERT HELPERS
====================================================== */

const pick = (obj, keys, fallback = null) => {
    if (!obj || typeof obj !== "object") return fallback;
    for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
            return obj[k];
        }
    }
    return fallback;
};

const toStr = (val, maxLen = null) => {
    if (val === undefined || val === null) return null;
    const s = String(val).trim();
    return maxLen && s.length > maxLen ? s.slice(0, maxLen) : s;
};

const toNum = (val) => {
    if (val === undefined || val === null || val === "") return null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
};

const toDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
};

const toBool = (val, defaultVal = true) => {
    if (val === undefined || val === null) return defaultVal;
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val !== 0;
    const s = String(val).toLowerCase().trim();
    if (["false", "0", "no", "inactive", "disabled"].includes(s)) return false;
    if (["true", "1", "yes", "active", "enabled"].includes(s)) return true;
    return defaultVal;
};

const hashKey = (row, prefix = "row") => {
    const digest = crypto
        .createHash("sha256")
        .update(JSON.stringify(row))
        .digest("hex")
        .slice(0, 24);
    return `${prefix}_${digest}`;
};

const extractRestaurantUuid = (row) =>
    toStr(
        pick(row, ["restaurant_uuid", "restaurantUuid", "restaurant_id"]) ||
            row?.restaurant?.uuid ||
            row?.restaurant?.restaurant_uuid ||
            row?.restaurant?.id,
        100
    );

const extractUnitUuid = (row) =>
    toStr(
        pick(row, ["unit_uuid", "unitUuid", "unit_id"]) ||
            row?.unit?.uuid ||
            row?.unit?.id,
        100
    );

const extractUnitName = (row) =>
    toStr(
        pick(row, ["unit_name", "unitName"]) ||
            row?.unit?.name ||
            row?.unit?.symbol ||
            (typeof row?.unit === "string" ? row.unit : null),
        100
    );

const extractSupplierRef = (row) =>
    toStr(
        pick(row, ["supplier_ref", "supplierRef", "supplier_uuid", "supplier_id"]) ||
            row?.supplier?.ref ||
            row?.supplier?.uuid ||
            row?.supplier?.id,
        100
    );

const extractItemUuid = (row) =>
    toStr(
        pick(row, ["item_uuid", "itemUuid", "item_id"]) ||
            row?.item?.uuid ||
            row?.item?.id,
        100
    );

const extractItemName = (row) =>
    toStr(
        pick(row, ["item_name", "itemName"]) ||
            row?.item?.name ||
            row?.name,
        255
    );

/**
 * Shared bulk upsert executor using Sequelize updateOnDuplicate
 * + automatic sync audit logging to peckish_sync_logs.
 */
async function bulkUpsertRecords({
    model,
    records,
    uniqueKey,
    entityId,
    branchId,
    endpoint,
    mapper
}) {
    if (!Array.isArray(records) || records.length === 0) {
        return 0;
    }

    const safeEntityId = Number(entityId) || 0;
    const safeBranchId = Number(branchId) || 0;

    // Map & deduplicate in-batch by uniqueKey so MySQL ON DUPLICATE KEY UPDATE stays consistent
    const dedupMap = new Map();
    for (const row of records) {
        if (!row || typeof row !== "object") continue;
        const mapped = {
            entity_id: safeEntityId,
            branch_id: safeBranchId,
            ...mapper(row),
            raw_data: row
        };
        const keyVal = mapped[uniqueKey];
        if (keyVal) {
            dedupMap.set(keyVal, mapped);
        }
    }

    const payload = Array.from(dedupMap.values());
    if (payload.length === 0) {
        return 0;
    }

    // Update all model attributes except PK (id), created_at, and composite unique keys
    const excludedFromUpdate = new Set(["id", "created_at", "entity_id", "branch_id", uniqueKey]);
    const updateOnDuplicate = Object.keys(model.getAttributes()).filter(
        (col) => !excludedFromUpdate.has(col)
    );

    try {
        await model.bulkCreate(payload, { updateOnDuplicate });

        await PeckishSyncLog.create({
            entity_id: safeEntityId,
            branch_id: safeBranchId,
            endpoint,
            table_name: model.tableName,
            rows_received: records.length,
            rows_synced: payload.length,
            status: "SUCCESS"
        }).catch(() => {});

        return payload.length;
    } catch (err) {
        await PeckishSyncLog.create({
            entity_id: safeEntityId,
            branch_id: safeBranchId,
            endpoint,
            table_name: model.tableName,
            rows_received: records.length,
            rows_synced: 0,
            status: "FAILED",
            error_message: err.message
        }).catch(() => {});
        throw err;
    }
}

/* ======================================================
   1. CORE ENTITIES (RESTAURANTS, UNITS, SUPPLIERS)
====================================================== */

export const upsertPeckishRestaurants = async ({ restaurants, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishRestaurant,
        records: restaurants,
        uniqueKey: "restaurant_uuid",
        entityId,
        branchId,
        endpoint: "restaurants",
        mapper: (r) => ({
            restaurant_uuid: toStr(pick(r, ["restaurant_uuid", "uuid", "id"]), 100) || hashKey(r, "rest"),
            name: toStr(pick(r, ["name", "restaurant_name", "title"]), 255),
            legal_name: toStr(pick(r, ["legal_name", "legalName", "company_name"]), 255),
            code: toStr(pick(r, ["code", "ref", "reference"]), 100),
            currency: toStr(pick(r, ["currency", "currency_code"]), 20),
            timezone: toStr(pick(r, ["timezone", "time_zone"]), 100),
            email: toStr(pick(r, ["email", "contact_email"]), 255),
            phone: toStr(pick(r, ["phone", "telephone", "contact_phone"]), 50),
            address: toStr(pick(r, ["address", "street_address", "address_line_1"])),
            city: toStr(pick(r, ["city", "town"]), 100),
            state: toStr(pick(r, ["state", "region", "county"]), 100),
            postal_code: toStr(pick(r, ["postal_code", "postcode", "zip"]), 30),
            country: toStr(pick(r, ["country", "country_code"]), 100),
            status: toStr(pick(r, ["status"]), 50),
            is_active: toBool(pick(r, ["is_active", "active", "enabled"]), true),
            api_created_at: toDate(pick(r, ["created_at", "createdAt"])),
            api_updated_at: toDate(pick(r, ["updated_at", "updatedAt"]))
        })
    });
};

export const upsertPeckishUnits = async ({ units, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishUnit,
        records: units,
        uniqueKey: "unit_uuid",
        entityId,
        branchId,
        endpoint: "units",
        mapper: (u) => ({
            unit_uuid: toStr(pick(u, ["unit_uuid", "uuid", "id", "code", "name"]), 100) || hashKey(u, "unit"),
            restaurant_uuid: extractRestaurantUuid(u),
            name: toStr(pick(u, ["name", "unit_name", "label"]), 150),
            symbol: toStr(pick(u, ["symbol", "abbreviation", "short_name", "code"]), 50),
            type: toStr(pick(u, ["type", "unit_type", "dimension"]), 50),
            base_unit_uuid: toStr(pick(u, ["base_unit_uuid", "baseUnitUuid", "base_unit_id"]), 100),
            is_base: toBool(pick(u, ["is_base", "isBase"]), false),
            status: toStr(pick(u, ["status"]), 50)
        })
    });
};

export const upsertPeckishUnitConversions = async ({ conversions, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishUnitConversion,
        records: conversions,
        uniqueKey: "conversion_uuid",
        entityId,
        branchId,
        endpoint: "units/conversions",
        mapper: (c) => {
            const fromUuid = toStr(pick(c, ["from_unit_uuid", "fromUnitUuid", "source_unit_uuid", "from_unit_id"]) || c?.from_unit?.uuid, 100);
            const toUuid = toStr(pick(c, ["to_unit_uuid", "toUnitUuid", "target_unit_uuid", "to_unit_id"]) || c?.to_unit?.uuid, 100);
            const itemUuid = extractItemUuid(c);
            const fallbackKey = [fromUuid, toUuid, itemUuid].filter(Boolean).join("_");

            return {
                conversion_uuid: toStr(pick(c, ["conversion_uuid", "uuid", "id"]) || (fallbackKey || hashKey(c, "conv")), 150),
                restaurant_uuid: extractRestaurantUuid(c),
                from_unit_uuid: fromUuid,
                from_unit_name: toStr(pick(c, ["from_unit_name", "fromUnitName"]) || c?.from_unit?.name, 100),
                to_unit_uuid: toUuid,
                to_unit_name: toStr(pick(c, ["to_unit_name", "toUnitName"]) || c?.to_unit?.name, 100),
                factor: toNum(pick(c, ["factor", "conversion_factor", "multiplier", "ratio", "rate"])),
                item_uuid: itemUuid
            };
        }
    });
};

export const upsertPeckishSuppliers = async ({ suppliers, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishSupplier,
        records: suppliers,
        uniqueKey: "supplier_ref",
        entityId,
        branchId,
        endpoint: "suppliers",
        mapper: (s) => ({
            supplier_ref: toStr(pick(s, ["supplier_ref", "ref", "reference", "uuid", "id"]), 100) || hashKey(s, "sup"),
            supplier_uuid: toStr(pick(s, ["supplier_uuid", "uuid", "id"]), 100),
            restaurant_uuid: extractRestaurantUuid(s),
            name: toStr(pick(s, ["name", "supplier_name", "company_name"]), 255),
            code: toStr(pick(s, ["code", "supplier_code", "account_code"]), 100),
            email: toStr(pick(s, ["email", "contact_email"]), 255),
            phone: toStr(pick(s, ["phone", "telephone"]), 50),
            address: toStr(pick(s, ["address", "billing_address"])),
            currency: toStr(pick(s, ["currency"]), 20),
            payment_terms: toStr(pick(s, ["payment_terms", "terms"]), 100),
            is_active: toBool(pick(s, ["is_active", "active"]), true),
            api_created_at: toDate(pick(s, ["created_at", "createdAt"])),
            api_updated_at: toDate(pick(s, ["updated_at", "updatedAt"]))
        })
    });
};

export const upsertPeckishSuppliersDetails = async ({ suppliersDetails, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishSupplierDetail,
        records: suppliersDetails,
        uniqueKey: "supplier_ref",
        entityId,
        branchId,
        endpoint: "suppliers/:supplier_ref",
        mapper: (s) => ({
            supplier_ref: toStr(pick(s, ["supplier_ref", "ref", "reference", "uuid", "id"]), 100) || hashKey(s, "supd"),
            supplier_uuid: toStr(pick(s, ["supplier_uuid", "uuid", "id"]), 100),
            restaurant_uuid: extractRestaurantUuid(s),
            name: toStr(pick(s, ["name", "supplier_name", "company_name"]), 255),
            contact_name: toStr(pick(s, ["contact_name", "contactName", "primary_contact"]), 255),
            email: toStr(pick(s, ["email", "contact_email"]), 255),
            phone: toStr(pick(s, ["phone", "telephone"]), 50),
            tax_number: toStr(pick(s, ["tax_number", "vat_number", "ein"]), 100),
            account_number: toStr(pick(s, ["account_number", "account_code"]), 100),
            address: toStr(pick(s, ["address", "billing_address"])),
            catalogue_items: pick(s, ["items", "catalogue", "products", "catalogue_items"], null)
        })
    });
};

/* ======================================================
   2. CATALOG (ITEMS, INGREDIENTS, PREPARATIONS, PRODUCTS)
====================================================== */

export const upsertPeckishItems = async ({ items, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishItem,
        records: items,
        uniqueKey: "item_uuid",
        entityId,
        branchId,
        endpoint: "items/items",
        mapper: (item) => ({
            item_uuid: toStr(pick(item, ["item_uuid", "uuid", "id"]), 100) || hashKey(item, "item"),
            restaurant_uuid: extractRestaurantUuid(item),
            name: toStr(pick(item, ["name", "item_name", "title"]), 255),
            sku: toStr(pick(item, ["sku", "item_sku"]), 100),
            code: toStr(pick(item, ["code", "ref", "reference"]), 100),
            barcode: toStr(pick(item, ["barcode", "ean", "upc"]), 100),
            item_type: toStr(pick(item, ["item_type", "type"]), 50),
            category: toStr(pick(item, ["category", "category_name"]) || item?.category?.name, 150),
            unit_uuid: extractUnitUuid(item),
            unit_name: extractUnitName(item),
            cost_price: toNum(pick(item, ["cost_price", "cost", "unit_cost", "average_cost"])),
            selling_price: toNum(pick(item, ["selling_price", "price", "sale_price"])),
            tax_rate: toNum(pick(item, ["tax_rate", "vat_rate", "tax"])),
            supplier_ref: extractSupplierRef(item),
            is_active: toBool(pick(item, ["is_active", "active"]), true),
            api_created_at: toDate(pick(item, ["created_at", "createdAt"])),
            api_updated_at: toDate(pick(item, ["updated_at", "updatedAt"]))
        })
    });
};

export const upsertPeckishIngredients = async ({ ingredients, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishIngredient,
        records: ingredients,
        uniqueKey: "ingredient_uuid",
        entityId,
        branchId,
        endpoint: "items/ingredients",
        mapper: (ing) => ({
            ingredient_uuid: toStr(pick(ing, ["ingredient_uuid", "item_uuid", "uuid", "id"]), 100) || hashKey(ing, "ing"),
            restaurant_uuid: extractRestaurantUuid(ing),
            name: toStr(pick(ing, ["name", "ingredient_name"]), 255),
            sku: toStr(pick(ing, ["sku"]), 100),
            code: toStr(pick(ing, ["code", "ref"]), 100),
            category: toStr(pick(ing, ["category", "category_name"]) || ing?.category?.name, 150),
            unit_uuid: extractUnitUuid(ing),
            unit_name: extractUnitName(ing),
            cost_price: toNum(pick(ing, ["cost_price", "cost", "unit_cost", "average_cost"])),
            par_level: toNum(pick(ing, ["par_level", "par", "min_stock"])),
            yield_percentage: toNum(pick(ing, ["yield_percentage", "yield", "usable_percentage"])),
            supplier_ref: extractSupplierRef(ing),
            allergens: pick(ing, ["allergens", "allergen_list"], null),
            is_active: toBool(pick(ing, ["is_active", "active"]), true),
            api_created_at: toDate(pick(ing, ["created_at", "createdAt"])),
            api_updated_at: toDate(pick(ing, ["updated_at", "updatedAt"]))
        })
    });
};

export const upsertPeckishPreparations = async ({ preparations, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishPreparation,
        records: preparations,
        uniqueKey: "preparation_uuid",
        entityId,
        branchId,
        endpoint: "items/preparations",
        mapper: (prep) => ({
            preparation_uuid: toStr(pick(prep, ["preparation_uuid", "item_uuid", "uuid", "id"]), 100) || hashKey(prep, "prep"),
            restaurant_uuid: extractRestaurantUuid(prep),
            name: toStr(pick(prep, ["name", "preparation_name"]), 255),
            code: toStr(pick(prep, ["code", "ref"]), 100),
            category: toStr(pick(prep, ["category", "category_name"]) || prep?.category?.name, 150),
            unit_uuid: extractUnitUuid(prep),
            unit_name: extractUnitName(prep),
            yield_quantity: toNum(pick(prep, ["yield_quantity", "yield", "batch_size"])),
            cost_price: toNum(pick(prep, ["cost_price", "cost", "unit_cost", "batch_cost"])),
            recipe_components: pick(prep, ["ingredients", "components", "recipe", "items"], null),
            is_active: toBool(pick(prep, ["is_active", "active"]), true),
            api_created_at: toDate(pick(prep, ["created_at", "createdAt"])),
            api_updated_at: toDate(pick(prep, ["updated_at", "updatedAt"]))
        })
    });
};

export const upsertPeckishProducts = async ({ products, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishProduct,
        records: products,
        uniqueKey: "product_uuid",
        entityId,
        branchId,
        endpoint: "items/products",
        mapper: (prod) => ({
            product_uuid: toStr(pick(prod, ["product_uuid", "item_uuid", "uuid", "id"]), 100) || hashKey(prod, "prod"),
            restaurant_uuid: extractRestaurantUuid(prod),
            name: toStr(pick(prod, ["name", "product_name"]), 255),
            sku: toStr(pick(prod, ["sku"]), 100),
            plu: toStr(pick(prod, ["plu", "pos_plu"]), 100),
            pos_id: toStr(pick(prod, ["pos_id", "pos_ref", "external_id"]), 100),
            category: toStr(pick(prod, ["category", "category_name"]) || prod?.category?.name, 150),
            selling_price: toNum(pick(prod, ["selling_price", "price", "sale_price"])),
            cost_price: toNum(pick(prod, ["cost_price", "cost", "theoretical_cost"])),
            tax_rate: toNum(pick(prod, ["tax_rate", "vat_rate", "tax"])),
            recipe_components: pick(prod, ["ingredients", "components", "recipe", "items"], null),
            is_active: toBool(pick(prod, ["is_active", "active"]), true),
            api_created_at: toDate(pick(prod, ["created_at", "createdAt"])),
            api_updated_at: toDate(pick(prod, ["updated_at", "updatedAt"]))
        })
    });
};

/* ======================================================
   3. PURCHASES, INVOICES & STOCK
====================================================== */

export const upsertPeckishPurchases = async ({ purchases, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishPurchase,
        records: purchases,
        uniqueKey: "purchase_uuid",
        entityId,
        branchId,
        endpoint: "purchases",
        mapper: (p) => ({
            purchase_uuid: toStr(pick(p, ["purchase_uuid", "uuid", "id", "order_number"]), 100) || hashKey(p, "po"),
            restaurant_uuid: extractRestaurantUuid(p),
            order_number: toStr(pick(p, ["order_number", "po_number", "reference", "number"]), 100),
            supplier_ref: extractSupplierRef(p),
            supplier_name: toStr(pick(p, ["supplier_name"]) || p?.supplier?.name, 255),
            status: toStr(pick(p, ["status"]), 50),
            order_date: toDate(pick(p, ["order_date", "ordered_at", "date", "created_at"])),
            delivery_date: toDate(pick(p, ["delivery_date", "expected_at", "delivered_at"])),
            currency: toStr(pick(p, ["currency"]), 20),
            subtotal: toNum(pick(p, ["subtotal", "net_total", "sub_total"])),
            tax_amount: toNum(pick(p, ["tax_amount", "vat", "tax"])),
            total_amount: toNum(pick(p, ["total_amount", "total", "gross_total"])),
            items_json: pick(p, ["items", "lines", "order_lines", "products"], null),
            api_created_at: toDate(pick(p, ["created_at", "createdAt"])),
            api_updated_at: toDate(pick(p, ["updated_at", "updatedAt"]))
        })
    });
};

export const upsertPeckishInvoices = async ({ invoices, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishInvoice,
        records: invoices,
        uniqueKey: "invoice_uuid",
        entityId,
        branchId,
        endpoint: "invoices",
        mapper: (inv) => ({
            invoice_uuid: toStr(pick(inv, ["invoice_uuid", "uuid", "id", "invoice_number"]), 100) || hashKey(inv, "inv"),
            restaurant_uuid: extractRestaurantUuid(inv),
            invoice_number: toStr(pick(inv, ["invoice_number", "number", "reference"]), 100),
            purchase_uuid: toStr(pick(inv, ["purchase_uuid", "purchase_id", "po_uuid"]), 100),
            supplier_ref: extractSupplierRef(inv),
            supplier_name: toStr(pick(inv, ["supplier_name"]) || inv?.supplier?.name, 255),
            status: toStr(pick(inv, ["status"]), 50),
            invoice_date: toDate(pick(inv, ["invoice_date", "date", "issued_at", "created_at"])),
            due_date: toDate(pick(inv, ["due_date", "due_at"])),
            currency: toStr(pick(inv, ["currency"]), 20),
            subtotal: toNum(pick(inv, ["subtotal", "net_total", "sub_total"])),
            tax_amount: toNum(pick(inv, ["tax_amount", "vat", "tax"])),
            total_amount: toNum(pick(inv, ["total_amount", "total", "gross_total"])),
            items_json: pick(inv, ["items", "lines", "invoice_lines"], null),
            api_created_at: toDate(pick(inv, ["created_at", "createdAt"])),
            api_updated_at: toDate(pick(inv, ["updated_at", "updatedAt"]))
        })
    });
};

export const upsertPeckishStockLevelMaster = async ({ stockLevels, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishStockLevel,
        records: stockLevels,
        uniqueKey: "stock_level_key",
        entityId,
        branchId,
        endpoint: "stocklevels",
        mapper: (sl) => {
            const restUuid = extractRestaurantUuid(sl);
            const itemUuid = extractItemUuid(sl);
            const storage = toStr(pick(sl, ["storage_location", "storage_uuid", "location", "area"]) || sl?.storage?.name, 150);
            const fallbackKey = [restUuid, itemUuid, storage].filter(Boolean).join("_");

            return {
                stock_level_key: toStr(pick(sl, ["uuid", "id", "stock_level_uuid"]) || (fallbackKey || hashKey(sl, "sl")), 150),
                restaurant_uuid: restUuid,
                item_uuid: itemUuid,
                item_name: extractItemName(sl),
                item_type: toStr(pick(sl, ["item_type", "type"]), 50),
                storage_location: storage,
                quantity: toNum(pick(sl, ["quantity", "stock_level", "current_stock", "on_hand", "qty"])),
                unit_uuid: extractUnitUuid(sl),
                unit_name: extractUnitName(sl),
                unit_cost: toNum(pick(sl, ["unit_cost", "cost_price", "cost"])),
                total_value: toNum(pick(sl, ["total_value", "stock_value", "value"])),
                par_level: toNum(pick(sl, ["par_level", "par"])),
                as_of_date: toDate(pick(sl, ["as_of_date", "updated_at", "timestamp"]))
            };
        }
    });
};

export const upsertPeckishStockTakeMaster = async ({ stocktakes, entityId, branchId } = {}) => {
    const synced = await bulkUpsertRecords({
        model: PeckishStockTakeMaster,
        records: stocktakes,
        uniqueKey: "stocktake_uuid",
        entityId,
        branchId,
        endpoint: "stocktakes",
        mapper: (st) => ({
            stocktake_uuid: toStr(pick(st, ["stocktake_uuid", "uuid", "id"]), 100) || hashKey(st, "st"),
            restaurant_uuid: extractRestaurantUuid(st),
            name: toStr(pick(st, ["name", "title", "reference"]), 255),
            status: toStr(pick(st, ["status"]), 50),
            stocktake_date: toDate(pick(st, ["stocktake_date", "date", "created_at"])),
            started_at: toDate(pick(st, ["started_at", "start_date"])),
            completed_at: toDate(pick(st, ["completed_at", "end_date", "closed_at"])),
            total_value: toNum(pick(st, ["total_value", "counted_value", "value"])),
            variance_value: toNum(pick(st, ["variance_value", "variance_cost", "variance"])),
            counted_by: toStr(pick(st, ["counted_by", "user_name", "created_by"]) || st?.user?.name, 150),
            lines_json: pick(st, ["lines", "items", "entries", "counts"], null)
        })
    });

    // If any stocktake objects include nested line items, persist them to peckish_stock_take_details
    if (Array.isArray(stocktakes)) {
        const detailRows = [];
        for (const st of stocktakes) {
            const stUuid = toStr(pick(st, ["stocktake_uuid", "uuid", "id"]), 100);
            const restUuid = extractRestaurantUuid(st);
            const lines = pick(st, ["lines", "items", "entries", "counts"], null);
            if (stUuid && Array.isArray(lines)) {
                for (const line of lines) {
                    detailRows.push({ ...line, stocktake_uuid: stUuid, restaurant_uuid: restUuid });
                }
            }
        }
        if (detailRows.length > 0) {
            await upsertPeckishStockTakeDetails({ details: detailRows, entityId, branchId });
        }
    }

    return synced;
};

export const upsertPeckishStockTakeDetails = async ({ details, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishStockTakeDetail,
        records: details,
        uniqueKey: "detail_key",
        entityId,
        branchId,
        endpoint: "stocktakes/details",
        mapper: (d) => {
            const stUuid = toStr(pick(d, ["stocktake_uuid"]), 100) || "unknown";
            const itemUuid = extractItemUuid(d);
            const storage = toStr(pick(d, ["storage_location", "location", "storage_uuid"]), 150);
            const fallbackKey = [stUuid, itemUuid, storage].filter(Boolean).join("_");

            return {
                detail_key: toStr(pick(d, ["uuid", "id", "detail_uuid"]) || (fallbackKey || hashKey(d, "std")), 150),
                stocktake_uuid: stUuid,
                restaurant_uuid: extractRestaurantUuid(d),
                item_uuid: itemUuid,
                item_name: extractItemName(d),
                storage_location: storage,
                expected_quantity: toNum(pick(d, ["expected_quantity", "theoretical_quantity", "system_qty"])),
                counted_quantity: toNum(pick(d, ["counted_quantity", "actual_quantity", "quantity"])),
                variance_quantity: toNum(pick(d, ["variance_quantity", "variance"])),
                unit_uuid: extractUnitUuid(d),
                unit_cost: toNum(pick(d, ["unit_cost", "cost_price"])),
                variance_value: toNum(pick(d, ["variance_value", "cost_variance"]))
            };
        }
    });
};

/* ======================================================
   4. EVENTS (WASTAGE, STOCKTAKES, TRANSFERS, SALES, RECEIVES)
====================================================== */

export const upsertPeckishWastage = async ({ wastage, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishWastage,
        records: wastage,
        uniqueKey: "event_uuid",
        entityId,
        branchId,
        endpoint: "events/wastes",
        mapper: (w) => ({
            event_uuid: toStr(pick(w, ["event_uuid", "waste_uuid", "uuid", "id"]), 100) || hashKey(w, "waste"),
            restaurant_uuid: extractRestaurantUuid(w),
            item_uuid: extractItemUuid(w),
            item_name: extractItemName(w),
            quantity: toNum(pick(w, ["quantity", "qty", "amount"])),
            unit_uuid: extractUnitUuid(w),
            unit_name: extractUnitName(w),
            cost_value: toNum(pick(w, ["cost_value", "cost", "value", "total_cost"])),
            reason: toStr(pick(w, ["reason", "waste_reason", "category"]), 255),
            notes: toStr(pick(w, ["notes", "comment", "description"])),
            event_date: toDate(pick(w, ["event_date", "date", "timestamp", "occurred_at", "created_at"])),
            recorded_by: toStr(pick(w, ["recorded_by", "user_name", "created_by"]) || w?.user?.name, 150)
        })
    });
};

export const upsertPeckishStockTakes = async ({ stocktakes, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishStockTakeEvent,
        records: stocktakes,
        uniqueKey: "event_uuid",
        entityId,
        branchId,
        endpoint: "events/stocktakes",
        mapper: (st) => ({
            event_uuid: toStr(pick(st, ["event_uuid", "uuid", "id"]), 100) || hashKey(st, "stev"),
            stocktake_uuid: toStr(pick(st, ["stocktake_uuid", "stocktake_id"]), 100),
            restaurant_uuid: extractRestaurantUuid(st),
            item_uuid: extractItemUuid(st),
            item_name: extractItemName(st),
            expected_quantity: toNum(pick(st, ["expected_quantity", "theoretical_quantity"])),
            counted_quantity: toNum(pick(st, ["counted_quantity", "quantity", "actual_quantity"])),
            variance_quantity: toNum(pick(st, ["variance_quantity", "variance"])),
            unit_uuid: extractUnitUuid(st),
            cost_variance: toNum(pick(st, ["cost_variance", "variance_value", "value"])),
            event_date: toDate(pick(st, ["event_date", "date", "timestamp", "occurred_at", "created_at"]))
        })
    });
};

export const upsertPeckishTransfers = async ({ transfers, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishTransfer,
        records: transfers,
        uniqueKey: "event_uuid",
        entityId,
        branchId,
        endpoint: "events/transfers",
        mapper: (t) => ({
            event_uuid: toStr(pick(t, ["event_uuid", "transfer_uuid", "uuid", "id"]), 100) || hashKey(t, "trf"),
            restaurant_uuid: extractRestaurantUuid(t),
            from_restaurant_uuid: toStr(pick(t, ["from_restaurant_uuid", "source_restaurant_uuid", "from_location"]), 100),
            to_restaurant_uuid: toStr(pick(t, ["to_restaurant_uuid", "destination_restaurant_uuid", "to_location"]), 100),
            item_uuid: extractItemUuid(t),
            item_name: extractItemName(t),
            quantity: toNum(pick(t, ["quantity", "qty"])),
            unit_uuid: extractUnitUuid(t),
            unit_name: extractUnitName(t),
            cost_value: toNum(pick(t, ["cost_value", "cost", "total_cost", "value"])),
            status: toStr(pick(t, ["status"]), 50),
            event_date: toDate(pick(t, ["event_date", "transfer_date", "date", "timestamp", "created_at"]))
        })
    });
};

export const upsertPeckishSalesEvents = async ({ sales, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishSalesEvent,
        records: sales,
        uniqueKey: "event_uuid",
        entityId,
        branchId,
        endpoint: "events/sales",
        mapper: (s) => ({
            event_uuid: toStr(pick(s, ["event_uuid", "sale_uuid", "uuid", "id"]), 100) || hashKey(s, "sale"),
            restaurant_uuid: extractRestaurantUuid(s),
            product_uuid: toStr(pick(s, ["product_uuid", "product_id"]) || s?.product?.uuid, 100),
            item_uuid: extractItemUuid(s),
            product_name: toStr(pick(s, ["product_name", "item_name", "name"]) || s?.product?.name, 255),
            pos_ref: toStr(pick(s, ["pos_ref", "plu", "order_id", "receipt_id"]), 100),
            quantity: toNum(pick(s, ["quantity", "qty"])),
            gross_amount: toNum(pick(s, ["gross_amount", "gross_sales", "total_amount", "amount"])),
            net_amount: toNum(pick(s, ["net_amount", "net_sales", "subtotal"])),
            tax_amount: toNum(pick(s, ["tax_amount", "vat", "tax"])),
            discount_amount: toNum(pick(s, ["discount_amount", "discount"])),
            currency: toStr(pick(s, ["currency"]), 20),
            event_date: toDate(pick(s, ["event_date", "sale_date", "date", "timestamp", "occurred_at", "created_at"]))
        })
    });
};

export const upsertPeckishReceives = async ({ receives, entityId, branchId } = {}) => {
    return bulkUpsertRecords({
        model: PeckishReceive,
        records: receives,
        uniqueKey: "event_uuid",
        entityId,
        branchId,
        endpoint: "events/receives",
        mapper: (r) => ({
            event_uuid: toStr(pick(r, ["event_uuid", "receive_uuid", "uuid", "id"]), 100) || hashKey(r, "rcv"),
            restaurant_uuid: extractRestaurantUuid(r),
            purchase_uuid: toStr(pick(r, ["purchase_uuid", "po_uuid", "purchase_id"]), 100),
            invoice_uuid: toStr(pick(r, ["invoice_uuid", "invoice_id"]), 100),
            supplier_ref: extractSupplierRef(r),
            item_uuid: extractItemUuid(r),
            item_name: extractItemName(r),
            quantity: toNum(pick(r, ["quantity", "qty", "received_quantity"])),
            unit_uuid: extractUnitUuid(r),
            unit_cost: toNum(pick(r, ["unit_cost", "cost_price", "price"])),
            total_cost: toNum(pick(r, ["total_cost", "total_amount", "cost", "value"])),
            event_date: toDate(pick(r, ["event_date", "received_at", "date", "timestamp", "created_at"]))
        })
    });
};
