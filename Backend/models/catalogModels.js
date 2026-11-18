// models/catalogModels.js
import { DataTypes } from "sequelize";
import { definePeckishModel } from "./modelHelpers.js";

export const PeckishItem = definePeckishModel(
    "PeckishItem",
    "peckish_items",
    {
        item_uuid: { type: DataTypes.STRING(100), allowNull: false },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        name: { type: DataTypes.STRING(255), allowNull: true },
        sku: { type: DataTypes.STRING(100), allowNull: true },
        code: { type: DataTypes.STRING(100), allowNull: true },
        barcode: { type: DataTypes.STRING(100), allowNull: true },
        item_type: { type: DataTypes.STRING(50), allowNull: true },
        category: { type: DataTypes.STRING(150), allowNull: true },
        unit_uuid: { type: DataTypes.STRING(100), allowNull: true },
        unit_name: { type: DataTypes.STRING(100), allowNull: true },
        cost_price: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        selling_price: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        tax_rate: { type: DataTypes.DECIMAL(8, 4), allowNull: true },
        supplier_ref: { type: DataTypes.STRING(100), allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        api_created_at: { type: DataTypes.DATE, allowNull: true },
        api_updated_at: { type: DataTypes.DATE, allowNull: true }
    },
    "item_uuid",
    [
        { name: "idx_items_uuid", fields: ["item_uuid"] },
        { name: "idx_items_sku", fields: ["sku"] }
    ]
);

export const PeckishIngredient = definePeckishModel(
    "PeckishIngredient",
    "peckish_ingredients",
    {
        ingredient_uuid: { type: DataTypes.STRING(100), allowNull: false },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        name: { type: DataTypes.STRING(255), allowNull: true },
        sku: { type: DataTypes.STRING(100), allowNull: true },
        code: { type: DataTypes.STRING(100), allowNull: true },
        category: { type: DataTypes.STRING(150), allowNull: true },
        unit_uuid: { type: DataTypes.STRING(100), allowNull: true },
        unit_name: { type: DataTypes.STRING(100), allowNull: true },
        cost_price: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        par_level: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        yield_percentage: { type: DataTypes.DECIMAL(8, 4), allowNull: true },
        supplier_ref: { type: DataTypes.STRING(100), allowNull: true },
        allergens: { type: DataTypes.JSON, allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        api_created_at: { type: DataTypes.DATE, allowNull: true },
        api_updated_at: { type: DataTypes.DATE, allowNull: true }
    },
    "ingredient_uuid",
    [{ name: "idx_ingredients_uuid", fields: ["ingredient_uuid"] }]
);

export const PeckishPreparation = definePeckishModel(
    "PeckishPreparation",
    "peckish_preparations",
    {
        preparation_uuid: { type: DataTypes.STRING(100), allowNull: false },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        name: { type: DataTypes.STRING(255), allowNull: true },
        code: { type: DataTypes.STRING(100), allowNull: true },
        category: { type: DataTypes.STRING(150), allowNull: true },
        unit_uuid: { type: DataTypes.STRING(100), allowNull: true },
        unit_name: { type: DataTypes.STRING(100), allowNull: true },
        yield_quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        cost_price: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        recipe_components: { type: DataTypes.JSON, allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        api_created_at: { type: DataTypes.DATE, allowNull: true },
        api_updated_at: { type: DataTypes.DATE, allowNull: true }
    },
    "preparation_uuid",
    [{ name: "idx_preparations_uuid", fields: ["preparation_uuid"] }]
);

export const PeckishProduct = definePeckishModel(
    "PeckishProduct",
    "peckish_products",
    {
        product_uuid: { type: DataTypes.STRING(100), allowNull: false },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        name: { type: DataTypes.STRING(255), allowNull: true },
        sku: { type: DataTypes.STRING(100), allowNull: true },
        plu: { type: DataTypes.STRING(100), allowNull: true },
        pos_id: { type: DataTypes.STRING(100), allowNull: true },
        category: { type: DataTypes.STRING(150), allowNull: true },
        selling_price: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        cost_price: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        tax_rate: { type: DataTypes.DECIMAL(8, 4), allowNull: true },
        recipe_components: { type: DataTypes.JSON, allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        api_created_at: { type: DataTypes.DATE, allowNull: true },
        api_updated_at: { type: DataTypes.DATE, allowNull: true }
    },
    "product_uuid",
    [
        { name: "idx_products_uuid", fields: ["product_uuid"] },
        { name: "idx_products_plu", fields: ["plu"] }
    ]
);

