-- Indexes for initial dashboard/app loads.
-- These queries sort most large tables by created_at and join child rows by FK.

CREATE INDEX IF NOT EXISTS idx_products_created_at_desc
ON products (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_categories_display_order
ON categories (display_order ASC);

CREATE INDEX IF NOT EXISTS idx_zones_created_at
ON zones (created_at ASC);

CREATE INDEX IF NOT EXISTS idx_users_created_at_desc
ON users (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_requisition_forms_created_at_desc
ON requisition_forms (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_goods_receipt_notes_created_at_desc
ON goods_receipt_notes (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_notes_created_at_desc
ON delivery_notes (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_audits_created_at_desc
ON inventory_audits (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at_desc
ON inventory_transactions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_variant_batches_variant_expiry_stock
ON variant_batches (variant_id, expiry_date ASC, stock);

CREATE INDEX IF NOT EXISTS idx_requisition_items_product
ON requisition_items (product_id);

CREATE INDEX IF NOT EXISTS idx_receipt_items_product
ON receipt_items (product_id);

CREATE INDEX IF NOT EXISTS idx_delivery_items_product
ON delivery_items (product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_audit_items_audit
ON inventory_audit_items (audit_id);

CREATE INDEX IF NOT EXISTS idx_inventory_audit_items_product
ON inventory_audit_items (product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_audit_items_variant
ON inventory_audit_items (variant_id);
