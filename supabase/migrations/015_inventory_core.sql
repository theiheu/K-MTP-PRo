-- Core warehouse rebuild schema.
-- This migration adds the document/ledger/balance foundation without removing legacy tables.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MASTER DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_name_unique
ON suppliers (LOWER(name));

CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'main'
    CHECK (type IN ('main', 'zone', 'repair_vendor')),
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_warehouses_name_unique
ON warehouses (LOWER(name));

INSERT INTO warehouses (name, type, notes)
SELECT 'Kho chính', 'main', 'Kho vật tư trung tâm'
WHERE NOT EXISTS (
  SELECT 1 FROM warehouses WHERE type = 'main'
);

ALTER TABLE variants
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS min_stock INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_stock INTEGER,
ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'consumable'
  CHECK (item_type IN ('consumable', 'returnable', 'repairable', 'asset'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_variants_sku_unique
ON variants (sku)
WHERE sku IS NOT NULL AND sku <> '';

CREATE INDEX IF NOT EXISTS idx_variants_item_type
ON variants (item_type);

CREATE INDEX IF NOT EXISTS idx_variants_min_stock
ON variants (min_stock);

-- =====================================================
-- DOCUMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS document_sequences (
  document_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (document_type, year)
);

CREATE TABLE IF NOT EXISTS inventory_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_code TEXT NOT NULL UNIQUE,
  document_type TEXT NOT NULL CHECK (
    document_type IN (
      'stock_receipt',
      'stock_issue',
      'requisition',
      'return_to_warehouse',
      'defective_return',
      'repair_issue',
      'repair_return',
      'stock_audit',
      'stock_adjustment',
      'disposal'
    )
  ),
  status TEXT NOT NULL DEFAULT 'draft',
  source_location_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  destination_location_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  requester_id UUID REFERENCES users(id) ON DELETE SET NULL,
  requester_name TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  fulfilled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  received_by UUID REFERENCES users(id) ON DELETE SET NULL,
  document_date DATE NOT NULL DEFAULT CURRENT_DATE,
  needed_by DATE,
  approved_at TIMESTAMP WITH TIME ZONE,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legacy_table TEXT,
  legacy_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_documents_legacy_unique
ON inventory_documents (legacy_table, legacy_id)
WHERE legacy_table IS NOT NULL AND legacy_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_documents_type_status
ON inventory_documents (document_type, status);

CREATE INDEX IF NOT EXISTS idx_inventory_documents_document_date
ON inventory_documents (document_date DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_documents_created_at
ON inventory_documents (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_documents_zone
ON inventory_documents (zone_id);

CREATE INDEX IF NOT EXISTS idx_inventory_documents_supplier
ON inventory_documents (supplier_id);

CREATE TABLE IF NOT EXISTS inventory_document_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES inventory_documents(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID NOT NULL REFERENCES variants(id),
  quantity_requested NUMERIC(12, 2),
  quantity_approved NUMERIC(12, 2),
  quantity_issued NUMERIC(12, 2),
  quantity_received NUMERIC(12, 2),
  unit TEXT,
  unit_price NUMERIC(12, 2),
  batch_code TEXT,
  expiry_date DATE,
  condition TEXT NOT NULL DEFAULT 'good'
    CHECK (condition IN ('good', 'defective', 'damaged', 'repaired', 'disposed')),
  purpose_type TEXT,
  reason TEXT,
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legacy_table TEXT,
  legacy_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_document_items_document
ON inventory_document_items (document_id);

CREATE INDEX IF NOT EXISTS idx_inventory_document_items_product
ON inventory_document_items (product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_document_items_variant
ON inventory_document_items (variant_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_document_items_legacy_unique
ON inventory_document_items (legacy_table, legacy_id)
WHERE legacy_table IS NOT NULL AND legacy_id IS NOT NULL;

-- =====================================================
-- STOCK LEDGER AND BALANCES
-- =====================================================

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES inventory_documents(id),
  document_item_id UUID REFERENCES inventory_document_items(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (
    movement_type IN (
      'IN',
      'OUT',
      'RESERVE',
      'UNRESERVE',
      'TRANSFER',
      'RETURN',
      'RETURN_DEFECTIVE',
      'REPAIR_OUT',
      'REPAIR_IN',
      'ADJUST',
      'DISPOSAL'
    )
  ),
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID NOT NULL REFERENCES variants(id),
  source_location_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  destination_location_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  source_state TEXT CHECK (source_state IN ('available', 'reserved', 'issued', 'defective', 'repairing', 'disposed')),
  destination_state TEXT CHECK (destination_state IN ('available', 'reserved', 'issued', 'defective', 'repairing', 'disposed')),
  quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
  batch_code TEXT,
  expiry_date DATE,
  unit_cost NUMERIC(12, 2),
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_document
ON stock_movements (document_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_variant_occurred
ON stock_movements (variant_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_movements_type_occurred
ON stock_movements (movement_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_movements_source
ON stock_movements (source_location_id, source_state);

CREATE INDEX IF NOT EXISTS idx_stock_movements_destination
ON stock_movements (destination_location_id, destination_state);

CREATE TABLE IF NOT EXISTS stock_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID NOT NULL REFERENCES variants(id),
  balance_state TEXT NOT NULL CHECK (balance_state IN ('available', 'reserved', 'issued', 'defective', 'repairing', 'disposed')),
  batch_code TEXT,
  expiry_date DATE,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_balances_unique
ON stock_balances (
  warehouse_id,
  variant_id,
  balance_state,
  COALESCE(batch_code, ''),
  COALESCE(expiry_date, DATE '9999-12-31')
);

CREATE INDEX IF NOT EXISTS idx_stock_balances_variant
ON stock_balances (variant_id);

CREATE INDEX IF NOT EXISTS idx_stock_balances_state_quantity
ON stock_balances (balance_state, quantity);

-- =====================================================
-- DOCUMENT EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS document_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES inventory_documents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name TEXT,
  from_status TEXT,
  to_status TEXT,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_events_document
ON document_events (document_id, created_at DESC);

-- =====================================================
-- REPORTING VIEWS
-- =====================================================

CREATE OR REPLACE VIEW inventory_stock_on_hand AS
SELECT
  sb.warehouse_id,
  w.name AS warehouse_name,
  w.type AS warehouse_type,
  sb.product_id,
  p.name AS product_name,
  sb.variant_id,
  v.attributes AS variant_attributes,
  v.sku,
  v.unit,
  v.item_type,
  v.min_stock,
  v.max_stock,
  sb.balance_state,
  sb.batch_code,
  sb.expiry_date,
  sb.quantity,
  sb.updated_at
FROM stock_balances sb
JOIN warehouses w ON w.id = sb.warehouse_id
JOIN products p ON p.id = sb.product_id
JOIN variants v ON v.id = sb.variant_id;

CREATE OR REPLACE VIEW low_stock_items AS
SELECT
  warehouse_id,
  warehouse_name,
  product_id,
  product_name,
  variant_id,
  variant_attributes,
  sku,
  unit,
  item_type,
  min_stock,
  max_stock,
  quantity AS available_quantity,
  CASE
    WHEN max_stock IS NOT NULL AND max_stock > quantity THEN max_stock - quantity
    WHEN min_stock IS NOT NULL AND min_stock > quantity THEN min_stock - quantity
    ELSE 0
  END AS suggested_purchase_quantity,
  updated_at
FROM inventory_stock_on_hand
WHERE balance_state = 'available'
  AND min_stock > 0
  AND quantity <= min_stock;

-- =====================================================
-- TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouses_updated_at ON warehouses;
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_documents_updated_at ON inventory_documents;
CREATE TRIGGER update_inventory_documents_updated_at BEFORE UPDATE ON inventory_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CORE FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION get_inventory_document_prefix(p_document_type TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE p_document_type
    WHEN 'requisition' THEN 'YC'
    WHEN 'stock_receipt' THEN 'PNK'
    WHEN 'stock_issue' THEN 'PXK'
    WHEN 'stock_audit' THEN 'PKK'
    WHEN 'stock_adjustment' THEN 'PDC'
    WHEN 'return_to_warehouse' THEN 'PTH'
    WHEN 'defective_return' THEN 'PTH'
    WHEN 'repair_issue' THEN 'PSC'
    WHEN 'repair_return' THEN 'PSC'
    WHEN 'disposal' THEN 'PTL'
    ELSE 'CT'
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION next_inventory_document_code(p_document_type TEXT, p_document_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT AS $$
DECLARE
  v_year INTEGER := EXTRACT(YEAR FROM p_document_date)::INTEGER;
  v_prefix TEXT := get_inventory_document_prefix(p_document_type);
  v_next_number INTEGER;
  v_document_code TEXT;
BEGIN
  LOOP
    INSERT INTO document_sequences (document_type, year, last_number)
    VALUES (v_prefix, v_year, 1)
    ON CONFLICT (document_type, year)
    DO UPDATE SET
      last_number = document_sequences.last_number + 1,
      updated_at = NOW()
    RETURNING last_number INTO v_next_number;

    v_document_code := v_prefix || '-' || v_year || '-' || LPAD(v_next_number::TEXT, 6, '0');

    IF NOT EXISTS (
      SELECT 1 FROM inventory_documents WHERE document_code = v_document_code
    ) THEN
      RETURN v_document_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION apply_stock_balance_delta(
  p_warehouse_id UUID,
  p_product_id UUID,
  p_variant_id UUID,
  p_balance_state TEXT,
  p_delta NUMERIC,
  p_batch_code TEXT DEFAULT NULL,
  p_expiry_date DATE DEFAULT NULL,
  p_allow_negative BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
  v_current_quantity NUMERIC(12, 2);
BEGIN
  IF p_warehouse_id IS NULL OR p_balance_state IS NULL OR p_delta = 0 THEN
    RETURN;
  END IF;

  INSERT INTO stock_balances (
    warehouse_id,
    product_id,
    variant_id,
    balance_state,
    batch_code,
    expiry_date,
    quantity
  )
  VALUES (
    p_warehouse_id,
    p_product_id,
    p_variant_id,
    p_balance_state,
    p_batch_code,
    p_expiry_date,
    0
  )
  ON CONFLICT (
    warehouse_id,
    variant_id,
    balance_state,
    (COALESCE(batch_code, '')),
    (COALESCE(expiry_date, DATE '9999-12-31'))
  )
  DO NOTHING;

  SELECT quantity
  INTO v_current_quantity
  FROM stock_balances
  WHERE warehouse_id = p_warehouse_id
    AND variant_id = p_variant_id
    AND balance_state = p_balance_state
    AND COALESCE(batch_code, '') = COALESCE(p_batch_code, '')
    AND COALESCE(expiry_date, DATE '9999-12-31') = COALESCE(p_expiry_date, DATE '9999-12-31')
  FOR UPDATE;

  IF NOT p_allow_negative AND v_current_quantity + p_delta < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for variant %, state %', p_variant_id, p_balance_state;
  END IF;

  UPDATE stock_balances
  SET
    quantity = v_current_quantity + p_delta,
    updated_at = NOW()
  WHERE warehouse_id = p_warehouse_id
    AND variant_id = p_variant_id
    AND balance_state = p_balance_state
    AND COALESCE(batch_code, '') = COALESCE(p_batch_code, '')
    AND COALESCE(expiry_date, DATE '9999-12-31') = COALESCE(p_expiry_date, DATE '9999-12-31');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION post_stock_movement(
  p_document_id UUID,
  p_document_item_id UUID,
  p_movement_type TEXT,
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity NUMERIC,
  p_source_location_id UUID DEFAULT NULL,
  p_destination_location_id UUID DEFAULT NULL,
  p_source_state TEXT DEFAULT NULL,
  p_destination_state TEXT DEFAULT NULL,
  p_batch_code TEXT DEFAULT NULL,
  p_expiry_date DATE DEFAULT NULL,
  p_unit_cost NUMERIC DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_allow_negative BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_movement_id UUID;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Movement quantity must be greater than 0';
  END IF;

  IF p_source_location_id IS NULL AND p_destination_location_id IS NULL THEN
    RAISE EXCEPTION 'Movement requires a source or destination location';
  END IF;

  PERFORM apply_stock_balance_delta(
    p_source_location_id,
    p_product_id,
    p_variant_id,
    p_source_state,
    -p_quantity,
    p_batch_code,
    p_expiry_date,
    p_allow_negative
  );

  PERFORM apply_stock_balance_delta(
    p_destination_location_id,
    p_product_id,
    p_variant_id,
    p_destination_state,
    p_quantity,
    p_batch_code,
    p_expiry_date,
    TRUE
  );

  INSERT INTO stock_movements (
    document_id,
    document_item_id,
    movement_type,
    product_id,
    variant_id,
    source_location_id,
    destination_location_id,
    source_state,
    destination_state,
    quantity,
    batch_code,
    expiry_date,
    unit_cost,
    created_by,
    notes,
    metadata
  )
  VALUES (
    p_document_id,
    p_document_item_id,
    p_movement_type,
    p_product_id,
    p_variant_id,
    p_source_location_id,
    p_destination_location_id,
    p_source_state,
    p_destination_state,
    p_quantity,
    p_batch_code,
    p_expiry_date,
    p_unit_cost,
    p_created_by,
    p_notes,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_movement_id;

  RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_inventory_document(
  p_document_type TEXT,
  p_status TEXT DEFAULT 'draft',
  p_source_location_id UUID DEFAULT NULL,
  p_destination_location_id UUID DEFAULT NULL,
  p_supplier_id UUID DEFAULT NULL,
  p_zone_id UUID DEFAULT NULL,
  p_requester_id UUID DEFAULT NULL,
  p_requester_name TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_document_date DATE DEFAULT CURRENT_DATE,
  p_needed_by DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_legacy_table TEXT DEFAULT NULL,
  p_legacy_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
  v_document_code TEXT;
  v_item JSONB;
  v_display_order INTEGER := 0;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'Document items must be a JSON array';
  END IF;

  v_document_code := next_inventory_document_code(p_document_type, p_document_date);

  INSERT INTO inventory_documents (
    document_code,
    document_type,
    status,
    source_location_id,
    destination_location_id,
    supplier_id,
    zone_id,
    requester_id,
    requester_name,
    created_by,
    document_date,
    needed_by,
    notes,
    metadata,
    legacy_table,
    legacy_id
  )
  VALUES (
    v_document_code,
    p_document_type,
    COALESCE(p_status, 'draft'),
    p_source_location_id,
    p_destination_location_id,
    p_supplier_id,
    p_zone_id,
    p_requester_id,
    p_requester_name,
    p_created_by,
    COALESCE(p_document_date, CURRENT_DATE),
    p_needed_by,
    p_notes,
    COALESCE(p_metadata, '{}'::jsonb),
    p_legacy_table,
    p_legacy_id
  )
  RETURNING id INTO v_document_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO inventory_document_items (
      document_id,
      product_id,
      variant_id,
      quantity_requested,
      quantity_approved,
      quantity_issued,
      quantity_received,
      unit,
      unit_price,
      batch_code,
      expiry_date,
      condition,
      purpose_type,
      reason,
      notes,
      display_order,
      metadata
    )
    VALUES (
      v_document_id,
      (v_item->>'productId')::UUID,
      (v_item->>'variantId')::UUID,
      NULLIF(v_item->>'quantityRequested', '')::NUMERIC,
      NULLIF(v_item->>'quantityApproved', '')::NUMERIC,
      NULLIF(v_item->>'quantityIssued', '')::NUMERIC,
      NULLIF(v_item->>'quantityReceived', '')::NUMERIC,
      v_item->>'unit',
      NULLIF(v_item->>'unitPrice', '')::NUMERIC,
      v_item->>'batchCode',
      NULLIF(v_item->>'expiryDate', '')::DATE,
      COALESCE(v_item->>'condition', 'good'),
      v_item->>'purposeType',
      v_item->>'reason',
      v_item->>'notes',
      COALESCE(NULLIF(v_item->>'displayOrder', '')::INTEGER, v_display_order),
      COALESCE(v_item->'metadata', '{}'::jsonb)
    );

    v_display_order := v_display_order + 1;
  END LOOP;

  INSERT INTO document_events (
    document_id,
    event_type,
    actor_id,
    to_status,
    notes
  )
  VALUES (
    v_document_id,
    'created',
    p_created_by,
    COALESCE(p_status, 'draft'),
    p_notes
  );

  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_stock_receipt(
  p_supplier_id UUID DEFAULT NULL,
  p_supplier_name TEXT DEFAULT NULL,
  p_destination_location_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_created_by_name TEXT DEFAULT NULL,
  p_document_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_legacy_table TEXT DEFAULT NULL,
  p_legacy_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
  v_document_code TEXT;
  v_supplier_id UUID := p_supplier_id;
  v_destination_location_id UUID := p_destination_location_id;
  v_item JSONB;
  v_document_item_id UUID;
  v_quantity NUMERIC(12, 2);
  v_display_order INTEGER := 0;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Stock receipt requires at least one item';
  END IF;

  IF v_supplier_id IS NULL AND NULLIF(TRIM(COALESCE(p_supplier_name, '')), '') IS NOT NULL THEN
    SELECT id
    INTO v_supplier_id
    FROM suppliers
    WHERE LOWER(name) = LOWER(TRIM(p_supplier_name))
    LIMIT 1;

    IF v_supplier_id IS NULL THEN
      INSERT INTO suppliers (name)
      VALUES (TRIM(p_supplier_name))
      RETURNING id INTO v_supplier_id;
    END IF;
  END IF;

  IF v_destination_location_id IS NULL THEN
    SELECT id
    INTO v_destination_location_id
    FROM warehouses
    WHERE type = 'main' AND is_active = TRUE
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_destination_location_id IS NULL THEN
    RAISE EXCEPTION 'Stock receipt requires a destination warehouse';
  END IF;

  v_document_code := next_inventory_document_code('stock_receipt', p_document_date);

  INSERT INTO inventory_documents (
    document_code,
    document_type,
    status,
    destination_location_id,
    supplier_id,
    requester_name,
    created_by,
    document_date,
    notes,
    metadata,
    legacy_table,
    legacy_id
  )
  VALUES (
    v_document_code,
    'stock_receipt',
    'posted',
    v_destination_location_id,
    v_supplier_id,
    p_created_by_name,
    p_created_by,
    COALESCE(p_document_date, CURRENT_DATE),
    p_notes,
    COALESCE(p_metadata, '{}'::jsonb),
    p_legacy_table,
    p_legacy_id
  )
  RETURNING id INTO v_document_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := COALESCE(
      NULLIF(v_item->>'quantityReceived', '')::NUMERIC,
      NULLIF(v_item->>'quantity', '')::NUMERIC
    );

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Stock receipt item quantity must be greater than 0';
    END IF;

    INSERT INTO inventory_document_items (
      document_id,
      product_id,
      variant_id,
      quantity_received,
      unit,
      unit_price,
      batch_code,
      expiry_date,
      condition,
      notes,
      display_order,
      metadata
    )
    VALUES (
      v_document_id,
      (v_item->>'productId')::UUID,
      (v_item->>'variantId')::UUID,
      v_quantity,
      v_item->>'unit',
      NULLIF(v_item->>'unitPrice', '')::NUMERIC,
      v_item->>'batchCode',
      NULLIF(v_item->>'expiryDate', '')::DATE,
      COALESCE(v_item->>'condition', 'good'),
      v_item->>'notes',
      COALESCE(NULLIF(v_item->>'displayOrder', '')::INTEGER, v_display_order),
      COALESCE(v_item->'metadata', '{}'::jsonb)
    )
    RETURNING id INTO v_document_item_id;

    PERFORM post_stock_movement(
      v_document_id,
      v_document_item_id,
      'IN',
      (v_item->>'productId')::UUID,
      (v_item->>'variantId')::UUID,
      v_quantity,
      NULL,
      v_destination_location_id,
      NULL,
      'available',
      v_item->>'batchCode',
      NULLIF(v_item->>'expiryDate', '')::DATE,
      NULLIF(v_item->>'unitPrice', '')::NUMERIC,
      p_created_by,
      p_notes,
      COALESCE(v_item->'metadata', '{}'::jsonb),
      FALSE
    );

    v_display_order := v_display_order + 1;
  END LOOP;

  INSERT INTO document_events (
    document_id,
    event_type,
    actor_id,
    actor_name,
    to_status,
    notes
  )
  VALUES (
    v_document_id,
    'posted_stock_receipt',
    p_created_by,
    p_created_by_name,
    'posted',
    p_notes
  );

  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rebuild_stock_balances()
RETURNS VOID AS $$
DECLARE
  movement RECORD;
BEGIN
  TRUNCATE TABLE stock_balances;

  FOR movement IN
    SELECT * FROM stock_movements ORDER BY occurred_at ASC, created_at ASC
  LOOP
    PERFORM apply_stock_balance_delta(
      movement.source_location_id,
      movement.product_id,
      movement.variant_id,
      movement.source_state,
      -movement.quantity,
      movement.batch_code,
      movement.expiry_date,
      TRUE
    );

    PERFORM apply_stock_balance_delta(
      movement.destination_location_id,
      movement.product_id,
      movement.variant_id,
      movement.destination_state,
      movement.quantity,
      movement.batch_code,
      movement.expiry_date,
      TRUE
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS PLACEHOLDER POLICIES
-- =====================================================

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users on suppliers" ON suppliers;
DROP POLICY IF EXISTS "Enable write access for all users on suppliers" ON suppliers;
CREATE POLICY "Enable read access for all users on suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users on suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for all users on warehouses" ON warehouses;
DROP POLICY IF EXISTS "Enable write access for all users on warehouses" ON warehouses;
CREATE POLICY "Enable read access for all users on warehouses" ON warehouses FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users on warehouses" ON warehouses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for all users on document_sequences" ON document_sequences;
DROP POLICY IF EXISTS "Enable write access for all users on document_sequences" ON document_sequences;
CREATE POLICY "Enable read access for all users on document_sequences" ON document_sequences FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users on document_sequences" ON document_sequences FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for all users on inventory_documents" ON inventory_documents;
DROP POLICY IF EXISTS "Enable write access for all users on inventory_documents" ON inventory_documents;
CREATE POLICY "Enable read access for all users on inventory_documents" ON inventory_documents FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users on inventory_documents" ON inventory_documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for all users on inventory_document_items" ON inventory_document_items;
DROP POLICY IF EXISTS "Enable write access for all users on inventory_document_items" ON inventory_document_items;
CREATE POLICY "Enable read access for all users on inventory_document_items" ON inventory_document_items FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users on inventory_document_items" ON inventory_document_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for all users on stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "Enable write access for all users on stock_movements" ON stock_movements;
CREATE POLICY "Enable read access for all users on stock_movements" ON stock_movements FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users on stock_movements" ON stock_movements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for all users on stock_balances" ON stock_balances;
DROP POLICY IF EXISTS "Enable write access for all users on stock_balances" ON stock_balances;
CREATE POLICY "Enable read access for all users on stock_balances" ON stock_balances FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users on stock_balances" ON stock_balances FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for all users on document_events" ON document_events;
DROP POLICY IF EXISTS "Enable write access for all users on document_events" ON document_events;
CREATE POLICY "Enable read access for all users on document_events" ON document_events FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users on document_events" ON document_events FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
