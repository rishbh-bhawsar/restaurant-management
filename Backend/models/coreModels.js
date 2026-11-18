// models/coreModels.js
import { DataTypes } from "sequelize";
import { definePeckishModel } from "./modelHelpers.js";

export const PeckishRestaurant = definePeckishModel(
    "PeckishRestaurant",
    "peckish_restaurants",
    {
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: true },
        currency: { type: DataTypes.STRING(20), allowNull: true },
        email: { type: DataTypes.STRING(255), allowNull: true },
        phone: { type: DataTypes.STRING(50), allowNull: true },
        address: { type: DataTypes.TEXT, allowNull: true },
        city: { type: DataTypes.STRING(100), allowNull: true },
        state: { type: DataTypes.STRING(100), allowNull: true },
        postal_code: { type: DataTypes.STRING(30), allowNull: true },
        country: { type: DataTypes.STRING(100), allowNull: true },
        status: { type: DataTypes.STRING(50), allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    "restaurant_uuid",
    [{ name: "idx_restaurants_uuid", fields: ["restaurant_uuid"] }]
);

export const PeckishUnit = definePeckishModel(
    "PeckishUnit",
    "peckish_units",
    {
        unit_uuid: { type: DataTypes.STRING(100), allowNull: false },
        name: { type: DataTypes.STRING(150), allowNull: true },
    },
    "unit_uuid",
    [{ name: "idx_units_uuid", fields: ["unit_uuid"] }]
);

export const PeckishUnitConversion = definePeckishModel(
    "PeckishUnitConversion",
    "peckish_unit_conversions",
    {
        conversion_uuid: { type: DataTypes.STRING(150), allowNull: false },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        from_unit_uuid: { type: DataTypes.STRING(100), allowNull: true },
        from_unit_name: { type: DataTypes.STRING(100), allowNull: true },
        to_unit_uuid: { type: DataTypes.STRING(100), allowNull: true },
        to_unit_name: { type: DataTypes.STRING(100), allowNull: true },
        factor: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
        item_uuid: { type: DataTypes.STRING(100), allowNull: true }
    },
    "conversion_uuid",
    [
        { name: "idx_conv_from_to", fields: ["from_unit_uuid", "to_unit_uuid"] }
    ]
);

export const PeckishSupplier = definePeckishModel(
    "PeckishSupplier",
    "peckish_suppliers",
    {
        supplier_ref: { type: DataTypes.STRING(100), allowNull: false },
        supplier_uuid: { type: DataTypes.STRING(100), allowNull: true },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        name: { type: DataTypes.STRING(255), allowNull: true },
        code: { type: DataTypes.STRING(100), allowNull: true },
        email: { type: DataTypes.STRING(255), allowNull: true },
        phone: { type: DataTypes.STRING(50), allowNull: true },
        address: { type: DataTypes.TEXT, allowNull: true },
        currency: { type: DataTypes.STRING(20), allowNull: true },
        payment_terms: { type: DataTypes.STRING(100), allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        api_created_at: { type: DataTypes.DATE, allowNull: true },
        api_updated_at: { type: DataTypes.DATE, allowNull: true }
    },
    "supplier_ref",
    [{ name: "idx_suppliers_ref", fields: ["supplier_ref"] }]
);

export const PeckishSupplierDetail = definePeckishModel(
    "PeckishSupplierDetail",
    "peckish_suppliers_details",
    {
        supplier_ref: { type: DataTypes.STRING(100), allowNull: false },
        supplier_uuid: { type: DataTypes.STRING(100), allowNull: true },
        restaurant_uuid: { type: DataTypes.STRING(100), allowNull: true },
        name: { type: DataTypes.STRING(255), allowNull: true },
        contact_name: { type: DataTypes.STRING(255), allowNull: true },
        email: { type: DataTypes.STRING(255), allowNull: true },
        phone: { type: DataTypes.STRING(50), allowNull: true },
        tax_number: { type: DataTypes.STRING(100), allowNull: true },
        account_number: { type: DataTypes.STRING(100), allowNull: true },
        address: { type: DataTypes.TEXT, allowNull: true },
        catalogue_items: { type: DataTypes.JSON, allowNull: true }
    },
    "supplier_ref",
    [{ name: "idx_sup_details_ref", fields: ["supplier_ref"] }]
);

