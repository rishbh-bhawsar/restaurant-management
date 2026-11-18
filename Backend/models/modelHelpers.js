// models/modelHelpers.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Factory helper to define standardized IAmPeckish Sequelize models
 * with multi-tenant keys (entity_id, branch_id), raw_data JSON preservation,
 * and composite unique upsert keys.
 *
 * @param {string} modelName - Sequelize model name
 * @param {string} tableName - MySQL table name
 * @param {Object} attributes - Entity-specific column definitions
 * @param {string} uniqueKeyField - Column name forming the unique key with (entity_id, branch_id)
 * @param {Array} [extraIndexes=[]] - Additional Sequelize index definitions
 */
export function definePeckishModel(
    modelName,
    tableName,
    attributes,
    uniqueKeyField,
    extraIndexes = []
) {
    const indexes = [
        {
            name: `idx_${tableName}_tenant`,
            fields: ["entity_id", "branch_id"]
        }
    ];

    if (uniqueKeyField) {
        indexes.push({
            name: `uq_${tableName}`,
            unique: true,
            fields: ["entity_id", "branch_id", uniqueKeyField]
        });
    }

    const fullAttributes = {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        entity_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        branch_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        ...attributes,
        // raw_data: {
        //     type: DataTypes.JSON,
        //     allowNull: true,
        //     comment: "Full raw JSON object returned by IAmPeckish API"
        // }
    };

    return sequelize.define(modelName, fullAttributes, {
        tableName,
        timestamps: true,
        underscored: true,
        indexes: [...indexes, ...extraIndexes]
    });
}

