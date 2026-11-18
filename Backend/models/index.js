// models/index.js
import sequelize, { connectDB } from "../config/db.js";
import {
    PeckishRestaurant,
    PeckishUnit,
    PeckishUnitConversion,
    PeckishSupplier,
    PeckishSupplierDetail
} from "./coreModels.js";
import {
    PeckishItem,
    PeckishIngredient,
    PeckishPreparation,
    PeckishProduct
} from "./catalogModels.js";
import {
    PeckishPurchase,
    PeckishInvoice,
    PeckishStockLevel,
    PeckishStockTakeMaster,
    PeckishStockTakeDetail
} from "./inventoryModels.js";
import {
    PeckishWastage,
    PeckishStockTakeEvent,
    PeckishTransfer,
    PeckishSalesEvent,
    PeckishReceive,
    PeckishSyncLog
} from "./eventModels.js";

// Soft associations (constraints: false allows syncing any endpoint in any order)
PeckishStockTakeMaster.hasMany(PeckishStockTakeDetail, {
    foreignKey: "stocktake_uuid",
    sourceKey: "stocktake_uuid",
    as: "details",
    constraints: false
});
PeckishStockTakeDetail.belongsTo(PeckishStockTakeMaster, {
    foreignKey: "stocktake_uuid",
    targetKey: "stocktake_uuid",
    as: "master",
    constraints: false
});

PeckishSupplier.hasOne(PeckishSupplierDetail, {
    foreignKey: "supplier_ref",
    sourceKey: "supplier_ref",
    as: "detail",
    constraints: false
});
PeckishSupplierDetail.belongsTo(PeckishSupplier, {
    foreignKey: "supplier_ref",
    targetKey: "supplier_ref",
    as: "supplier",
    constraints: false
});

export {
    sequelize,
    connectDB,
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
};

export default {
    sequelize,
    connectDB,
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
};

