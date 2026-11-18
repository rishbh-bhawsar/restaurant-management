-- ============================================================================
-- RestoFlow POS - MySQL Database Schema for IAmPeckish API Integration
-- Database: restoflow_pos
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB 10.3+
-- Note: Sequelize connectDB() also auto-creates/syncs these exact tables.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `restoflow_pos`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `restoflow_pos`;

-- ----------------------------------------------------------------------------
-- 1. Restaurants
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_restaurants` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `restaurant_uuid` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NULL,
  `code` VARCHAR(100) NULL,
  `currency` VARCHAR(20) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `address` TEXT NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(100) NULL,
  `postal_code` VARCHAR(30) NULL,
  `country` VARCHAR(100) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_restaurants` (`entity_id`, `branch_id`, `restaurant_uuid`),
  KEY `idx_peckish_restaurants_tenant` (`entity_id`, `branch_id`),
  KEY `idx_restaurants_uuid` (`restaurant_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Units
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_units` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `unit_uuid` VARCHAR(100) NOT NULL,
  `name` VARCHAR(150) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_units` (`entity_id`, `branch_id`, `unit_uuid`),
  KEY `idx_peckish_units_tenant` (`entity_id`, `branch_id`),
  KEY `idx_units_uuid` (`unit_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Unit Conversions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_unit_conversions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `conversion_uuid` VARCHAR(150) NOT NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `from_unit_uuid` VARCHAR(100) NULL,
  `from_unit_name` VARCHAR(100) NULL,
  `to_unit_uuid` VARCHAR(100) NULL,
  `to_unit_name` VARCHAR(100) NULL,
  `factor` DECIMAL(18,6) NULL,
  `item_uuid` VARCHAR(100) NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_unit_conversions` (`entity_id`, `branch_id`, `conversion_uuid`),
  KEY `idx_peckish_unit_conversions_tenant` (`entity_id`, `branch_id`),
  KEY `idx_conv_from_to` (`from_unit_uuid`, `to_unit_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. Suppliers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_suppliers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `supplier_ref` VARCHAR(100) NOT NULL,
  `supplier_uuid` VARCHAR(100) NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `name` VARCHAR(255) NULL,
  `code` VARCHAR(100) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `address` TEXT NULL,
  `currency` VARCHAR(20) NULL,
  `payment_terms` VARCHAR(100) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `api_created_at` DATETIME NULL,
  `api_updated_at` DATETIME NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_suppliers` (`entity_id`, `branch_id`, `supplier_ref`),
  KEY `idx_peckish_suppliers_tenant` (`entity_id`, `branch_id`),
  KEY `idx_suppliers_ref` (`supplier_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Suppliers Details
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_suppliers_details` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `supplier_ref` VARCHAR(100) NOT NULL,
  `supplier_uuid` VARCHAR(100) NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `name` VARCHAR(255) NULL,
  `contact_name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `tax_number` VARCHAR(100) NULL,
  `account_number` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `catalogue_items` JSON NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_suppliers_details` (`entity_id`, `branch_id`, `supplier_ref`),
  KEY `idx_peckish_suppliers_details_tenant` (`entity_id`, `branch_id`),
  KEY `idx_sup_details_ref` (`supplier_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `item_uuid` VARCHAR(100) NOT NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `name` VARCHAR(255) NULL,
  `sku` VARCHAR(100) NULL,
  `code` VARCHAR(100) NULL,
  `barcode` VARCHAR(100) NULL,
  `item_type` VARCHAR(50) NULL,
  `category` VARCHAR(150) NULL,
  `unit_uuid` VARCHAR(100) NULL,
  `unit_name` VARCHAR(100) NULL,
  `cost_price` DECIMAL(18,4) NULL,
  `selling_price` DECIMAL(18,4) NULL,
  `tax_rate` DECIMAL(8,4) NULL,
  `supplier_ref` VARCHAR(100) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `api_created_at` DATETIME NULL,
  `api_updated_at` DATETIME NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_items` (`entity_id`, `branch_id`, `item_uuid`),
  KEY `idx_peckish_items_tenant` (`entity_id`, `branch_id`),
  KEY `idx_items_uuid` (`item_uuid`),
  KEY `idx_items_sku` (`sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. Ingredients
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_ingredients` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `ingredient_uuid` VARCHAR(100) NOT NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `name` VARCHAR(255) NULL,
  `sku` VARCHAR(100) NULL,
  `code` VARCHAR(100) NULL,
  `category` VARCHAR(150) NULL,
  `unit_uuid` VARCHAR(100) NULL,
  `unit_name` VARCHAR(100) NULL,
  `cost_price` DECIMAL(18,4) NULL,
  `par_level` DECIMAL(18,4) NULL,
  `yield_percentage` DECIMAL(8,4) NULL,
  `supplier_ref` VARCHAR(100) NULL,
  `allergens` JSON NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `api_created_at` DATETIME NULL,
  `api_updated_at` DATETIME NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_ingredients` (`entity_id`, `branch_id`, `ingredient_uuid`),
  KEY `idx_peckish_ingredients_tenant` (`entity_id`, `branch_id`),
  KEY `idx_ingredients_uuid` (`ingredient_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. Preparations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_preparations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `preparation_uuid` VARCHAR(100) NOT NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `name` VARCHAR(255) NULL,
  `code` VARCHAR(100) NULL,
  `category` VARCHAR(150) NULL,
  `unit_uuid` VARCHAR(100) NULL,
  `unit_name` VARCHAR(100) NULL,
  `yield_quantity` DECIMAL(18,4) NULL,
  `cost_price` DECIMAL(18,4) NULL,
  `recipe_components` JSON NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `api_created_at` DATETIME NULL,
  `api_updated_at` DATETIME NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_preparations` (`entity_id`, `branch_id`, `preparation_uuid`),
  KEY `idx_peckish_preparations_tenant` (`entity_id`, `branch_id`),
  KEY `idx_preparations_uuid` (`preparation_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. Products
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `product_uuid` VARCHAR(100) NOT NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `name` VARCHAR(255) NULL,
  `sku` VARCHAR(100) NULL,
  `plu` VARCHAR(100) NULL,
  `pos_id` VARCHAR(100) NULL,
  `category` VARCHAR(150) NULL,
  `selling_price` DECIMAL(18,4) NULL,
  `cost_price` DECIMAL(18,4) NULL,
  `tax_rate` DECIMAL(8,4) NULL,
  `recipe_components` JSON NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `api_created_at` DATETIME NULL,
  `api_updated_at` DATETIME NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_products` (`entity_id`, `branch_id`, `product_uuid`),
  KEY `idx_peckish_products_tenant` (`entity_id`, `branch_id`),
  KEY `idx_products_uuid` (`product_uuid`),
  KEY `idx_products_plu` (`plu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. Purchases
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_purchases` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `purchase_uuid` VARCHAR(100) NOT NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `order_number` VARCHAR(100) NULL,
  `supplier_ref` VARCHAR(100) NULL,
  `supplier_name` VARCHAR(255) NULL,
  `status` VARCHAR(50) NULL,
  `order_date` DATETIME NULL,
  `delivery_date` DATETIME NULL,
  `currency` VARCHAR(20) NULL,
  `subtotal` DECIMAL(18,4) NULL,
  `tax_amount` DECIMAL(18,4) NULL,
  `total_amount` DECIMAL(18,4) NULL,
  `items_json` JSON NULL,
  `api_created_at` DATETIME NULL,
  `api_updated_at` DATETIME NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_purchases` (`entity_id`, `branch_id`, `purchase_uuid`),
  KEY `idx_peckish_purchases_tenant` (`entity_id`, `branch_id`),
  KEY `idx_purchases_uuid` (`purchase_uuid`),
  KEY `idx_purchases_supplier` (`supplier_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. Invoices
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_invoices` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `invoice_uuid` VARCHAR(100) NOT NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `invoice_number` VARCHAR(100) NULL,
  `purchase_uuid` VARCHAR(100) NULL,
  `supplier_ref` VARCHAR(100) NULL,
  `supplier_name` VARCHAR(255) NULL,
  `status` VARCHAR(50) NULL,
  `invoice_date` DATETIME NULL,
  `due_date` DATETIME NULL,
  `currency` VARCHAR(20) NULL,
  `subtotal` DECIMAL(18,4) NULL,
  `tax_amount` DECIMAL(18,4) NULL,
  `total_amount` DECIMAL(18,4) NULL,
  `items_json` JSON NULL,
  `api_created_at` DATETIME NULL,
  `api_updated_at` DATETIME NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_invoices` (`entity_id`, `branch_id`, `invoice_uuid`),
  KEY `idx_peckish_invoices_tenant` (`entity_id`, `branch_id`),
  KEY `idx_invoices_uuid` (`invoice_uuid`),
  KEY `idx_invoices_supplier` (`supplier_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. Stock Levels
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_stock_levels` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `stock_level_key` VARCHAR(150) NOT NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `item_uuid` VARCHAR(100) NULL,
  `item_name` VARCHAR(255) NULL,
  `item_type` VARCHAR(50) NULL,
  `storage_location` VARCHAR(150) NULL,
  `quantity` DECIMAL(18,4) NULL,
  `unit_uuid` VARCHAR(100) NULL,
  `unit_name` VARCHAR(100) NULL,
  `unit_cost` DECIMAL(18,4) NULL,
  `total_value` DECIMAL(18,4) NULL,
  `par_level` DECIMAL(18,4) NULL,
  `as_of_date` DATETIME NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_stock_levels` (`entity_id`, `branch_id`, `stock_level_key`),
  KEY `idx_peckish_stock_levels_tenant` (`entity_id`, `branch_id`),
  KEY `idx_stocklevels_item` (`item_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. Stock Take Master
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_stock_take_master` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `stocktake_uuid` VARCHAR(100) NOT NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `name` VARCHAR(255) NULL,
  `status` VARCHAR(50) NULL,
  `stocktake_date` DATETIME NULL,
  `started_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  `total_value` DECIMAL(18,4) NULL,
  `variance_value` DECIMAL(18,4) NULL,
  `counted_by` VARCHAR(150) NULL,
  `lines_json` JSON NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_stock_take_master` (`entity_id`, `branch_id`, `stocktake_uuid`),
  KEY `idx_peckish_stock_take_master_tenant` (`entity_id`, `branch_id`),
  KEY `idx_stocktake_master_uuid` (`stocktake_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. Stock Take Details (Line Items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_stock_take_details` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `detail_key` VARCHAR(150) NOT NULL,
  `stocktake_uuid` VARCHAR(100) NOT NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `item_uuid` VARCHAR(100) NULL,
  `item_name` VARCHAR(255) NULL,
  `storage_location` VARCHAR(150) NULL,
  `expected_quantity` DECIMAL(18,4) NULL,
  `counted_quantity` DECIMAL(18,4) NULL,
  `variance_quantity` DECIMAL(18,4) NULL,
  `unit_uuid` VARCHAR(100) NULL,
  `unit_cost` DECIMAL(18,4) NULL,
  `variance_value` DECIMAL(18,4) NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_stock_take_details` (`entity_id`, `branch_id`, `detail_key`),
  KEY `idx_peckish_stock_take_details_tenant` (`entity_id`, `branch_id`),
  KEY `idx_st_detail_master` (`stocktake_uuid`),
  KEY `idx_st_detail_item` (`item_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. Wastage Events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_wastage` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `event_uuid` VARCHAR(100) NOT NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `item_uuid` VARCHAR(100) NULL,
  `item_name` VARCHAR(255) NULL,
  `quantity` DECIMAL(18,4) NULL,
  `unit_uuid` VARCHAR(100) NULL,
  `unit_name` VARCHAR(100) NULL,
  `cost_value` DECIMAL(18,4) NULL,
  `reason` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `event_date` DATETIME NULL,
  `recorded_by` VARCHAR(150) NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_wastage` (`entity_id`, `branch_id`, `event_uuid`),
  KEY `idx_peckish_wastage_tenant` (`entity_id`, `branch_id`),
  KEY `idx_wastage_date` (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. Stock Takes Events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_stock_takes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `event_uuid` VARCHAR(100) NOT NULL,
  `stocktake_uuid` VARCHAR(100) NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `item_uuid` VARCHAR(100) NULL,
  `item_name` VARCHAR(255) NULL,
  `expected_quantity` DECIMAL(18,4) NULL,
  `counted_quantity` DECIMAL(18,4) NULL,
  `variance_quantity` DECIMAL(18,4) NULL,
  `unit_uuid` VARCHAR(100) NULL,
  `cost_variance` DECIMAL(18,4) NULL,
  `event_date` DATETIME NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_stock_takes` (`entity_id`, `branch_id`, `event_uuid`),
  KEY `idx_peckish_stock_takes_tenant` (`entity_id`, `branch_id`),
  KEY `idx_st_event_date` (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 17. Transfers Events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_transfers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `event_uuid` VARCHAR(100) NOT NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `from_restaurant_uuid` VARCHAR(100) NULL,
  `to_restaurant_uuid` VARCHAR(100) NULL,
  `item_uuid` VARCHAR(100) NULL,
  `item_name` VARCHAR(255) NULL,
  `quantity` DECIMAL(18,4) NULL,
  `unit_uuid` VARCHAR(100) NULL,
  `unit_name` VARCHAR(100) NULL,
  `cost_value` DECIMAL(18,4) NULL,
  `status` VARCHAR(50) NULL,
  `event_date` DATETIME NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_transfers` (`entity_id`, `branch_id`, `event_uuid`),
  KEY `idx_peckish_transfers_tenant` (`entity_id`, `branch_id`),
  KEY `idx_transfer_date` (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 18. Sales Events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_sales_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `event_uuid` VARCHAR(100) NOT NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `product_uuid` VARCHAR(100) NULL,
  `item_uuid` VARCHAR(100) NULL,
  `product_name` VARCHAR(255) NULL,
  `pos_ref` VARCHAR(100) NULL,
  `quantity` DECIMAL(18,4) NULL,
  `gross_amount` DECIMAL(18,4) NULL,
  `net_amount` DECIMAL(18,4) NULL,
  `tax_amount` DECIMAL(18,4) NULL,
  `discount_amount` DECIMAL(18,4) NULL,
  `currency` VARCHAR(20) NULL,
  `event_date` DATETIME NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_sales_events` (`entity_id`, `branch_id`, `event_uuid`),
  KEY `idx_peckish_sales_events_tenant` (`entity_id`, `branch_id`),
  KEY `idx_sales_date` (`event_date`),
  KEY `idx_sales_product` (`product_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 19. Receives Events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_receives` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `event_uuid` VARCHAR(100) NOT NULL,
  `restaurant_uuid` VARCHAR(100) NULL,
  `purchase_uuid` VARCHAR(100) NULL,
  `invoice_uuid` VARCHAR(100) NULL,
  `supplier_ref` VARCHAR(100) NULL,
  `item_uuid` VARCHAR(100) NULL,
  `item_name` VARCHAR(255) NULL,
  `quantity` DECIMAL(18,4) NULL,
  `unit_uuid` VARCHAR(100) NULL,
  `unit_cost` DECIMAL(18,4) NULL,
  `total_cost` DECIMAL(18,4) NULL,
  `event_date` DATETIME NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_peckish_receives` (`entity_id`, `branch_id`, `event_uuid`),
  KEY `idx_peckish_receives_tenant` (`entity_id`, `branch_id`),
  KEY `idx_receives_date` (`event_date`),
  KEY `idx_receives_supplier` (`supplier_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 20. API Sync Audit Logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `peckish_sync_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id` INT NULL,
  `branch_id` INT NULL,
  `endpoint` VARCHAR(100) NOT NULL,
  `table_name` VARCHAR(100) NOT NULL,
  `rows_received` INT DEFAULT 0,
  `rows_synced` INT DEFAULT 0,
  `status` VARCHAR(20) DEFAULT 'SUCCESS',
  `error_message` TEXT NULL,
  `synced_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sync_logs_tenant` (`entity_id`, `branch_id`),
  KEY `idx_sync_logs_endpoint` (`endpoint`, `synced_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

